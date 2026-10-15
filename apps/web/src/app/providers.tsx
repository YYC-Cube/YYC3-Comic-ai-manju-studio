"use client";

/**
 * 全局 Provider 包装器（客户端组件）
 * 将所有需要客户端上下文的 Provider 集中在此，供服务端 layout 调用
 */
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
