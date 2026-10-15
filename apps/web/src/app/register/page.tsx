"use client";

/**
 * 注册页（M4 · 迁移自 MiniMax-3 原型 auth/RegisterPage）
 * 真链路裁决：注册端点缺位（网关最小面仅 login/verify）——提交 / 发送验证码均为 toast 占位 + TODO(M5)；
 *             成功态覆盖层与 onboarding 跳转不伪造（onboarding 随 Auth 剩余六页 P2 批次迁移）；
 *             原型 inviteCode 为未渲染死状态，不迁入；
 *             原型「状态仿真切换器」（默认/加载/邮箱已占）为 Figma 开发工具，不迁入生产端
 * 视觉：左区共享 AgentChronoRing（activeAgentId=chuangxiang-lingyun 创想·灵韵）；
 *       四角色域色 hex 为身份色例外，其余走语义 tokens
 */
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { AgentChronoRing } from "@/components/auth/agent-chrono-ring";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type RoleId = "director" | "editor" | "admin" | "ops";

/** 团队核心职责四角色（domainColor 为域身份色，hex 例外保留） */
const ROLES: { id: RoleId; name: string; desc: string; domainColor: string }[] = [
  { id: "director", name: "编导总监", desc: "剧本立项、分镜设计、质检门禁裁决", domainColor: "#00e0b8" },
  { id: "editor", name: "专业剪辑", desc: "多轨道时间线、转场特效、渲染导出", domainColor: "#9d7cd8" },
  { id: "admin", name: "系统管理", desc: "全局配置、RBAC权限、合规审计", domainColor: "#00b4d8" },
  { id: "ops", name: "运营发布", desc: "多平台矩阵分发、数据看板、反哺建议", domainColor: "#FF7A5C" },
];

const OTP_LENGTH = 6;

function RegisterForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleId>("director");
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 密码强度四规则（原型 zxcvbn 思路的最小规则集）
  const hasMinLength = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const strengthScore = [hasMinLength, hasUpperLower, hasNumber, hasSymbol].filter(Boolean).length;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSendCode = () => {
    if (!email) return;
    // TODO(M5)：邮箱验证码下发端点（POST /v1/auth/register/code）落地后接真链路
    toast({
      title: "验证码下发端点待接入（TODO M5）",
      description: "注册链路（验证码下发 + 账号创建）随网关 M5 批次落地",
      variant: "warning",
    });
  };

  const handleDigitChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < OTP_LENGTH - 1) {
      document.getElementById(`reg-otp-${idx + 1}`)?.focus();
    }
  };

  const handleDigitKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
      document.getElementById(`reg-otp-${idx - 1}`)?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) return;
    // TODO(M5)：注册端点（POST /v1/auth/register）落地前不伪造成功态与 onboarding 跳转
    toast({
      title: "注册端点待接入（TODO M5）",
      description: "账号创建与首次配置向导随网关 M5 批次落地，当前请使用演示账号登录",
      variant: "warning",
    });
  };

  const strengthSegments = [
    { ok: strengthScore >= 1, cls: "bg-red-500" },
    { ok: strengthScore >= 2, cls: "bg-amber-500" },
    { ok: strengthScore >= 3, cls: "bg-sky-500" },
    { ok: strengthScore >= 4, cls: "bg-emerald-500" },
  ];
  const strengthChecks = [
    { ok: hasMinLength, label: "至少 8 位字符" },
    { ok: hasUpperLower, label: "包含大小写字母" },
    { ok: hasNumber, label: "包含数字" },
    { ok: hasSymbol, label: "包含特殊符号" },
  ];

  return (
    <div className="w-full max-w-[440px]">
      <div className="relative my-auto rounded-2xl border border-border bg-card p-7 shadow-2xl transition-all duration-200">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 头 */}
          <div className="flex items-baseline justify-between pb-1">
            <h2 className="text-lg font-bold tracking-tight">创建账号</h2>
            <div className="text-xs text-muted-foreground">
              已有账号？{" "}
              <Link href="/login" className="font-bold text-primary hover:underline">
                直接登录
              </Link>
            </div>
          </div>

          {/* 1. 工作邮箱 + 内嵌发送验证码 */}
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-colors focus-within:border-primary">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="工作邮箱 (如 director@studio.com)"
              className="flex-1 bg-transparent text-xs placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0}
              className="shrink-0 cursor-pointer font-mono text-xs text-primary hover:underline disabled:opacity-50"
            >
              {countdown > 0 ? `重新发送 (${countdown}s)` : "发送验证码"}
            </button>
          </div>

          {/* 2. 6 位邮箱验证码 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-muted-foreground">6 位邮箱验证码:</span>
              <span className="font-mono text-[10px] text-muted-foreground/70">支持整串粘贴</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {codeDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`reg-otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  className="h-11 rounded-lg border bg-background text-center font-mono text-base font-bold transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              ))}
            </div>
          </div>

          {/* 3. 设置密码 + 四段强度条 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-colors focus-within:border-primary">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置密码"
                className="flex-1 bg-transparent font-mono text-xs placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="grid flex-1 grid-cols-4 gap-1.5">
                    {strengthSegments.map((s, i) => (
                      <div
                        key={i}
                        className={cn("h-1 rounded-full", s.ok ? s.cls : "bg-muted")}
                      />
                    ))}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {strengthScore <= 1 ? "弱" : strengthScore === 2 ? "一般" : strengthScore === 3 ? "良好" : "强"}
                  </span>
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

          {/* 4. 确认密码 */}
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-colors focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认密码"
              className="flex-1 bg-transparent font-mono text-xs placeholder:text-muted-foreground/70 focus:outline-none"
            />
            {confirmPassword.length > 0 &&
              (passwordsMatch ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <span className="font-mono text-[10px] text-red-500">不一致</span>
              ))}
          </div>

          {/* 5. 核心职责 2x2 角色卡 */}
          <div className="space-y-1.5 pt-1">
            <span className="block text-[11px] font-medium text-muted-foreground">
              选择在团队中的核心职责 (Role):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={cn(
                      "cursor-pointer rounded-lg border p-2.5 transition-all",
                      isSelected
                        ? "border-primary bg-muted/60 shadow-sm"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-bold">{r.name}</span>
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: r.domainColor }}
                      />
                    </div>
                    <p className="line-clamp-1 text-[10px] leading-tight text-muted-foreground">
                      {r.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. 条款 + 提交 */}
          <div className="space-y-3 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-input accent-primary"
              />
              <span>
                我已阅读并同意 <strong className="text-primary">《服务条款》</strong> 与{" "}
                <strong className="text-primary">《隐私政策》</strong>
              </span>
            </label>

            <Button type="submit" disabled={!agreedTerms} className="w-full font-bold">
              <span>创建账号并进入向导</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </div>
      <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground/60">
        演示环境 · 注册端点待网关 M5 批次接入，当前提交为占位提示
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="dark flex min-h-screen w-full select-none flex-col overflow-y-auto bg-background text-foreground lg:flex-row">
      {/* 左 55% · 品牌展示区 */}
      <div className="relative flex w-full flex-col justify-between overflow-hidden border-b p-6 pt-16 sm:p-10 lg:w-[55%] lg:border-b-0 lg:border-r lg:p-14">
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-[480px] w-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255, 122, 92, 0.07) 0%, transparent 70%)" }}
        />

        <div className="z-10 flex items-center gap-3">
          <img src="/yyc3-icons/logo.svg" alt="YYC³" className="h-8 w-auto invert" />
          <div className="h-5 w-px bg-border" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            AI Family · Comic Drama
          </span>
        </div>

        <div className="z-10 my-6 flex w-full flex-col items-center text-center lg:my-auto">
          <AgentChronoRing diameter={300} activeAgentId="chuangxiang-lingyun" />
          <div className="mt-6 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              加入产线，只需 60 秒
            </h1>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
              即刻获得 8 个拟人化 AI 伙伴支持，全自动化驱动长篇网文快速出片。
            </p>
          </div>
        </div>

        <div className="z-10 mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t pt-3 font-mono text-xs text-muted-foreground lg:mt-0">
          <span>单集成本 ≤ ¥2.00 标杆</span>
          <span>双 DGX 节点已在线</span>
          <span>v2.0.0</span>
        </div>
      </div>

      {/* 右 45% · 表单区 */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-y-auto p-4 py-10 sm:p-6 lg:w-[45%] lg:p-10 lg:py-8">
        <RegisterForm />
      </div>
    </div>
  );
}
