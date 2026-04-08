'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type AuthUser } from './api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; org_name: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// DEV BYPASS: skip auth when backend isn't running
const DEV_BYPASS = process.env.NODE_ENV === 'development';
const DEV_USER: AuthUser = { id: 'dev-1', email: 'greg@vsco.co', name: 'Greg' } as AuthUser;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEV_BYPASS ? DEV_USER : null);
  const [loading, setLoading] = useState(DEV_BYPASS ? false : true);

  // Restore user from session on mount
  useEffect(() => {
    if (DEV_BYPASS) return; // Skip API calls in dev
    const stored = api.getUser();
    if (stored && api.isAuthenticated()) {
      setUser(stored);
      // Verify token is still valid
      api.me()
        .then(res => setUser(res.user))
        .catch(() => {
          api.clearToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name: string; org_name: string }) => {
    const res = await api.register(data);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
