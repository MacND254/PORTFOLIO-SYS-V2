import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  socialLogin: (data: {
    provider: 'google' | 'github';
    email: string;
    fullName: string;
    providerId?: string;
    avatarUrl?: string;
    desiredSubdomain?: string;
    desiredProfession?: string;
  }) => Promise<void>;
  setSession: (token: string, userData?: User) => Promise<User | null>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      if (!token) setToken(storedToken);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('token') || token;
    if (!currentToken) {
      setUser(null);
      setToken(null);
      return;
    }
    try {
      const res: any = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.data) {
        setUser(res.data);
        setToken(currentToken);
      }
    } catch {
      logout();
    }
  };

  const setSession = async (newToken: string, userData?: User): Promise<User | null> => {
    localStorage.setItem('token', newToken);
    setToken(newToken);

    if (userData) {
      setUser(userData);
      setIsLoading(false);
      return userData;
    }

    setIsLoading(true);
    try {
      const res: any = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      if (res?.data) {
        setUser(res.data);
        setIsLoading(false);
        return res.data;
      }
    } catch (err) {
      logout();
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
    return null;
  };

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const socialLogin = async (data: {
    provider: 'google' | 'github';
    email: string;
    fullName: string;
    providerId?: string;
    avatarUrl?: string;
    desiredSubdomain?: string;
    desiredProfession?: string;
  }) => {
    const res: any = await api.post('/auth/social-login', data);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const register = async (data: any) => {
    const res: any = await api.post('/auth/register', data);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        socialLogin,
        setSession,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

