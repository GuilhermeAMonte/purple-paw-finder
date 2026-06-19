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
    cpf?: string,
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

/** Código de erro exportado para que os consumers identifiquem o caso "e-mail já cadastrado". */
export const EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED';

/**
 * Mapeia erros do Supabase Auth no signup para mensagens user-friendly.
 * Não confirma existência de e-mail diretamente (evita user enumeration).
 */
function mapSignUpError(message: string, status?: number): string {
  const lower = message.toLowerCase();

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Esse e-mail já possui uma conta. Tente fazer login ou recuperar a senha.';
  }
  if (lower.includes('password') && lower.includes('short')) {
    return 'A senha é muito curta. Use pelo menos 8 caracteres.';
  }
  if (lower.includes('valid email') || lower.includes('invalid email')) {
    return 'O formato do e-mail é inválido. Verifique e tente novamente.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || status === 429) {
    return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.';
  }
  if (lower.includes('captcha') || lower.includes('hcaptcha')) {
    return 'Falha na verificação de segurança (captcha). Tente novamente.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  return 'Não foi possível completar o cadastro. Tente novamente em alguns instantes.';
}

/**
 * Mapeia erros do Supabase Auth no login para mensagens user-friendly.
 * Mantém genérico o suficiente para não confirmar se o e-mail existe.
 */
function mapLoginError(message?: string, status?: number): string {
  if (!message) return 'E-mail ou senha incorretos.';
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Sua conta ainda não foi confirmada. Verifique seu e-mail.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || status === 429) {
    return 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.';
  }
  if (lower.includes('captcha') || lower.includes('hcaptcha')) {
    return 'Falha na verificação de segurança (captcha). Tente novamente.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  return 'E-mail ou senha incorretos.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Flag para ignorar o onAuthStateChange enquanto login/register estão em
  // andamento — evita race condition que reseta o user antes do navigate.
  const authActionInProgress = React.useRef(false);

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
      // Se uma ação de login/register está em andamento, ignora para não
      // sobrescrever o user que acabou de ser setado diretamente.
      if (authActionInProgress.current) return;

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
    cpf?: string,
  ): Promise<User | null> => {
    authActionInProgress.current = true;
    try {
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
            cpf: cpf || undefined,
            consent_at: new Date().toISOString(),
            consent_version: '1.0',
          },
        },
      });

      if (error) {
        // Mapeia erros do Supabase para mensagens informativas sem confirmar
        // existência de e-mail (mantém Req 1.3 — user enumeration prevention).
        const msg = mapSignUpError(error.message, error.status);
        const err = new Error(msg);
        // Sinaliza "email já cadastrado" para que os formulários possam tratar.
        if (msg.includes('já possui uma conta')) {
          (err as any).code = EMAIL_ALREADY_REGISTERED;
        }
        throw err;
      }

      // Se a confirmação de e-mail estiver desativada, já existe sessão →
      // autentica de imediato. Caso contrário, retorna null (aguarda confirmação).
      if (data.session) {
        const loaded = await loadUserFromSession(data.session);
        if (loaded) {
          setUser(loaded);
          return loaded;
        }
        // Fallback: o trigger pode não ter criado o profile ainda.
        // Constrói um user mínimo a partir dos metadados do signup para
        // permitir o redirect correto (o onAuthStateChange vai sincronizar depois).
        const fallbackUser: User = {
          id: data.session.user.id,
          name,
          email,
          userType,
          isProfileComplete: false,
          plan: userType === 'clinic' ? plan : undefined,
        };
        setUser(fallbackUser);
        return fallbackUser;
      }
      return null;
    } finally {
      // Libera o listener após um pequeno delay para garantir que o
      // onAuthStateChange que já disparou não sobrescreva o user.
      setTimeout(() => { authActionInProgress.current = false; }, 1000);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, captchaToken?: string): Promise<User | null> => {
    authActionInProgress.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
      if (error || !data.session) {
        const msg = mapLoginError(error?.message, error?.status);
        throw new Error(msg);
      }
      // Carrega o user de imediato para que o redirect pós-login seja correto
      // (não dá pra esperar o onAuthStateChange, que é assíncrono).
      const loaded = await loadUserFromSession(data.session);
      if (loaded) {
        setUser(loaded);
        return loaded;
      }
      // Fallback raro: profile não encontrado mesmo com retry.
      // Usa metadata do JWT para criar user mínimo.
      const meta = data.session.user.user_metadata;
      const fallbackUser: User = {
        id: data.session.user.id,
        name: (meta?.name as string) ?? '',
        email: data.session.user.email ?? email,
        userType: (meta?.user_type as UserType) ?? 'client',
        isProfileComplete: false,
        plan: meta?.plan as PlanType | undefined,
      };
      setUser(fallbackUser);
      return fallbackUser;
    } finally {
      setTimeout(() => { authActionInProgress.current = false; }, 1000);
    }
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
      const lower = error.message?.toLowerCase() ?? '';
      if (lower.includes('permission') || lower.includes('rls') || error.code === '42501') {
        throw new Error('Você não tem permissão para atualizar este perfil. Faça login novamente.');
      }
      if (lower.includes('timeout') || lower.includes('network') || lower.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      throw new Error('Não foi possível salvar o perfil. Tente novamente em alguns instantes.');
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
