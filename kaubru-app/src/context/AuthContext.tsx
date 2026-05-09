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
  is_verified: boolean;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  pendingVerification: boolean;
  setPendingVerification: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  socialLogin: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  resendOtp: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY                = 'token';
const USER_KEY                 = 'cached_user';
const PENDING_VERIFICATION_KEY = 'pending_verification';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                           = useState<User | null>(null);
  const [token, setToken]                         = useState<string | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [pendingVerification, setPendingVerificationState] = useState(false);

  // Persist user to AsyncStorage so it survives app restarts
  const persistUser = async (u: User | null) => {
    try {
      if (u) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      } else {
        await AsyncStorage.removeItem(USER_KEY);
      }
    } catch {}
  };

  const setAndPersistUser = (u: User | null) => {
    setUser(u);
    persistUser(u);
  };

  // Persist pendingVerification to AsyncStorage
  const persistPendingVerification = async (value: boolean) => {
    try {
      if (value) {
        await AsyncStorage.setItem(PENDING_VERIFICATION_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
      }
    } catch {}
  };

  const setPendingVerification = (value: boolean) => {
    setPendingVerificationState(value);
    persistPendingVerification(value);
  };

  useEffect(() => {
    // Restore session on app start
    (async () => {
      try {
        const [storedToken, storedUser, storedPending] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(PENDING_VERIFICATION_KEY),
        ]);

        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);

        // Immediately restore pending verification for instant routing on cold start
        if (storedPending === 'true') {
          setPendingVerificationState(true);
        }

        // Immediately restore cached user so UI shows instantly
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
          } catch {}
        }

        // Then fetch fresh user data from server in background
        try {
          const res = await authAPI.me();
          setAndPersistUser(res.data);

          // Sync pendingVerification with fresh server data
          if (res.data.is_verified === false) {
            setPendingVerificationState(true);
            await persistPendingVerification(true);
          } else {
            setPendingVerificationState(false);
            await persistPendingVerification(false);
          }
        } catch (err: any) {
          // 401 = token expired/invalid → log out
          if (err?.response?.status === 401) {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PENDING_VERIFICATION_KEY]);
            setToken(null);
            setUser(null);
            setPendingVerificationState(false);
          }
          // Network error → keep cached user, stay logged in
        }
      } catch (e) {
        console.error('AuthContext restore error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { access_token } = res.data;
    await AsyncStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await authAPI.me();
    setAndPersistUser(me.data);
    // Backend enforces is_verified on login, so this is always safe
    setPendingVerification(false);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await authAPI.signup(name, email, password);
    const { access_token, is_verified } = res.data;
    await AsyncStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await authAPI.me();
    setAndPersistUser(me.data);
    if (is_verified === false) {
      setPendingVerification(true);
    } else {
      setPendingVerification(false);
    }
  };

  const socialLogin = async (payload: any) => {
    const res = await authAPI.socialLogin(payload);
    const { access_token } = res.data;
    await AsyncStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await authAPI.me();
    setAndPersistUser(me.data);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PENDING_VERIFICATION_KEY]);
    setToken(null);
    setUser(null);
    setPendingVerificationState(false);
  };

  const refreshUser = async () => {
    const me = await authAPI.me();
    setAndPersistUser(me.data);
  };

  const verifyOtp = async (otp: string) => {
    await authAPI.verifyOtp(otp);
    const me = await authAPI.me();
    setAndPersistUser(me.data);
    setPendingVerification(false);
  };

  const resendOtp = async () => {
    return authAPI.resendOtp();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pendingVerification,
        setPendingVerification,
        login,
        signup,
        socialLogin,
        logout,
        refreshUser,
        verifyOtp,
        resendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
