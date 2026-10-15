"use client";

/**
 * 登录页（M4 · 迁移自 MiniMax-3 原型 auth/LoginPage，真链路联通）
 * 真联通：useAuthStore.login → manju api 双模式签发（mock/gateway）→ next 回跳（默认 /dashboard）；
 *         错误条由真实响应驱动（401 口令错误 / 503 服务未配置或网关不可达）；
 *         原型「状态仿真切换器」为 Figma 开发工具，不迁入生产端
 * 品牌时钟：简化版 AgentChronoRing（完整 347 行 AuthBrandClock 随视觉深化批次迁移，TODO）
 * OAuth 三钮 / 忘记密码 / 联系销售：toast 占位 + TODO(M5)（无真实端点，不建空路由）
 */
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { ApiError } from "@/api/client";
import { AgentChronoRing } from "@/components/auth/agent-chrono-ring";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AUTH_HOME } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const login = useAuthStore((s) => s.login);

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await login(account.trim(), password);
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : AUTH_HOME);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setErrorMsg("账号或口令不正确，请重新输入");
      } else if (err instanceof ApiError && err.status === 503) {
        setErrorMsg("登录服务未就绪（网关不可达或账号源未配置），请联系管理员");
      } else {
        setErrorMsg(err instanceof Error ? err.message : "登录失败，请稍后重试");
      }
      setIsSubmitting(false);
    }
  };

  const handleOAuth = (provider: string) =>
    toast({
      title: `${provider} 登录（TODO M5）`,
      description: "企业 OAuth 单点登录随网关 M5 批次落地，当前请使用账号口令登录",
      variant: "warning",
    });

  return (
    <div className="w-full max-w-[400px]">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-8 shadow-2xl transition-all duration-200",
          errorMsg ? "border-red-500 shadow-red-950/30" : "border-border"
        )}
      >
        {isSubmitting && <div className="absolute left-0 right-0 top-0 h-1 animate-pulse bg-primary" />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">登录</h2>
            <p className="mt-1 text-xs text-muted-foreground">使用工作邮箱或手机号继续</p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 账号 */}
          <div className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 transition-colors focus-within:border-primary">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="邮箱 / 手机号"
              className="flex-1 bg-transparent text-xs placeholder:text-muted-foreground/70 focus:outline-none"
            />
          </div>

          {/* 密码 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 transition-colors focus-within:border-primary">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => setCapsLockActive(e.getModifierState("CapsLock"))}
                placeholder="密码"
                className="flex-1 bg-transparent font-mono text-xs placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {capsLockActive && (
              <span className="block pl-1 font-mono text-[10px] text-amber-600">
                ⚠ 大写锁定已开启 (Caps Lock)
              </span>
            )}
          </div>

          {/* 记住我 + 忘记密码 */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-input accent-primary"
              />
              记住我 7 天
            </label>
            <button
              type="button"
              onClick={() =>
                toast({
                  title: "找回密码（TODO M5）",
                  description: "ForgotPassword 流程随 Auth 剩余六页批次迁移",
                  variant: "warning",
                })
              }
              className="cursor-pointer text-primary hover:underline"
            >
              忘记密码？
            </button>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                正在验证…
              </>
            ) : (
              "登录"
            )}
          </Button>

          {/* OAuth 分隔线 */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-border" />
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70">
              或使用以下方式
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* OAuth 三钮 */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { name: "企业微信", dot: "bg-emerald-500" },
              { name: "钉钉", dot: "bg-sky-500" },
              { name: "飞书", dot: "bg-violet-500" },
            ].map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleOAuth(p.name)}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border bg-muted/60 px-2 py-2 text-xs transition-colors hover:bg-muted"
              >
                <span className={cn("h-2 w-2 rounded-full", p.dot)} />
                {p.name}
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-2 text-center text-xs">
            <div className="text-muted-foreground">
              还没有账号？{" "}
              <Link href="/register" className="font-bold text-primary hover:underline">
                立即注册
              </Link>
            </div>
            <div className="text-[11px] text-muted-foreground/70">
              需要私有化企业部署？{" "}
              <button
                type="button"
                onClick={() =>
                  toast({ title: "企业部署咨询（TODO M5）", variant: "warning" })
                }
                className="cursor-pointer hover:underline"
              >
                联系销售总监
              </button>
            </div>
          </div>
        </form>
      </div>
      <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground/60">
        演示环境 · 会话由 manju api 双模式签发（AUTH_MODE=mock 任意口令可登录）
      </p>
    </div>
  );
}

export default function LoginPage() {
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
          style={{ background: "radial-gradient(circle, rgba(157, 124, 216, 0.07) 0%, transparent 70%)" }}
        />

        <div className="z-10 flex items-center gap-3">
          <img src="/yyc3-icons/logo.svg" alt="YYC³" className="h-8 w-auto invert" />
          <div className="h-5 w-px bg-border" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            AI Family · Comic Drama
          </span>
        </div>

        <div className="z-10 my-6 flex w-full flex-col items-center text-center lg:my-auto">
          <AgentChronoRing diameter={320} />
          <div className="mt-8 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              八个 AI 伙伴，一条漫剧产线
            </h1>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
              小说 → 剧本 → 分镜 → 图像 → 视频 → 成片 → 分发
              <br />
              由 YYC³ AI Family 全链路协同自主完成
            </p>
          </div>
        </div>

        <div className="z-10 mt-6 flex flex-col gap-2 border-t pt-4 lg:mt-0">
          <div className="flex items-center justify-between gap-3 font-mono text-xs">
            <div>
              <span className="block text-[11px] text-muted-foreground/70">单集核算成本</span>
              <span className="text-sm font-bold text-primary">¥ 1.8</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <span className="block text-[11px] text-muted-foreground/70">质检通过率</span>
              <span className="text-sm font-bold text-emerald-500">94.2%</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <span className="block text-[11px] text-muted-foreground/70">今日实测产能</span>
              <span className="text-sm font-bold text-sky-500">12 集</span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            YYC³ Industrial Engine v2.0.0 · build 20261016 · DGX Cluster Active
          </span>
        </div>
      </div>

      {/* 右 45% · 表单区 */}
      <div className="relative flex w-full flex-col items-center justify-center p-4 py-10 sm:p-8 lg:w-[45%] lg:py-8">
        <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
