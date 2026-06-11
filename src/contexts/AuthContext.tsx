import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { PlanType, UserType, TablesUpdate } from '@/types/database';

export interface User {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  isProfileComplete?: boolean;
  plan?: PlanType;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, captchaToken?: string) => Promise<User | null>;
  register: (
    name: string,
    email: string,
    password: string,
    userType: UserType,
    plan?: PlanType,
    captchaToken?: string,
  ) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  updateUserProfile: (profileData: Partial<User> & Record<string, unknown>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Carrega o User da aplicação a partir da sessão autenticada, buscando o
 * profile (e o plano, se for clínica). A identidade vem sempre do JWT da
 * sessão — nunca de dados fornecidos pelo cliente.
 */
async function loadUserFromSession(session: Session): Promise<User | null> {
  const authUser = session.user;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, user_type, is_profile_complete')
    .eq('id', authUser.id)
    .single();

  if (error || !profile) {
    // O profile é criado por trigger no signup; logo após o registro pode
    // haver uma janela curta até estar disponível. Não propagamos detalhes.
    console.warn('[Auth] Profile ainda não disponível para a sessão atual');
    return null;
  }

  let plan: PlanType | undefined;
  if (profile.user_type === 'clinic') {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('plan')
      .eq('id', authUser.id)
      .single();
    plan = clinic?.plan;
  }

  return {
    id: authUser.id,
    name: profile.name,
    email: authUser.email ?? '',
    userType: profile.user_type,
    isProfileComplete: profile.is_profile_complete,
    plan,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Sessão existente ao carregar a página.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const loaded = await loadUserFromSession(session);
        if (mounted) setUser(loaded);
      }
      if (mounted) setLoading(false);
    });

    // 2. Reage a login/logout/refresh de token em qualquer aba.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const loaded = await loadUserFromSession(session);
        if (mounted) setUser(loaded);
      } else if (mounted) {
        setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    userType: UserType,
    plan?: PlanType,
    captchaToken?: string,
  ): Promise<User | null> => {
    // name/user_type/plan vão em metadata; o trigger handle_new_user() cria
    // as linhas em profiles (e clinics, se for clínica).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        data: {
          name,
          user_type: userType,
          plan: userType === 'clinic' ? plan : undefined,
          consent_at: new Date().toISOString(),
          consent_version: '1.0',
        },
      },
    });

    if (error) {
      // Mensagem genérica — não confirma existência do e-mail (Req 1.3).
      throw new Error('Não foi possível completar o cadastro');
    }

    // Se a confirmação de e-mail estiver desativada, já existe sessão →
    // autentica de imediato. Caso contrário, retorna null (aguarda confirmação).
    if (data.session) {
      const loaded = await loadUserFromSession(data.session);
      setUser(loaded);
      return loaded;
    }
    return null;
  }, []);

  const login = useCallback(async (email: string, password: string, captchaToken?: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (error || !data.session) {
      // Mensagem genérica — não revela se é e-mail ou senha (Req 2.2).
      throw new Error('E-mail ou senha incorretos');
    }
    // Carrega o user de imediato para que o redirect pós-login seja correto
    // (não dá pra esperar o onAuthStateChange, que é assíncrono).
    const loaded = await loadUserFromSession(data.session);
    setUser(loaded);
    return loaded;
  }, []);

  const logout = useCallback(() => {
    void supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateUserProfile = useCallback(async (
    profileData: Partial<User> & Record<string, unknown>,
  ) => {
    if (!user) return;

    // Mapeia apenas as colunas conhecidas da tabela profiles. Campos
    // específicos de clínica (endereço, CNPJ, especialidades…) serão
    // persistidos na tabela clinics nas tarefas de onboarding (Task 18/19).
    const profileUpdate: TablesUpdate<'profiles'> = { is_profile_complete: true };
    if (typeof profileData.name === 'string') profileUpdate.name = profileData.name;
    if (typeof profileData.phone === 'string') profileUpdate.phone = profileData.phone;
    if (typeof profileData.address === 'string') profileUpdate.address = profileData.address;

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id);

    if (error) {
      throw new Error('Não foi possível salvar o perfil');
    }

    setUser((prev) => (prev ? { ...prev, ...profileData, isProfileComplete: true } : prev));
  }, [user]);

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
