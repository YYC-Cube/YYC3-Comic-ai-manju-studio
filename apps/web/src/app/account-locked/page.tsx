"use client";

/**
 * 账号锁定/停用页（P2 · 迁移自 MiniMax-3 原型 auth/AccountLockedPage）
 * 真链路裁决：本页为安全终态展示面——变体经 ?variant=locked|deactivated 切换（默认 locked），
 *             原型 Figma 变体切换器不迁入；锁定倒计时为策略演示（5 次失败冻结 15 分钟，
 *             原型 DEV_META 口径），真实剩余时间随 lock-status 端点接入；
 *             「提交工单申诉」端点缺位——toast 占位 + TODO；联系管理员走 mailto 真链路
 * 视觉：居中 480px 卡片 + 危险红径向辉光；语义 tokens（域色 hex 为例外）
 */
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Clock, Lock, ShieldAlert, UserX } from "lucide-react";
import { useToast } from "@/components/ui/toast";

/** 锁定策略时长（秒）：连续 5 次认证失败冻结 15 分钟（原型 DEV_META 口径） */
const LOCK_DURATION_SECONDS = 15 * 60;

function LockedVariant() {
  const [timeLeft, setTimeLeft] = useState(LOCK_DURATION_SECONDS);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="space-y-5 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-600/40 text-red-600"
        style={{
          backgroundColor: "rgba(255, 68, 34, 0.12)",
          boxShadow: "0 0 24px rgba(255, 68, 34, 0.3)",
        }}
      >
        <Lock className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">账号已锁定</h1>
        <p className="text-xs text-muted-foreground">连续 5 次认证失败，为保护剧组资产已临时锁定</p>
      </div>

      {/* 倒计时卡 */}
      <div className="space-y-1 rounded-xl border border-red-600/30 bg-secondary p-4">
        <span className="block font-mono text-3xl font-bold tabular-nums text-red-600">
          {timeFormatted}
        </span>
        <span className="text-[11px] text-muted-foreground">锁定解除后可重新输入凭证登录</span>
      </div>

      {/* 说明列表 */}
      <div className="space-y-2 rounded-xl border border-border bg-background p-3.5 text-left text-xs">
        <div className="flex items-start gap-2 text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
          <span>锁定期间所有现存已登录会话已全部强制下线失效。</span>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>正在后台运行的漫剧渲染任务不受影响，仍将正常交付完成。</span>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>如非您本人操作，可能存在撞库攻击风险，请联系管理员重置。</span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <a
          href="mailto:admin@0379.email?subject=%E8%B4%A6%E5%8F%B7%E8%A7%A3%E9%94%81%E7%94%B3%E8%AF%B7"
          className="block w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          联系管理员解锁（admin@0379.email）
        </a>
        <Link
          href="/login"
          className="block w-full rounded-lg py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          返回登录页面
        </Link>
      </div>
    </div>
  );
}

function DeactivatedVariant() {
  const { toast } = useToast();

  return (
    <div className="space-y-5 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/40 text-orange-500"
        style={{
          backgroundColor: "rgba(255, 122, 69, 0.12)",
          boxShadow: "0 0 24px rgba(255, 122, 69, 0.25)",
        }}
      >
        <UserX className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">账号已被停用</h1>
        <p className="text-xs text-muted-foreground">
          该账号已被企业系统管理员停用，如有疑问请提交申诉
        </p>
      </div>

      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() =>
            // TODO：申诉工单端点缺位（原型的工单网关为演示概念，无真实落点）
            toast({
              title: "申诉工单端点待接入",
              description: "账号停用申诉流转随合规域批次落地，当前请直接联系 admin@0379.email",
              variant: "warning",
            })
          }
          className="w-full cursor-pointer rounded-lg bg-orange-500 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-orange-600"
        >
          提交工单申诉
        </button>
        <Link
          href="/login"
          className="block w-full rounded-lg py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          返回登录
        </Link>
      </div>
    </div>
  );
}

function AccountLockedContent() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") === "deactivated" ? "deactivated" : "locked";

  return (
    <div
      className="relative z-10 w-full max-w-[480px] rounded-2xl border bg-card p-6 shadow-2xl transition-all duration-200 sm:p-9"
      style={{
        borderColor: "rgba(255, 68, 34, 0.35)",
        boxShadow: "0 8px 32px rgba(255, 68, 34, 0.15), 0 0 24px rgba(0, 0, 0, 0.6)",
      }}
    >
      {variant === "locked" ? <LockedVariant /> : <DeactivatedVariant />}
    </div>
  );
}

export default function AccountLockedPage() {
  return (
    <div className="dark relative flex min-h-screen w-full select-none items-center justify-center overflow-hidden bg-background p-6 text-foreground animate-in fade-in duration-200">
      {/* 背景危险辉光 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255, 68, 34, 0.08) 0%, transparent 70%)" }}
      />
      <Suspense fallback={null}>
        <AccountLockedContent />
      </Suspense>
    </div>
  );
}
