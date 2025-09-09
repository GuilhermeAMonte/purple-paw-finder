import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
// Função simples de hash para ambiente de testes (não usar em produção)
function simpleHash(str: string): string {
  let hash = 0, i, chr;
  if (str.length === 0) return hash.toString();
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString();
}

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'client' | 'clinic';
  isProfileComplete?: boolean;
  plan?: 'free' | 'basic' | 'intermediary' | 'experience';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, userType: 'client' | 'clinic', plan?: 'free' | 'basic' | 'intermediary' | 'experience') => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Recuperar usuário do localStorage ao inicializar
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, userType: 'client' | 'clinic', plan?: 'free' | 'basic' | 'intermediary' | 'experience'): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (existingUsers.some((u: any) => u.email === email)) {
        throw new Error('Email já cadastrado');
      }

      const hashedPassword = simpleHash(password); // Hash simples

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        userType,
        plan: userType === 'clinic' ? plan : undefined,
        isProfileComplete: userType === 'client'
      };

      console.log('Criando novo usuário:', newUser);

      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      console.log('Usuário salvo no localStorage users:', updatedUsers);

      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const foundUser = users.find((u: any) => u.email === email);

      console.log('Tentativa de login para:', email);
      console.log('Usuário encontrado:', foundUser);

      if (!foundUser || simpleHash(password) !== foundUser.password) {
        throw new Error('Credenciais inválidas');
      }

      const userWithoutPassword = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        userType: foundUser.userType,
        isProfileComplete: foundUser.isProfileComplete
      };

      console.log('Usuário logado:', userWithoutPassword);

      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));

      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Adicionar tipagem ao profileData
  const updateUserProfile = async (profileData: Partial<User>) => {
    if (!user) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);

    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...profileData, isProfileComplete: true };
      localStorage.setItem('users', JSON.stringify(users));

      const updatedUser = { ...user, ...profileData, isProfileComplete: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
