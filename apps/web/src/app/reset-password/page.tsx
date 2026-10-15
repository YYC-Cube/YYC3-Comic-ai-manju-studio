"use client";

/**
 * 重置密码页（P2 · 迁移自 MiniMax-3 原型 auth/ResetPasswordPage）
 * 真链路裁决：重置提交端点缺位——提交为 toast 占位 + TODO，不伪造重置成功与登录跳转；
 *             账号标识由重置 Token 解出（端点缺位，当前不渲染具体账号，不伪造掩码邮箱）；
 *             原型「链接已失效」视图依赖 Token 校验回执（403/forbidden），随端点接入呈现，不伪造分支；
 *             原型状态仿真切换器（正常/失效）为 Figma 开发工具，不迁入
 * 视觉：居中 440px 卡片 + 剪辑域紫径向辉光；强度四规则与注册页同规则集
 */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Lock,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 强度四规则（与注册页同源）
  const hasMinLength = newPassword.length >= 8;
  const hasUpperLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUpperLower, hasNumber, hasSymbol].filter(Boolean).length;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const strengthSegments = [
    { ok: strengthScore >= 1, cls: "bg-red-500" },
    { ok: strengthScore >= 2, cls: "bg-amber-500" },
    { ok: strengthScore >= 3, cls: "bg-sky-500" },
    { ok: strengthScore >= 4, cls: "bg-emerald-500" },
  ];
  const strengthChecks = [
    { ok: hasMinLength, label: "至少 8 位" },
    { ok: hasUpperLower, label: "大小写字母" },
    { ok: hasNumber, label: "包含数字" },
    { ok: hasSymbol, label: "特殊符号" },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (strengthScore < 3 || !passwordsMatch) return;
    // TODO：重置端点（POST /v1/auth/reset-password）落地前不伪造成功态与登录跳转；
    //       安全语义对齐原型 DEV_META——重置成功即作废该账号全部活跃会话
    toast({
      title: "重置端点待接入",
      description: "密码重置（密签 Token 单次使用 + 旧会话全局吊销）随网关批次落地",
      variant: "warning",
    });
  };

  return (
    <div className="dark relative flex min-h-screen w-full select-none items-center justify-center overflow-hidden bg-background p-6 text-foreground animate-in fade-in duration-200">
      {/* 中央剪辑域紫径向辉光 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(157, 124, 216, 0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[#9d7cd8]/25 bg-card p-6 shadow-2xl transition-all duration-200 sm:p-9">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* 顶部图标（紫辉环） */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9d7cd8]/40 text-[#9d7cd8]"
              style={{
                backgroundColor: "rgba(157, 124, 216, 0.1)",
                boxShadow: "0 0 20px rgba(157, 124, 216, 0.25)",
              }}
            >
              <LockKeyhole className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">设置新密码</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                新密码生效后，全部已登录会话将强制下线
              </p>
            </div>
          </div>

          {/* 新密码 */}
          <div className="space-y-1.5">
            <span className="block text-[11px] text-muted-foreground">新密码：</span>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-[#9d7cd8]">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入不少于 8 位的新密码"
                className="flex-1 bg-transparent font-mono text-xs placeholder-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-[#9d7cd8]"
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* 强度条 + 规则 */}
            {newPassword.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border bg-background p-2.5">
                <div className="grid grid-cols-4 gap-1">
                  {strengthSegments.map((s, i) => (
                    <div key={i} className={`h-1 rounded-full ${s.ok ? s.cls : "bg-secondary"}`} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  {strengthChecks.map((c) => (
                    <div key={c.label} className="flex items-center gap-1">
                      {c.ok ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground/50" />
                      )}
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 确认新密码 */}
          <div className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">确认新密码：</span>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-[#9d7cd8]">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="flex-1 bg-transparent font-mono text-xs placeholder-muted-foreground focus:outline-none"
              />
              {confirmPassword.length > 0 &&
                (passwordsMatch ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <span className="font-mono text-[10px] text-red-500">不一致</span>
                ))}
            </div>
          </div>

          <Button type="submit" disabled={strengthScore < 2 || !passwordsMatch} className="w-full font-bold">
            重置密码并直接登录
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
        </form>
      </div>
    </div>
  );
}
