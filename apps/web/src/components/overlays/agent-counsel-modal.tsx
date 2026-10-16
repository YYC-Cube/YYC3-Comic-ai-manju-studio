"use client";

/**
 * 议事厅仲裁模态（M5-R6 · 迁移自 MiniMax-3 原型 counsel/AgentCounselModal）
 * 真链路裁决：
 *   - 议题内容（S01-04 一致性 vs 戏剧张力分歧）为原型硬编码演示议题——保留交互机制，
 *     「演示议题」Badge 明示；真实议题源端点缺位
 *   - 「采纳仲裁」「人工否决」处置端点缺位——toast 占位 + TODO，不伪造执行反馈
 *   - Learning Inbox 归档勾选为本地状态（收录链路随认知域批次落地）
 *   - 人类红线保障文案保留（产品原则真实声明：最终处置权 100% 归属人类）
 * 布局：头部议题 → 双方立场卡（质检方 vs 创作方）→ 仲裁建议 → 人类处置动作
 */
import { useState } from "react";
import { CheckCircle2, Inbox, Scale, Shield, ThumbsDown, X } from "lucide-react";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { ConfidenceBadge } from "@/components/common/confidence-badge";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AGENTS_MAP, COUNSEL_ROLE_AGENT_IDS } from "@/lib/agents";
import { useOverlaysStore } from "@/lib/overlays-store";

export function AgentCounselModal() {
  const { toast } = useToast();
  const { counselOpen, closeCounsel } = useOverlaysStore();
  const [saveToInbox, setSaveToInbox] = useState(true);

  if (!counselOpen) return null;

  const agentA = AGENTS_MAP[COUNSEL_ROLE_AGENT_IDS.quality];
  const agentB = AGENTS_MAP[COUNSEL_ROLE_AGENT_IDS.creator];
  const arbiter = AGENTS_MAP[COUNSEL_ROLE_AGENT_IDS.arbiter];

  const handleAdopt = () => {
    // TODO：仲裁处置执行端点缺位（含 Learning Inbox 归档：saveToInbox）
    toast({
      title: "仲裁处置端点待接入",
      description: `采纳执行与样本归档（${saveToInbox ? "归档开启" : "归档关闭"}）随认知域批次落地`,
      variant: "warning",
    });
  };

  const handleOverride = () => {
    // TODO：人工否决自定义处置端点缺位
    toast({
      title: "人工否决端点待接入",
      description: "自定义处置表单随认知域批次落地",
      variant: "warning",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="多 Agent 议事厅"
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#00e0b8]/30 bg-zinc-950 shadow-2xl"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 24px rgba(0,224,184,0.2)" }}
      >
        {/* 头部议题 */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-2 text-amber-500">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">YYC³ 多 Agent 议事厅（Agent Counsel）</h3>
                <Badge variant="destructive" className="font-mono text-[10px]">
                  冲突仲裁中
                </Badge>
                <Badge variant="warning" className="font-mono text-[10px]">
                  演示议题 · 议题源端点待接入
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                议题：分镜 S01-04（角色特写）一致性 vs 戏剧张力分歧 · 置信度差 &gt; 0.2
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCounsel}
            className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 冲突双方立场卡 */}
        <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-5">
          <div
            className="relative rounded-xl border border-red-500/30 bg-zinc-900 p-4"
            style={{ borderLeft: `3px solid ${agentA.color}` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AgentAvatar agentId={agentA.id} size="sm" />
                <div>
                  <h4 className="text-xs font-bold">{agentA.name}</h4>
                  <span className="text-[10px] text-muted-foreground">{agentA.role}</span>
                </div>
              </div>
              <ConfidenceBadge confidence={0.54} size="sm" />
            </div>
            <div className="space-y-1.5 text-xs">
              <span className="block font-bold text-red-500">立场：坚决打回重生成（Trigger Gate G3）</span>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                “面部特征向量与角色 RefCard 相似度仅为 64%，低于 80% 工业红线；神态偏离人物核心设定。”
              </p>
            </div>
          </div>

          <div
            className="relative rounded-xl border border-[#00e0b8]/30 bg-zinc-900 p-4"
            style={{ borderLeft: `3px solid ${agentB.color}` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AgentAvatar agentId={agentB.id} size="sm" />
                <div>
                  <h4 className="text-xs font-bold">{agentB.name}</h4>
                  <span className="text-[10px] text-muted-foreground">{agentB.role}</span>
                </div>
              </div>
              <ConfidenceBadge confidence={0.88} size="sm" />
            </div>
            <div className="space-y-1.5 text-xs">
              <span className="block font-bold text-[#00e0b8]">立场：保留该动态镜头（Creative Flow）</span>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                “镜头处于剧烈运动帧，微表情变化属于情绪外溢；光影氛围符合短剧黄金前 3 秒吸睛定律。”
              </p>
            </div>
          </div>
        </div>

        {/* 仲裁建议 */}
        <div className="border-y border-zinc-800 bg-zinc-900 px-5 py-4">
          <div className="flex items-start gap-3">
            <AgentAvatar agentId={arbiter.id} size="md" />
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#00e0b8]">
                    {arbiter.name}（全局编排仲裁建议）
                  </span>
                  <ConfidenceBadge confidence={0.92} size="sm" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">ReAct-C Step 6</span>
              </div>
              <div className="rounded-xl border border-[#00e0b8]/20 bg-zinc-800 p-3 text-xs leading-relaxed">
                “仲裁方案：采纳【约束性重绘】。提示词追加人物神态特征词汇，LoRA Ref 权重 0.65 动态提权至
                0.82，重绘面部区域（耗时约 12 秒），兼顾一致性与戏剧冲突。”
              </div>

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={saveToInbox}
                  onChange={(e) => setSaveToInbox(e.target.checked)}
                  className="rounded border-zinc-700 accent-[#00e0b8]"
                />
                <span className="flex items-center gap-1">
                  <Inbox className="h-3.5 w-3.5 text-[#B57BFF]" />
                  <span>仲裁采纳后自动归档至 Learning Inbox（沉淀为 Few-shot 教学样本）</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 人类处置动作（红线保障） */}
        <div className="flex items-center justify-between bg-zinc-950 p-4">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Shield className="h-3.5 w-3.5 text-[#00e0b8]" />
            红线保障：议事厅仲裁仅提供决策参考，最终处置权 100% 归属人类
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOverride}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-orange-500/30 bg-zinc-900 px-3 py-2 text-xs font-medium text-orange-400 transition-colors hover:bg-zinc-800"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span>人工否决建议（自定义）</span>
            </button>
            <button
              type="button"
              onClick={handleAdopt}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#00e0b8] px-4 py-2 text-xs font-bold text-zinc-950 shadow-lg transition-colors hover:bg-[#00c9a5]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>采纳天枢仲裁方案（立即执行）</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
