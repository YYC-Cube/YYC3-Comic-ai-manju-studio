"use client";

/**
 * 首次配置向导页（P2 · 迁移自 MiniMax-3 原型 auth/OnboardingPage）
 * 真链路裁决：向导完成端点（POST /v1/auth/onboarding/finalize）缺位——完成提交 toast 占位 + TODO，
 *             不伪造「派生演练剧目」与跳转；「跳过配置」为纯导航（不写后端状态）；
 *             第 3 步 DGX 连通指示与 NAS 容量为原型演示数据，以 Badge 显式标注
 *             （真实嗅探随 finalize 端点接入）；
 *             第 4 步 Agent 网格为真实名录（lib/agents AGENTS_LIST 单一事实源）；
 *             原型 AuthBrandClock 完整版随视觉深化批次迁移，当前用共享 AgentChronoRing
 * 视觉：四段进度条 + 居中向导区；语义 tokens（域色 hex 为例外）
 */
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  HardDrive,
  Layers,
  Smartphone,
  Sparkles,
  Tv,
} from "lucide-react";
import { AgentChronoRing } from "@/components/auth/agent-chrono-ring";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AGENTS_LIST } from "@/lib/agents";

type ContentFormat = "vertical" | "horizontal" | "both";
type ComputeMode = "dgx" | "cloud" | "hybrid";

const GENRES = ["都市", "古风", "悬疑", "甜宠", "玄幻", "科幻"];

const FORMAT_OPTIONS: { id: ContentFormat; name: string; desc: string; icon: typeof Smartphone; color: string }[] = [
  { id: "vertical", name: "竖屏短剧（9:16）", desc: "针对抖音 / 微信视频号 / 快手短剧信息流，黄金 3 秒节奏。", icon: Smartphone, color: "text-primary" },
  { id: "horizontal", name: "横屏漫剧（16:9）", desc: "针对 B 站 / YouTube 影视级叙事长镜头，4K 超清画质。", icon: Tv, color: "text-sky-400" },
  { id: "both", name: "两者皆有（自适应）", desc: "支持多画幅并行渲染导出，由知遇·伯乐智能裁剪排布。", icon: Layers, color: "text-[#9d7cd8]" },
];

const COMPUTE_OPTIONS: { id: ComputeMode; name: string; desc: string; icon: typeof Cpu; color: string; online?: boolean }[] = [
  { id: "dgx", name: "本地 DGX 集群（推荐）", desc: "yyc3-101 / 102 专有集群，极速 NVENC 硬件直连。", icon: Cpu, color: "text-primary", online: true },
  { id: "cloud", name: "弹性云端算力池", desc: "按量计费，遇业务爆发自动弹性扩缩容。", icon: Layers, color: "text-sky-400" },
  { id: "hybrid", name: "混合调度模式", desc: "日间本地 DGX 推理，夜间平电云端错峰渲染。", icon: Sparkles, color: "text-[#9d7cd8]" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [contentFormat, setContentFormat] = useState<ContentFormat>("vertical");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["都市"]);
  const [computeMode, setComputeMode] = useState<ComputeMode>("dgx");

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((i) => i !== g) : [...prev, g],
    );
  };

  const stepNav = (next: number, label: string) => (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setCurrentStep(next - 1)}
        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>上一步</span>
      </button>
      <button
        type="button"
        onClick={() => setCurrentStep(next)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-6 py-2 text-xs font-bold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
      >
        <span>{label}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="dark relative flex min-h-screen w-full select-none flex-col justify-between overflow-hidden bg-background p-4 text-foreground animate-in fade-in duration-200 sm:p-8">
      {/* 顶部四段进度条 */}
      <div className="z-10 flex w-full flex-col items-center gap-2 pt-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className="h-1 w-16 rounded-full transition-all duration-300 sm:w-20"
              style={{
                backgroundColor: currentStep >= step ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                boxShadow: currentStep === step ? "0 0 8px hsl(var(--primary) / 0.6)" : undefined,
              }}
            />
          ))}
        </div>
        <div className="flex w-full max-w-2xl items-center justify-between px-2 font-mono text-xs text-muted-foreground/70">
          <span>步骤 {currentStep} / 4</span>
          <Link href="/dashboard" className="cursor-pointer hover:text-foreground">
            跳过配置 →
          </Link>
        </div>
      </div>

      {/* 向导主区 */}
      <div className="z-10 mx-auto my-auto w-full max-w-3xl">
        {/* 第 1 步 · 欢迎 */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center space-y-6 text-center animate-in zoom-in-95">
            <AgentChronoRing diameter={240} activeAgentId="yushu-wanwu" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">欢迎加入 YYC³ AI Family</h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                你将拥有 8 个拟人化 AI 伙伴，他们会以 ReAct-C 闭环协同完成从小说到成片的每一步。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-8 py-3 text-xs font-bold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
            >
              <span>开始个性化配置</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 第 2 步 · 产出方向偏好 */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold">告诉我们你的漫剧产出方向</h2>
              <p className="text-xs text-muted-foreground">我们将预设最匹配的渲染画幅与运镜算法模型</p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {FORMAT_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setContentFormat(opt.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    contentFormat === opt.id
                      ? "border-primary bg-secondary shadow-lg"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <opt.icon className={`mb-2 h-6 w-6 ${opt.color}`} />
                  <h3 className="text-xs font-bold">{opt.name}</h3>
                  <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{opt.desc}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-card p-4">
              <span className="block text-xs font-bold">主攻漫剧题材（可多选）：</span>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => {
                  const isSel = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        isSel
                          ? "bg-primary font-bold text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {stepNav(3, "下一步：连接算力")}
          </div>
        )}

        {/* 第 3 步 · 算力与存储 */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold">连接你的算力与存储中枢</h2>
              <p className="text-xs text-muted-foreground">保障单集出片成本 ≤ ¥2.00 与毫秒级文件直读</p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {COMPUTE_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setComputeMode(opt.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    computeMode === opt.id
                      ? "border-primary bg-secondary shadow-lg"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <opt.icon className={`h-6 w-6 ${opt.color}`} />
                    {opt.online && (
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold">{opt.name}</h3>
                  <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{opt.desc}</p>
                </div>
              ))}
            </div>

            {/* NAS 存储卡（演示数据：真实嗅探随 finalize 端点接入） */}
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <span className="flex items-center gap-2 text-xs font-bold">
                    /mnt/nas 统一单一事实源存储
                    <Badge variant="outline" className="border-amber-500/40 text-amber-500">
                      演示数据
                    </Badge>
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    已连接 · 12.4 TB / 24 TB 可用（52%）
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-500">正常挂载</span>
            </div>

            {stepNav(4, "下一步：认识 AI Family")}
          </div>
        )}

        {/* 第 4 步 · 认识你的 AI Family（真实名录） */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold">认识你的 8 个 AI Family 创作伙伴</h2>
              <p className="text-xs text-muted-foreground">视觉平等 · 角色专精 · ReAct-C 九步实时协同</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {AGENTS_LIST.map((ag) => (
                <div
                  key={ag.id}
                  className="group flex h-36 cursor-pointer flex-col justify-between rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${ag.color}26`, color: ag.color }}
                    >
                      {ag.name.charAt(0)}
                    </span>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold transition-colors group-hover:text-primary">
                      {ag.name}
                    </h3>
                    <span className="block text-[10px] text-muted-foreground">{ag.role}</span>
                  </div>
                  <span className="block truncate font-mono text-[9px] text-muted-foreground/70">
                    {ag.desc}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>上一步</span>
              </button>
              <FinishButton />
            </div>
          </div>
        )}
      </div>

      {/* 底部标语 */}
      <div className="z-10 text-center font-mono text-xs text-muted-foreground/70">
        YYC³ AI Family Industrial Production System
      </div>
    </div>
  );
}

function FinishButton() {
  const { toast } = useToast();
  // TODO：向导完成端点（POST /v1/auth/onboarding/finalize）落地前不伪造派生演练剧目与跳转
  return (
    <button
      type="button"
      onClick={() =>
        toast({
          title: "向导完成端点待接入",
          description: "偏好持久化与首个演练剧目派生随网关批次落地；可经顶部「跳过配置」先行进入工作台",
          variant: "warning",
        })
      }
      className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-xs font-bold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
    >
      <span>完成配置并进入工作台</span>
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
