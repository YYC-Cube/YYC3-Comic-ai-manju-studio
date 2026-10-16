"use client";

/**
 * W2 认知增强浮窗（M5-R6 · 迁移自 MiniMax-3 原型 widgets/W2CognitionWidget）
 * 真链路裁决：
 *   - 九步轨迹回放（播放/倍速/重放/点步定位）为真实本地视图交互，保留；
 *     轨迹源端点缺位——当前为确定性演示轨迹，「轨迹演示」Badge 明示
 *   - 右栏认知检查器（置信度/记忆命中/算力 Token）原型为硬编码数值——保留卡片机制，
 *     数值标「演示」字样的统一 Badge 明示，不冒充实时遥测
 *   - 人工指令热注入：Learning Inbox 收录端点缺位——toast 占位 + TODO，
 *     剔除原型「已成功注入并收录」伪造成功反馈
 *   - 原型 driveMode 参数为死代码（声明未消费），按裁剪原则移除
 * 布局：左栏九步轨迹回放器 + 注入条；右栏执行单元/置信度分流/记忆回溯/算力消耗四卡
 */
import { useState } from "react";
import { Brain, CheckCircle2, Minimize2, Pause, Play, RotateCcw, X } from "lucide-react";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { ConfidenceBadge } from "@/components/common/confidence-badge";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AGENTS_MAP, DEFAULT_AGENT_ID, NINE_STEP_PIPELINE } from "@/lib/agents";
import { useOverlaysStore } from "@/lib/overlays-store";

export function W2CognitionWidget() {
  const { toast } = useToast();
  const { w2Open, w2AgentId, closeW2, switchToW1 } = useOverlaysStore();

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<"0.5x" | "1x" | "2x">("1x");
  const [activeStep, setActiveStep] = useState<number>(6);
  const [injectedPrompt, setInjectedPrompt] = useState("");

  if (!w2Open) return null;

  const focusAgent = AGENTS_MAP[w2AgentId] ?? AGENTS_MAP[DEFAULT_AGENT_ID];
  const currentStepInfo =
    NINE_STEP_PIPELINE.find((s) => s.step === activeStep) ?? NINE_STEP_PIPELINE[5];
  const stepAgent = AGENTS_MAP[currentStepInfo.agentId];

  const handleInject = () => {
    if (!injectedPrompt.trim()) return;
    // TODO：人工注入与 Learning Inbox 收录端点缺位——占位不伪造成功反馈
    toast({
      title: "注入端点待接入",
      description: "人工干预与 Learning Inbox 收录链路随认知域批次落地",
      variant: "warning",
    });
    setInjectedPrompt("");
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex h-[720px] w-[580px] flex-col overflow-hidden rounded-2xl border border-[#00e0b8]/35 bg-zinc-950 shadow-2xl"
      style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(0,224,184,0.2)" }}
      role="dialog"
      aria-label="W2 认知增强浮窗"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 p-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#7B8CFF] bg-[#7B8CFF]/20 text-[#7B8CFF]">
            <Brain className="h-4 w-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-wide">W2 认知增强浮窗 · ReAct-C 轨迹复盘</span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                DEEP TRACE
              </Badge>
              <Badge variant="warning" className="font-mono text-[10px]">
                轨迹演示 · 遥测端点待接入
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              可见即可信 · 人机共驾 · 聚焦：{focusAgent.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={switchToW1}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground"
            title="切换为标准助理视图（W1）"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={closeW2}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 主区：左轨迹回放 + 右认知检查器 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左：九步轨迹回放器 */}
        <div className="flex w-3/5 flex-col border-r border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 p-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="cursor-pointer rounded bg-zinc-800 p-1.5 text-[#00e0b8] transition-colors hover:bg-zinc-700"
                title={isPlaying ? "暂停回放" : "继续回放"}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="cursor-pointer rounded bg-zinc-800 p-1.5 text-muted-foreground transition-colors hover:bg-zinc-700 hover:text-foreground"
                title="回到第一步"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <div className="ml-1 flex items-center rounded border border-zinc-800 bg-zinc-950">
                {(["0.5x", "1x", "2x"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`cursor-pointer px-1.5 py-0.5 font-mono text-[10px] ${
                      speed === s
                        ? "bg-zinc-800 font-bold text-[#00e0b8]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              Step <strong className="text-[#00e0b8]">{activeStep}</strong>/9
            </div>
          </div>

          {/* 九步列表（真实点击定位） */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {NINE_STEP_PIPELINE.map((s) => {
              const agent = AGENTS_MAP[s.agentId];
              const isCurrent = activeStep === s.step;
              const isPast = activeStep > s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStep(s.step)}
                  className={`block w-full cursor-pointer rounded-xl border p-2.5 text-left transition-all ${
                    isCurrent
                      ? "border-[#00e0b8]/40 bg-zinc-800 shadow-md"
                      : isPast
                        ? "border-zinc-800 bg-zinc-900 opacity-80"
                        : "border-transparent bg-zinc-900/40 opacity-40"
                  }`}
                  style={{
                    borderLeft: isCurrent ? `3px solid ${agent?.color ?? "#00e0b8"}` : undefined,
                  }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 font-mono text-[10px] font-bold text-muted-foreground">
                        {s.step}
                      </span>
                      <span className="text-xs font-bold">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isPast && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      {isCurrent && (
                        <span className="h-2 w-2 animate-ping rounded-full bg-[#00e0b8]" />
                      )}
                      <span className="font-mono text-[10px]" style={{ color: agent?.color }}>
                        {agent?.name}
                      </span>
                    </div>
                  </div>
                  <p className="truncate pl-6 text-[11px] leading-tight text-muted-foreground">
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* 人工指令热注入（端点缺位 toast 占位） */}
          <div className="border-t border-zinc-800 bg-zinc-900 p-2.5">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-500">
              人工指令热注入（Human Injection）
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={injectedPrompt}
                onChange={(e) => setInjectedPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInject()}
                placeholder="在当前推理步骤注入干预约束…"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleInject}
                className="cursor-pointer rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-400"
              >
                注入
              </button>
            </div>
          </div>
        </div>

        {/* 右：认知检查器（演示数值 Badge 明示） */}
        <div className="w-2/5 space-y-4 overflow-y-auto bg-zinc-950 p-3.5 text-xs">
          <div>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              当前执行单元
            </span>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <AgentAvatar agentId={currentStepInfo.agentId} size="md" />
              <div>
                <h4 className="text-xs font-bold">{stepAgent?.name}</h4>
                <p className="text-[11px] text-muted-foreground">{stepAgent?.role}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                认知置信度分流
              </span>
              <Badge variant="warning" className="font-mono text-[9px]">
                演示
              </Badge>
            </div>
            <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">当前步得分：</span>
                <ConfidenceBadge confidence={0.92} size="sm" />
              </div>
              <div className="text-[11px] leading-tight text-muted-foreground/70">
                阈值策略：≥0.9 自动流转 / 0.6-0.9 需人工确认 / &lt;0.6 触发议事厅
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                三层记忆回溯命中（Memory）
              </span>
              <Badge variant="warning" className="font-mono text-[9px]">
                演示
              </Badge>
            </div>
            <div className="space-y-1 rounded-lg border border-[#00B4D8]/20 bg-zinc-900 p-2.5 text-[11px]">
              <div className="flex items-center justify-between font-mono text-[#00B4D8]">
                <span>[Project Scope]</span>
                <span>Recalled 234 次</span>
              </div>
              <p className="leading-tight text-muted-foreground">
                命中规则示例：角色瞳孔在聚光下必须带专属色高光
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                算力消耗与 Token
              </span>
              <Badge variant="warning" className="font-mono text-[9px]">
                演示
              </Badge>
            </div>
            <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Prompt Tokens:</span>
                <span>1,420</span>
              </div>
              <div className="flex justify-between">
                <span>Completion:</span>
                <span>384</span>
              </div>
              <div className="flex justify-between">
                <span>GPU 节点:</span>
                <span className="text-[#00e0b8]">yyc3-101（vLLM）</span>
              </div>
              <div className="flex justify-between">
                <span>单步预估费用:</span>
                <span className="text-emerald-500">¥ 0.00032</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
