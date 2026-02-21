'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, type MerchantInfo } from '@/lib/api';

interface AuthContextType {
  merchant: MerchantInfo | null;
  loading: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  merchant: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const me = await api.me();
      setMerchant(me);
    } catch {
      setMerchant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (token: string): Promise<boolean> => {
    try {
      await api.createSession(token);
      await checkSession();
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Cookie already cleared or expired
    }
    setMerchant(null);
  };

  return (
    <AuthContext.Provider value={{ merchant, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
