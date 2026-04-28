import { createContext, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/api';
import { clearStoredSession, getStoredSession, saveSession } from '../services/sessionStorage';
import type { AuthSession } from '../types/domain';

type AuthContextValue = {
  session: AuthSession | null;
  authenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthSession>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  async function login(credentials: { email: string; password: string }) {
    const nextSession = await authService.login(credentials);
    saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }

  function logout() {
    clearStoredSession();
    setSession(null);
  }

  const value = useMemo(
    () => ({
      session,
      authenticated: Boolean(session?.accessToken),
      login,
      logout,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
