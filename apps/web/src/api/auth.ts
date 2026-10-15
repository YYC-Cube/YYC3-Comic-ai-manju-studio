/**
 * 会话鉴权 API（M4 · 经 manju api /api/v1/auth/* 双模式代理，前端对 mock/gateway 无感）
 * Cookie（yyc3_session）由后端 Set-Cookie 写入（HttpOnly），request 已带 credentials:include
 */
import { request } from "@/api/client";

export interface AuthUser {
  user_id: string;
  username: string;
  role: string;
}

export interface LoginResult {
  user: AuthUser;
  mode: "mock" | "gateway";
}

export interface SessionResult {
  authenticated: boolean;
  user: AuthUser | null;
  mode: "mock" | "gateway";
}

export function login(username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getSession(): Promise<SessionResult> {
  return request<SessionResult>("/api/v1/auth/session");
}

export function logout(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/v1/auth/logout", { method: "POST" });
}
