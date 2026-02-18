"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

  const refreshProfile = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = useCallback(
    async (email: string, password: string, _remember: boolean) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ส่ง credentials เพื่อให้ browser รับ HttpOnly cookie จาก server
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Invalid credentials");
      }
      const { user: u } = await res.json();

      // token ถูก set เป็น HttpOnly cookie โดย server แล้ว
      // ดึง token จาก cookie เพื่อ set ใน state (สำหรับ API calls ที่ใช้ Authorization header)
      const cookieToken = Cookies.get("token") ?? null;
      setUser(u);
      setToken(cookieToken);
      router.push("/");
    },
    [router],
  );

  const logout = useCallback(() => {
    Cookies.remove("token");
    setUser(null);
    setToken(null);
    router.push("/login");
  }, [router]);

  const adminLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    Cookies.remove("token");
    setUser(null);
    setToken(null);
    router.push("/admin/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, token, login, logout, adminLogout, refreshProfile }),
    [user, token, login, logout, adminLogout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
