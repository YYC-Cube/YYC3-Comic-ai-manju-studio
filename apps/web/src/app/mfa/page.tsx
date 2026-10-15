"use client";

/**
 * 二次验证页（M4 · 迁移自 MiniMax-3 原型 auth/MfaPage）
 * 真链路裁决：网关最小面无 MFA 挑战端点——验证/备用码/重发动作均为 toast 占位 + TODO(M5)；
 *             登录成功默认直跳 next（不强制经过本页），本页作为独立路由保留待 M5 接通；
 *             锁定态（连续失败锁定 15 分钟）无真实端点，不伪造渲染分支，随 M5 落地；
 *             原型「状态仿真切换器」为 Figma 开发工具，不迁入生产端
 * 视觉：智云·守护身份紫 #9d7cd8（glow / 盾标 / 提示卡），其余走语义 tokens
 */
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type MfaMethod = "totp" | "sms" | "email";

/** 智云·守护 Agent 身份色（认知用 hex 例外） */
const GUARDIAN_PURPLE = "#9d7cd8";
const OTP_LENGTH = 6;
const RESEND_SECONDS = 58;

export default function MfaPage() {
  const { toast } = useToast();
  const [method, setMethod] = useState<MfaMethod>("totp");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDigitChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < OTP_LENGTH - 1) {
      document.getElementById(`mfa-digit-${idx + 1}`)?.focus();
    }
  };

  const handleDigitKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      document.getElementById(`mfa-digit-${idx - 1}`)?.focus();
    }
  };

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;
    setIsVerifying(true);
    // TODO(M5)：网关 MFA 挑战端点（POST /v1/auth/mfa/verify）落地后接真链路
    toast({
      title: "MFA 校验端点待接入（TODO M5）",
      description: "二次验证挑战-响应随网关 M5 批次落地，当前登录成功直跳工作台",
      variant: "warning",
    });
    setTimeout(() => setIsVerifying(false), 400);
  };

  const handleResend = () => {
    // TODO(M5)：短信/邮箱验证码下发端点
    toast({
      title: "验证码通道待接入（TODO M5）",
      description: "短信 / 邮箱下发随网关 M5 批次开通，当前请使用动态口令",
      variant: "warning",
    });
  };

  const methodHints: Record<MfaMethod, string> = {
    totp: "打开身份验证器 App 获取 6 位动态验证码",
    sms: "短信验证码通道随 M5 批次接入",
    email: "邮箱验证码通道随 M5 批次接入",
  };

  return (
    <div className="dark relative flex min-h-screen w-full select-none items-center justify-center overflow-hidden bg-background p-6 text-foreground">
      {/* 智云·守护 身份紫 glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(157, 124, 216, 0.08) 0%, transparent 70%)" }}
      />

      {/* 表单卡（440px） */}
      <div
        className="relative z-10 w-full max-w-[440px] rounded-2xl border bg-card p-5 shadow-2xl sm:p-8"
        style={{ borderColor: "rgba(157, 124, 216, 0.3)" }}
      >
        <form onSubmit={handleVerify} className="space-y-5">
          {/* 盾标头 */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border"
              style={{
                color: GUARDIAN_PURPLE,
                borderColor: GUARDIAN_PURPLE,
                backgroundColor: "rgba(157, 124, 216, 0.12)",
                boxShadow: "0 0 20px rgba(157, 124, 216, 0.3)",
              }}
            >
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">二次验证 (MFA)</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                账号已开启双重保护，请完成二次验证
              </p>
            </div>
          </div>

          {/* 方式切换：动态口令 / 短信 / 邮箱 */}
          <div className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/50 p-1 font-mono text-xs">
            {(
              [
                { id: "totp", label: "动态口令" },
                { id: "sms", label: "短信验证" },
                { id: "email", label: "邮箱验证" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "cursor-pointer rounded-lg py-1.5 transition-all",
                  method === m.id
                    ? "border border-primary/40 bg-background font-bold text-primary"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* 方式提示 */}
          <div className="text-center text-xs text-muted-foreground">{methodHints[method]}</div>

          {/* 6 位验证码格 */}
          <div className="grid grid-cols-6 gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                id={`mfa-digit-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(i, e)}
                className="h-12 rounded-lg border bg-muted/50 text-center font-mono text-lg font-bold transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            ))}
          </div>

          {/* 重发（仅短信/邮箱有意义；端点 TODO M5） */}
          {method !== "totp" && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              {countdown > 0 ? (
                <span className="font-mono">重新发送 ({countdown}s)</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="flex cursor-pointer items-center gap-1 text-primary hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  重新发送验证码
                </button>
              )}
            </div>
          )}

          <Button type="submit" disabled={isVerifying} className="w-full font-bold">
            {isVerifying ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                正在验证…
              </>
            ) : (
              "验证并登录"
            )}
          </Button>

          {/* 备用码 / 换账号 */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() =>
                toast({
                  title: "一次性备用码（TODO M5）",
                  description: "备用码校验端点随网关 M5 批次落地",
                  variant: "warning",
                })
              }
              className="cursor-pointer text-primary hover:underline"
            >
              使用一次性备用码
            </button>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              换个账号登录
            </Link>
          </div>

          {/* 智云·守护 安全提示卡 */}
          <div
            className="space-y-2 rounded-xl border bg-muted/40 p-3 text-xs"
            style={{ borderColor: "rgba(157, 124, 216, 0.2)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: GUARDIAN_PURPLE }}
              />
              <span className="font-bold">智云·守护 安全提示</span>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-[11px] leading-relaxed text-muted-foreground">
              <li>连续 5 次验证失败将临时锁定账号 15 分钟（锁定判定随 M5 端点生效）</li>
              <li>YYC³ 官方工作人员绝不会向您索要二次验证码</li>
              <li>异常 IP 登录将实时触发警报并推送邮件告知</li>
            </ul>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>演示环境：MFA 挑战端点未接入，验证动作为占位提示</span>
          </div>
        </form>
      </div>
    </div>
  );
}
