"use client";

/**
 * 会话状态（M4 鉴权基座 · 前端侧）
 * 数据源：manju api /api/v1/auth/*（mock/gateway 双模式由后端 auth_mode 决定，前端无感）
 * 红线：session 校验不走 withFallback——鉴权失败一律按未认证处理，禁止降级为已登录
 */
import { create } from "zustand";
import { ApiError } from "@/api/client";
import {
  getSession,
  login as apiLogin,
  logout as apiLogout,
  type AuthUser,
} from "@/api/auth";

type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

interface AuthState {
  user: AuthUser | null;
  mode: "mock" | "gateway" | null;
  status: AuthStatus;
  fetchSession: () => Promise<void>;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  mode: null,
  status: "idle",

  fetchSession: async () => {
    set({ status: "loading" });
    try {
      const res = await getSession();
      set({
        user: res.user ?? null,
        mode: res.mode,
        status: res.authenticated ? "authenticated" : "anonymous",
      });
    } catch (err) {
      // 401 为正常未登录语义；其他异常（网络/5xx）同样按未认证处理并留痕
      if (!(err instanceof ApiError) || err.status !== 401) {
        console.warn("[Auth] 会话校验异常（按未认证处理）:", err);
      }
      set({ user: null, mode: null, status: "anonymous" });
    }
  },

  login: async (username, password) => {
    const res = await apiLogin(username, password);
    set({ user: res.user, mode: res.mode, status: "authenticated" });
    return res.user;
  },

  logout: async () => {
    try {
      await apiLogout();
    } catch {
      // 网络异常也完成本地登出（cookie 由后端清理，失败时过期自动失效）
    }
    set({ user: null, mode: null, status: "anonymous" });
  },
}));
