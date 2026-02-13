"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
  adminLogout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const refreshProfile = async () => {
    const t = Cookies.get("token");
    if (!t) {
      setUser(null);
      setToken(null);
      return;
    }

    try {
      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setToken(t);
      setUser(data.user || null);
    } catch {
      Cookies.remove("token");
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Invalid credentials");
    }
    const { user: u, token: tkn } = await res.json();

    if (remember) {
      Cookies.set("token", tkn, { expires: 7 });
    } else {
      Cookies.set("token", tkn);
    }

    setUser(u);
    setToken(tkn);
    router.push("/");
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  const adminLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    Cookies.remove("token");
    setUser(null);
    setToken(null);
    router.push("/admin/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, adminLogout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
