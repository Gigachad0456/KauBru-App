import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  points: number;
  is_premium: boolean;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  socialLogin: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on app start
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('token');
        if (stored) {
          setToken(stored);
          try {
            const res = await authAPI.me();
            setUser(res.data);
          } catch (err: any) {
            console.log('Session restore fetch user error:', err?.message);
            // Only clear token if it's definitely invalid (401)
            // If it's a network error (no response), keep the token
            if (err?.response?.status === 401) {
              await AsyncStorage.removeItem('token');
              setToken(null);
            }
          }
        }
      } catch (e) {
        console.error('AsyncStorage error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { access_token } = res.data;
    await AsyncStorage.setItem('token', access_token);
    setToken(access_token);
    const me = await authAPI.me();
    setUser(me.data);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await authAPI.signup(name, email, password);
    const { access_token } = res.data;
    await AsyncStorage.setItem('token', access_token);
    setToken(access_token);
    const me = await authAPI.me();
    setUser(me.data);
  };

  const socialLogin = async (payload: any) => {
    const res = await authAPI.socialLogin(payload);
    const { access_token } = res.data;
    await AsyncStorage.setItem('token', access_token);
    setToken(access_token);
    const me = await authAPI.me();
    setUser(me.data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await authAPI.me();
    setUser(me.data);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, socialLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
