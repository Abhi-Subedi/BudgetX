"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import * as apiClient from "../lib/api";
import type { Tokens, User } from "../types";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; currency: string }) => Promise<void>;
  loginWithOAuth: (code: string, provider: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const me = await apiClient.get<User>("/users/me");
      setUser(me);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const stored = apiClient.restoreTokens();
    if (stored) {
      loadUser().finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [loadUser]);

  useEffect(() => {
    apiClient.setSessionExpiredHandler(() => setUser(null));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.post<{ user: User; tokens: Tokens }>("/auth/login", { email, password });
    apiClient.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; currency: string }) => {
      const data = await apiClient.post<{ user: User; tokens: Tokens }>("/auth/register", input);
      apiClient.setTokens(data.tokens.access_token, data.tokens.refresh_token);
      setUser(data.user);
    },
    []
  );

  const loginWithOAuth = useCallback(async (code: string, provider: string) => {
    const data = await apiClient.post<{ user: User; tokens: Tokens }>(
      `/oauth/${provider}/callback`,
      { code }
    );
    apiClient.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    apiClient.setTokens(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const value = useMemo(
    () => ({ user, ready, login, register, loginWithOAuth, logout, refreshUser }),
    [user, ready, login, register, loginWithOAuth, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
