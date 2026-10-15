"use client";

/**
 * 邀请落地页（P2 · 迁移自 MiniMax-3 原型 auth/InviteLandingPage）
 * 真链路裁决：邀请详情端点（GET /v1/invite/{token}）缺位——左区邀请人/工作空间/预分配角色
 *             为原型演示数据，以「演示数据」Badge 显式标注（不伪装真实邀请）；
 *             接受邀请端点（POST /v1/invite/{token}/accept）缺位——提交 toast 占位 + TODO，
 *             不伪造加入成功与工作台跳转；
 *             原型「邀请失效 / 已有账号」分支依赖 Token 校验回执，随端点接入呈现，不伪造；
 *             原型状态仿真切换器不迁入
 * 视觉：左 45% 邀请信息区（镜面布局）+ 右 55% 确认表单；语义 tokens（域色 hex 为例外）
 */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** 演示邀请数据（端点落地前静态呈现，Badge 显式标注） */
const DEMO_INVITE = {
  inviter: "王编导",
  workspace: "星辉影业漫剧工坊 · 生产空间",
  role: "专业剪辑（Editor）",
  roleColor: "#9d7cd8",
  roleDesc: "负责多轨道时间线粗剪、BGM 情绪卡点排镜与硬件渲染导出。",
  email: "editor.li@studio.com",
  expiresAt: "2026-10-18",
  permissions: [
    "可访问剧本工作台与分镜设计器",
    "可提交批量生成与渲染导出任务",
    "可查看项目全网数据看板",
    "不可访问系统管理、权限分配与合规审计",
  ],
};

export default function InviteLandingPage() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    // TODO：接受邀请端点落地前不伪造加入成功与工作台跳转
    toast({
      title: "接受邀请端点待接入",
      description: "邀请签名校验 + 工作空间角色挂载随网关批次落地",
      variant: "warning",
    });
  };

  return (
    <div className="dark flex min-h-screen w-full select-none flex-col overflow-y-auto bg-background text-foreground animate-in fade-in duration-200 lg:flex-row">
      {/* 左 45% · 邀请信息区 */}
      <div className="relative flex w-full flex-col justify-between overflow-hidden border-b border-border p-6 pt-16 sm:p-10 lg:w-[45%] lg:border-b-0 lg:border-r lg:p-14">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-[460px] w-[460px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(157, 124, 216, 0.08) 0%, transparent 70%)" }}
        />

        <div className="z-10 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/yyc3-icons/logo.svg" alt="YYC³" className="h-8 w-auto invert" />
          <div className="h-5 w-px bg-border" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            AI Family · Comic Drama
          </span>
        </div>

        <div className="z-10 my-6 w-full max-w-md space-y-6 lg:my-auto">
          {/* 头像组（确定性渐变占位，零外链） */}
          <div className="flex items-center">
            <div className="z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary/60 to-primary/20 text-xs font-bold shadow-md">
              邀
            </div>
            <div className="z-20 -ml-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-[#9d7cd8]/60 to-[#9d7cd8]/20 text-xs font-bold shadow-md">
              协
            </div>
            <div className="z-10 -ml-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-secondary font-mono text-xs font-bold text-primary shadow-md">
              +3
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {DEMO_INVITE.inviter} 邀请你加入
              </h1>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500">
                演示数据
              </Badge>
            </div>
            <h2 className="text-lg font-normal text-muted-foreground">{DEMO_INVITE.workspace}</h2>
          </div>

          {/* 预分配角色卡 */}
          <div className="w-full max-w-xs space-y-1.5 rounded-xl border border-[#9d7cd8]/30 bg-secondary p-3.5">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              你将获得的角色
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{DEMO_INVITE.role}</span>
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: DEMO_INVITE.roleColor }}
                title="剪辑域色"
              />
            </div>
            <p className="text-[11px] leading-tight text-muted-foreground">{DEMO_INVITE.roleDesc}</p>
          </div>

          {/* 权限清单 */}
          <div className="space-y-2 pt-2">
            <span className="block text-xs font-bold">角色权限清单：</span>
            <div className="space-y-1.5 text-xs">
              {DEMO_INVITE.permissions.map((p) => (
                <div key={p} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span className="text-[11px]">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="z-10 mt-6 flex flex-wrap items-center gap-1.5 border-t border-border pt-3 font-mono text-xs text-amber-500 lg:mt-0">
          <Clock className="h-3.5 w-3.5" />
          <span>该邀请链接将在 7 天后失效（{DEMO_INVITE.expiresAt}）</span>
        </div>
      </div>

      {/* 右 55% · 确认表单区 */}
      <div className="relative flex w-full flex-col items-center justify-center p-4 py-10 sm:p-8 lg:w-[55%] lg:py-8">
        <div className="w-full max-w-[400px] rounded-2xl border border-primary/15 bg-card p-5 shadow-2xl transition-all duration-200 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-bold tracking-tight">接受邀请</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">完善账号密码即可加入工作空间</p>
            </div>

            {/* 受邀邮箱（只读） */}
            <div className="space-y-1">
              <span className="block text-[11px] text-muted-foreground">受邀邮箱（只读锁定）：</span>
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-muted-foreground">
                <Mail className="h-4 w-4 text-muted-foreground/70" />
                <input
                  type="text"
                  readOnly
                  value={DEMO_INVITE.email}
                  className="flex-1 cursor-not-allowed bg-transparent font-mono text-xs text-foreground focus:outline-none"
                />
                <Lock className="h-3.5 w-3.5 text-muted-foreground/70" />
              </div>
            </div>

            {/* 设置密码 */}
            <div className="space-y-1">
              <span className="block text-[11px] text-muted-foreground">设置登录密码：</span>
              <div className="flex items-center gap-2.5 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="flex-1 bg-transparent font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-primary"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[11px] text-muted-foreground">确认密码：</span>
              <div className="flex items-center gap-2.5 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次确认密码"
                  className="flex-1 bg-transparent font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-input accent-primary"
              />
              <span>同意并遵循星辉影业团队协同规范</span>
            </label>

            <Button type="submit" disabled={!agreed} className="w-full font-bold">
              <span>完成加入团队</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>

            <div className="pt-1 text-center">
              <Link
                href="/login"
                className="text-xs text-muted-foreground/70 transition-colors hover:text-red-600"
              >
                拒绝本次邀请
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
