import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface User {
  id: number;
  full_name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredSession(): { token: string | null; user: User | null } {
  try {
    const token = sessionStorage.getItem("token");
    const rawUser = sessionStorage.getItem("user");
    if (!token || !rawUser) return { token: null, user: null };
    const user = JSON.parse(rawUser) as User;
    if (!user?.id || !user?.email) throw new Error("Invalid stored user");
    return { token, user };
  } catch {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => readStoredSession(), []);
  const [user, setUser] = useState<User | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);

  useEffect(() => {
    const handleSessionExpired = () => {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setToken(null);
      setUser(null);
    };

    window.addEventListener("critiqon:session-expired", handleSessionExpired);
    return () => window.removeEventListener("critiqon:session-expired", handleSessionExpired);
  }, []);

  function login(nextToken: string, nextUser: User) {
    sessionStorage.setItem("token", nextToken);
    sessionStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pendingPlan");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ user, token, loading: false, login, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
