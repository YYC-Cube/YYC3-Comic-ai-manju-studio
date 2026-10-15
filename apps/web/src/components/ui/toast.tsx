"use client";

/**
 * 通知提示组件（shadcn/ui 风格，独立实现）
 * Toast / ToastProvider / useToast / Toaster
 * 特性：自动消失（可配置）、支持 success/warning/error 语义、队列管理
 */
import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "warning" | "error";

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (opts: Omit<ToastItem, "id" | "variant" | "duration"> & { variant?: ToastVariant; duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

let counter = 0;
const genId = () => `toast-${Date.now()}-${counter++}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ variant = "default", duration = 3000, ...rest }) => {
      const id = genId();
      setToasts((prev) => [...prev, { id, variant, duration, ...rest }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

const VARIANT_STYLE: Record<ToastVariant, { icon: React.ElementType; ring: string; iconColor: string }> = {
  default: { icon: Info, ring: "border-border", iconColor: "text-muted-foreground" },
  success: { icon: CheckCircle2, ring: "border-emerald-500/30", iconColor: "text-emerald-500" },
  warning: { icon: AlertTriangle, ring: "border-amber-500/30", iconColor: "text-amber-500" },
  error: { icon: XCircle, ring: "border-red-500/30", iconColor: "text-red-500" },
};

function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const style = VARIANT_STYLE[t.variant];
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-md border bg-background p-4 shadow-lg",
              style.ring
            )}
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconColor)} />
            <div className="min-w-0 flex-1">
              {t.title && <p className="text-sm font-medium">{t.title}</p>}
              {t.description && (
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-sm opacity-60 hover:opacity-100"
              aria-label="关闭通知"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
