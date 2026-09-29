import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { clearChatSession } from "@/lib/chat-store";
import { resetPersistentState } from "@/lib/persistent-state";
import { api, type User } from "@/lib/api";
import { getToken, setToken } from "@/lib/api/client";

type AuthState = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    api.auth
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.auth.login(email, password);
    setToken(r.access_token);
    setUser(r.user);
  }, []);
  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const r = await api.auth.signup(email, password, name);
    setToken(r.access_token);
    setUser(r.user);
  }, []);
  const logout = useCallback(async () => {
    await api.auth.logout();
    setToken(null);
    setUser(null);
    clearChatSession();
    resetPersistentState();
  }, []);

  return <Ctx.Provider value={{ user, ready, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
