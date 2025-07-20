
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'client' | 'clinic';
  isProfileComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, userType: 'client' | 'clinic') => Promise<boolean>;
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

  const register = async (name: string, email: string, password: string, userType: 'client' | 'clinic'): Promise<boolean> => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se o email já existe
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (existingUsers.some((u: any) => u.email === email)) {
        throw new Error('Email já cadastrado');
      }

      // Criar novo usuário
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // Em produção, a senha seria hasheada
        userType,
        isProfileComplete: userType === 'client' // Clientes têm perfil completo por padrão
      };

      // Salvar usuário na "base de dados" (localStorage)
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      return true;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar usuário na "base de dados"
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error('Credenciais inválidas');
      }

      // Criar objeto do usuário sem a senha
      const userWithoutPassword = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        userType: foundUser.userType,
        isProfileComplete: foundUser.isProfileComplete
      };

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

  const updateUserProfile = async (profileData: any) => {
    if (!user) return;

    // Atualizar usuário no localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...profileData, isProfileComplete: true };
      localStorage.setItem('users', JSON.stringify(users));
      
      // Atualizar usuário atual
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
