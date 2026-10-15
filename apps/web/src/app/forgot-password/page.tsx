"use client";

/**
 * 找回密码页（P2 · 迁移自 MiniMax-3 原型 auth/ForgotPasswordPage）
 * 真链路裁决：重置链接下发端点缺位（网关最小面仅 login/verify）——提交为 toast 占位 + TODO；
 *             原型成功态视图（isSent）不伪造、不迁入（端点落地后随回执呈现）；
 *             重发冷却随成功态视图一并待端点；原型 DevMode 状态仿真器不迁入生产端
 * 视觉：居中 440px 卡片 + 主色径向辉光；语义 tokens
 */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Info, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO：重置链接下发端点（POST /v1/auth/forgot-password）落地后接真链路；
    //       安全语义对齐原型 DEV_META——无论邮箱是否存在均呈现发送成功态（防撞库枚举）
    toast({
      title: "重置链接下发端点待接入",
      description: "找回密码链路（邮件队列 + 30 分钟时效 Token）随网关批次落地",
      variant: "warning",
    });
  };

  return (
    <div className="dark relative flex min-h-screen w-full select-none items-center justify-center overflow-hidden bg-background p-6 text-foreground animate-in fade-in duration-200">
      {/* 中央主色径向辉光 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-primary/15 bg-card p-6 shadow-2xl transition-all duration-200 sm:p-9">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 顶部图标（主色辉环） */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 text-primary"
              style={{
                backgroundColor: "hsl(var(--primary) / 0.08)",
                boxShadow: "0 0 20px hsl(var(--primary) / 0.2)",
              }}
            >
              <KeyRound className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">找回密码</h1>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                输入注册工作邮箱，我们将发送重置链接。
                <br />
                链接有效期为 30 分钟。
              </p>
            </div>
          </div>

          {/* 邮箱字段 */}
          <div className="flex items-center gap-2.5 rounded-lg border border-input bg-background px-3 py-2.5 focus-within:border-primary">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入您的注册邮箱"
              className="flex-1 bg-transparent text-xs placeholder-muted-foreground focus:outline-none"
            />
          </div>

          <Button type="submit" className="w-full font-bold">
            发送重置链接
          </Button>

          <div className="pt-1 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>返回登录</span>
            </Link>
          </div>

          {/* 排查帮助卡 */}
          <div className="space-y-2 rounded-xl border border-border bg-secondary p-3.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-sky-400">
              <Info className="h-3.5 w-3.5" />
              <span>收不到重置邮件？</span>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-[11px] leading-relaxed text-muted-foreground">
              <li>请检查垃圾邮件与订阅文件夹</li>
              <li>确认输入的邮箱拼写是否完全正确</li>
              <li>企业专属域名邮箱可能需网管放行系统通知</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
