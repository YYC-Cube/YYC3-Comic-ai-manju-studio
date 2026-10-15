"use client";

/**
 * 应用壳（M4）：受控页渲染 Sidebar/Topbar 工作台壳；Auth 公开路由全屏无壳
 * 路由组方案需要移动既有 8+ 页目录，轻量方案以 pathname 判定——单一事实源 lib/auth-routes
 */
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AUTH_ROUTES } from "@/lib/auth-routes";

export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      {/* 侧栏固定 240px（w-60），主内容区左侧让位 */}
      <div className="pl-60">
        <Topbar />
        <main className="mx-auto max-w-[1400px] p-6">{children}</main>
      </div>
    </>
  );
}
