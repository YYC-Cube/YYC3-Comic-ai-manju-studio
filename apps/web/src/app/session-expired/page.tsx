"use client";

/**
 * 会话过期 / 403 无权限页（P2 · 迁移自 MiniMax-3 原型 auth/SessionExpiredAndForbiddenPage）
 * 真链路裁决：双模式经 ?mode=expired|403 切换（默认 expired），原型 Figma 模式切换器不迁入；
 *             原型「未保存剧本草稿恢复卡」为虚构用户数据（《雨夜霓虹》），不迁入——
 *             真实草稿恢复随本地草稿箱能力批次落地；
 *             403 模式的受限模块清单为静态说明文案（RBAC/成本中心），
 *             真实角色与缺权清单随 RBAC 端点接入按会话渲染；
 *             原型 loading/网络异常仿真态不迁入
 * 视觉：居中 480px 卡片，expired 橙辉 / 403 红辉；语义 tokens（域色 hex 为例外）
 */
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Lock, ShieldOff } from "lucide-react";

function ExpiredMode() {
  return (
    <div className="space-y-5 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/40 text-orange-500"
        style={{
          backgroundColor: "rgba(255, 122, 69, 0.12)",
          boxShadow: "0 0 24px rgba(255, 122, 69, 0.25)",
        }}
      >
        <Clock className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">登录已过期</h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          为了剧目数据安全，当前会话已超时失效。
          <br />
          请重新登录以同步最新的产线状态。
        </p>
      </div>

      <div className="space-y-2 pt-1">
        <Link
          href="/login"
          className="block w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          重新登录
        </Link>
        <Link
          href="/dashboard"
          className="block w-full rounded-lg py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

function ForbiddenMode() {
  const router = useRouter();

  return (
    <div className="space-y-5 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-600/40 text-red-600"
        style={{
          backgroundColor: "rgba(255, 68, 34, 0.12)",
          boxShadow: "0 0 24px rgba(255, 68, 34, 0.25)",
        }}
      >
        <ShieldOff className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">你没有访问此页面的权限</h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          当前角色无权访问权限配置与财务审计模块。
        </p>
      </div>

      {/* 受限模块说明卡（静态文案；真实缺权清单随 RBAC 端点渲染） */}
      <div className="space-y-2 rounded-xl border border-border bg-secondary p-3.5 text-left text-xs">
        <span className="block font-bold">你需要联系管理员开通以下权限：</span>
        <ul className="space-y-1.5 text-[11px] text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-red-600" />
            <span>管理域：RBAC 组织权限与角色矩阵分配</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-red-600" />
            <span>管理域：成本中心 DGX 瓦特电价账单审计</span>
          </li>
        </ul>
        <div className="flex items-center justify-between border-t border-border pt-1 text-[11px]">
          <span className="text-muted-foreground/70">组织管理员：王总监</span>
          <a href="mailto:admin@0379.email" className="text-primary hover:underline">
            admin@0379.email
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/dashboard"
          className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
        >
          回到工作台首页
        </Link>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 cursor-pointer rounded-lg bg-secondary py-2.5 text-xs text-foreground transition-colors hover:bg-secondary/80"
        >
          返回上一页
        </button>
      </div>
    </div>
  );
}

function SessionStateContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "403" ? "403" : "expired";
  const isExpired = mode === "expired";

  return (
    <div
      className="relative z-10 w-full max-w-[480px] rounded-2xl border bg-card p-6 shadow-2xl transition-all duration-200 sm:p-10"
      style={{
        borderColor: isExpired ? "rgba(255, 122, 69, 0.3)" : "rgba(255, 68, 34, 0.3)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
      }}
    >
      {isExpired ? <ExpiredMode /> : <ForbiddenMode />}
    </div>
  );
}

export default function SessionExpiredPage() {
  return (
    <div className="dark relative flex min-h-screen w-full select-none items-center justify-center overflow-hidden bg-background p-6 text-foreground animate-in fade-in duration-200">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255, 122, 69, 0.06) 0%, transparent 70%)" }}
      />
      <Suspense fallback={null}>
        <SessionStateContent />
      </Suspense>
    </div>
  );
}
