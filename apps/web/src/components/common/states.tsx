"use client";

/**
 * 五态渲染组件（M3 · 原型 States.tsx 的 shadcn 化重写）
 * 与 hooks/use-view-state 配套：resolveViewState 出状态，本组件族负责渲染
 * 规范红线保留（原型 R13）：ErrorState 必须给出降级提示与手工替代路径
 */
import type { ReactNode } from "react";
import { AlertCircle, Cpu, FolderPlus, RefreshCw, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = "暂无数据",
  description = "当前尚未创建任何实体或任务，您可以立即发起新建。",
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        "my-6 flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
        <FolderPlus className="h-8 w-8" />
      </div>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="mb-6 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
      <div className="flex items-center gap-3">
        {onAction && (
          <Button onClick={onAction} size="sm">
            {actionText ?? "新建"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
        {onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline" size="sm">
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
}

export function LoadingState({
  message = "加载中…",
  subMessage,
  className,
}: {
  message?: string;
  subMessage?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "my-6 flex flex-col items-center justify-center rounded-xl border p-16 text-center",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center text-primary">
          <Cpu className="h-5 w-5 animate-pulse" />
        </div>
      </div>
      <h3 className="mb-1 font-mono text-sm font-medium tracking-wide">{message}</h3>
      {subMessage && <p className="text-xs text-muted-foreground">{subMessage}</p>}
    </div>
  );
}

export function ErrorState({
  title = "请求失败",
  description = "后端服务返回异常响应。系统已切入降级保护路径，禁止静默失败。",
  errorCode,
  fallbackManualPath,
  actionText = "重试",
  onAction,
  className,
}: StateProps & { errorCode?: string; fallbackManualPath?: string }) {
  return (
    <div
      className={cn(
        "relative my-6 flex flex-col items-center justify-center overflow-hidden rounded-xl border border-red-500/40 p-12 text-center",
        className
      )}
    >
      <div className="absolute left-0 right-0 top-0 h-1 bg-red-500" />
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600">
        <AlertCircle className="h-8 w-8" />
      </div>
      {errorCode && (
        <span className="mb-2 rounded border border-red-500/25 bg-muted px-2 py-0.5 font-mono text-[11px] text-red-600">
          {errorCode}
        </span>
      )}
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="mb-3 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>

      {/* 规范红线：必须给出降级提示与手工替代路径 */}
      {fallbackManualPath && (
        <div className="mb-6 max-w-md rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-left">
          <span className="mb-1 block text-[11px] font-semibold text-amber-600">
            降级路径已激活 (Degraded Fallback)
          </span>
          <span className="text-xs text-muted-foreground">{fallbackManualPath}</span>
        </div>
      )}

      {onAction && (
        <Button onClick={onAction} variant="destructive" size="sm">
          <RefreshCw className="h-3.5 w-3.5" />
          {actionText}
        </Button>
      )}
    </div>
  );
}

export function NoPermissionState({
  title = "暂无访问权限",
  description = "当前账户角色尚未获得本模块的操作授权。",
  requiredRole = "RBAC 级别：Director / Admin",
  actionText = "申请提权审批",
  onAction,
  className,
}: StateProps & { requiredRole?: string }) {
  return (
    <div
      className={cn(
        "relative my-6 flex flex-col items-center justify-center overflow-hidden rounded-xl border border-amber-500/40 p-12 text-center",
        className
      )}
    >
      <div className="absolute left-0 right-0 top-0 h-1 bg-amber-500" />
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <span className="mb-2 rounded border border-amber-500/25 bg-muted px-2 py-0.5 font-mono text-[11px] text-amber-600">
        {requiredRole}
      </span>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="mb-6 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
      {onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
}

/** 五态分发器：消费 resolveViewState 的结果，normal 态渲染 children */
export function ViewStateGate({
  state,
  error,
  loadingMessage,
  emptyTitle,
  emptyDescription,
  emptyActionText,
  onEmptyAction,
  onRetry,
  children,
}: {
  state: "normal" | "empty" | "loading" | "error" | "forbidden";
  error?: unknown;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  onRetry?: () => void;
  children: ReactNode;
}) {
  switch (state) {
    case "loading":
      return <LoadingState message={loadingMessage} />;
    case "empty":
      return (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionText={emptyActionText}
          onAction={onEmptyAction}
        />
      );
    case "forbidden":
      return <NoPermissionState />;
    case "error":
      return (
        <ErrorState
          errorCode={error instanceof Error ? error.message : undefined}
          onAction={onRetry}
          fallbackManualPath="已启用本地演示数据降级路径：页面展示内容来自最近成功快照或演示数据集"
        />
      );
    default:
      return <>{children}</>;
  }
}
