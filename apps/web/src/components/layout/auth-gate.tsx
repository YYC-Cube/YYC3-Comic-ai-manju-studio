"use client";

/**
 * 会话真伪门禁（M4 · 与 middleware 分层协作）
 * middleware 拦「无 cookie」；本组件兜「伪造/过期 cookie」——fetchSession 401 → 跳登录页（带 next 回跳）
 * Auth 公开路由直渲染，不参与校验（避免 /login → AuthGate → /login 循环）
 */
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingState } from "@/components/common/states";
import { AUTH_ROUTES } from "@/lib/auth-routes";
import { useAuthStore } from "@/store/use-auth-store";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isAuthRoute) return;
    if (status === "idle") void fetchSession();
  }, [isAuthRoute, status, fetchSession]);

  useEffect(() => {
    if (!isAuthRoute && status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthRoute, status, pathname, router]);

  if (isAuthRoute) return <>{children}</>;
  if (status !== "authenticated") {
    return <LoadingState message="校验会话…" subMessage="经 manju api 外呼网关验签，前端零密钥" />;
  }
  return <>{children}</>;
}
