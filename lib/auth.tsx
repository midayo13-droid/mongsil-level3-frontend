"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError, getToken, setToken } from "./api";

/** 역할: 총관리자(사장님) / 일반관리자(관리사) / 고객 */
export type Role = "총관리자" | "일반관리자" | "고객";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
  /** 고객 계정만: 연결된 보호자 번호 */
  guardian_id: number | null;
  /** 관리사(일반관리자) 계정만: 연결된 관리사 번호 */
  groomer_id: number | null;
}

interface AuthState {
  user: AuthUser | null;
  /** 처음에 로그인 정보를 확인하는 중 */
  checking: boolean;
  /** 총관리자(사장님) */
  isAdmin: boolean;
  /** 고객 */
  isCustomer: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  /** 고객 가입: 성공하면 바로 로그인돼요. */
  signup: (payload: unknown) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** 로그인한 역할에 맞는 첫 화면 */
export function homeFor(user: Pick<AuthUser, "role">) {
  return user.role === "고객" ? "/my" : "/";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  // 새로고침해도 출입증이 남아 있으면 로그인 상태를 이어 가요.
  useEffect(() => {
    let ignore = false;
    const check = async () => {
      if (!getToken()) return null;
      try {
        return await api<AuthUser>("/auth/me", { skipAuthRedirect: true });
      } catch (e) {
        // 출입증이 틀렸거나 만료된 경우(401)에만 지워요. 서버가 잠깐 불안정한 때에는 로그인을 유지해요.
        if (e instanceof ApiError && e.status === 401) setToken(null);
        return null;
      }
    };
    check().then((me) => {
      if (ignore) return;
      // 확인하는 사이에 이미 로그인했다면 그 로그인 정보를 덮어쓰지 않아요.
      setUser((prev) => prev ?? me);
      setChecking(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await api<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: { username, password },
      skipAuthRedirect: true,
    });
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const signup = useCallback(async (payload: unknown) => {
    const result = await api<{ token: string; user: AuthUser }>("/auth/signup", {
      method: "POST",
      body: payload,
      skipAuthRedirect: true,
    });
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        checking,
        isAdmin: user?.role === "총관리자",
        isCustomer: user?.role === "고객",
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider 안에서만 쓸 수 있어요.");
  return ctx;
}
