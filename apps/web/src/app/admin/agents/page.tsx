"use client";

/**
 * 智能体训练中心页（M5-P2 · 迁移自 MiniMax-3 原型 management/AdminAgentsPage）
 * 真链路：样本/记忆端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/management.ts）；
 *         审核通过/拒绝/合规遗忘为演示态本地翻转 + toast 明示「未持久化」（不伪造服务端生效）；
 *         Prompt 版本与灰度滑杆为演示态本地状态（发布端点缺位，改动不落库）；
 *         Agent 卡「查看轨迹」→ W2 认知浮窗真链路（M5-R6 已接通）
 * 布局：头部（徽章 + 四 Tab）→ 健康总览 / Learning Inbox / 记忆管理 / 提示词工程
 */
import { useEffect, useState } from "react";
import { Check, Inbox, Trash2 } from "lucide-react";
import { withFallback } from "@/api/client";
import {
  listAgentMemories,
  listLearningSamples,
  type LearningSample,
  type MemoryEntry,
} from "@/api/management";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";
import { AGENTS_LIST } from "@/lib/agents";
import { useOverlaysStore } from "@/lib/overlays-store";

/** 演示数据（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_SAMPLES: LearningSample[] = [
  {
    id: "LS-2041",
    type: "分镜提示词",
    sourceProject: "《雨夜霓虹》",
    sourceShot: "E01-S07",
    timestamp: "2026-10-15 22:41",
    agentName: "创想·灵韵",
    recommendation: "采纳",
    confidenceBefore: 0.72,
    confidenceExpected: 0.91,
    reviewNote: "雨夜霓虹反射的地面高光描述被人工改写后过检，改写版本对湿滑路面的色彩层次提示更精确。",
    status: "pending",
  },
  {
    id: "LS-2040",
    type: "角色一致性",
    sourceProject: "《凌霄剑仙》",
    sourceShot: "E03-S02",
    timestamp: "2026-10-15 18:07",
    agentName: "格物·宗师",
    recommendation: "采纳",
    confidenceBefore: 0.68,
    confidenceExpected: 0.88,
    reviewNote: "侧逆光下主角金瞳高光点位的修正样本，质检驳回后经人工标注重新提交。",
    status: "pending",
  },
];

const DEMO_MEMORIES: MemoryEntry[] = [
  {
    id: "MEM-091",
    scope: "PROJECT",
    category: "角色设定",
    usageCount: 37,
    content: "叶凌霄的金瞳仅在情绪爆发帧点亮，常态为深褐色；RefCard-V3 已锁定虹膜高光形态。",
    source: "议事厅决策 #D-112",
    traceShots: ["S01-01", "S01-03"],
  },
  {
    id: "MEM-087",
    scope: "GLOBAL",
    category: "运镜偏好",
    usageCount: 52,
    content: "竖屏短剧冷开场优先使用低角度仰拍 + 快速推进，黄金 3 秒内完成冲突前置。",
    source: "爆款回流分析",
    traceShots: ["S01-01"],
  },
];

const OVERVIEW_STATS = [
  { label: "Agent 平均准确率", value: "93.8%", note: "环比提升 +4.2%", tone: "text-emerald-500" },
  { label: "人工干预率（越低越好）", value: "2.7%", note: "持续平稳下降中", tone: "text-primary" },
  { label: "本周采纳学习样本", value: "89 例", note: "Few-shot 增量入库", tone: "text-[#B57BFF]" },
  { label: "三层激活记忆条目", value: "337 条", note: "全链路毫秒级回溯", tone: "text-sky-400" },
];

type TabId = "overview" | "inbox" | "memory" | "prompts";
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "健康总览" },
  { id: "inbox", label: "Learning Inbox" },
  { id: "memory", label: "记忆管理" },
  { id: "prompts", label: "提示词工程" },
];

export default function AdminAgentsPage() {
  const { toast } = useToast();
  const openW2 = useOverlaysStore((s) => s.openW2);
  const [activeTab, setActiveTab] = useState<TabId>("inbox");
  const [canaryRollout, setCanaryRollout] = useState(50);

  const { data: samplesData } = useApiData(
    () => withFallback(listLearningSamples, () => DEMO_SAMPLES),
    { snapshotKey: "agent-samples:v1" },
  );
  const { data: memoriesData } = useApiData(
    () => withFallback(listAgentMemories, () => DEMO_MEMORIES),
    { snapshotKey: "agent-memories:v1" },
  );
  const [samples, setSamples] = useState<LearningSample[]>([]);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  useEffect(() => {
    if (samplesData) setSamples(samplesData.data);
  }, [samplesData]);
  useEffect(() => {
    if (memoriesData) setMemories(memoriesData.data);
  }, [memoriesData]);

  const isMock = (samplesData?.isMock ?? true) || (memoriesData?.isMock ?? true);

  /** 演示态动作：本地翻转 + 明示未持久化（端点缺位，不伪造服务端生效） */
  const demoAction = (action: string) =>
    toast({
      title: `演示态：${action}未持久化`,
      description: "审核/遗忘端点随智能体训练域批次落地后生效",
      variant: "default",
    });

  const handleApproveSample = (id: string) => {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, status: "approved" } : s)));
    demoAction("审核通过");
  };
  const handleRejectSample = (id: string) => {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, status: "rejected" } : s)));
    demoAction("拒绝入库");
  };
  const handleForgetMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    demoAction("合规遗忘");
  };

  return (
    <div>
      <PageHeader
        title="智能体训练中心（Agent Lab）"
        description="Learning Inbox 人工审核 · 三层记忆管理（支持合规遗忘）· Prompt 版本灰度发布"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            复利智能 · 越用越准
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 训练域端点待接入
            </Badge>
          )}
        </div>
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5 font-mono text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`cursor-pointer rounded px-3 py-1 transition-all ${
                activeTab === t.id
                  ? "bg-sky-400 font-bold text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1 · 健康总览 */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {OVERVIEW_STATS.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-3.5">
                  <span className="block text-xs text-muted-foreground">{s.label}</span>
                  <span className={`font-mono text-2xl font-bold ${s.tone}`}>{s.value}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">{s.note}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {AGENTS_LIST.map((ag) => (
              <button
                key={ag.id}
                type="button"
                onClick={() => openW2(ag.id)}
                className="group cursor-pointer space-y-2 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${ag.color}26`, color: ag.color }}
                  >
                    {ag.name.charAt(0)}
                  </span>
                  <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-emerald-500">
                    在线 100%
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold transition-colors group-hover:text-primary">
                    {ag.name}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">{ag.role}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1 font-mono text-[10px] text-muted-foreground/70">
                  <span>专精：{ag.desc.split("、")[0]}</span>
                  <span className="text-primary">查看轨迹 →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2 · Learning Inbox */}
      {activeTab === "inbox" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-[#B57BFF]/25 bg-card p-3 text-xs">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-[#B57BFF]" />
              <span className="font-bold">Learning Inbox 待审样本库（所有样本必须经人类审核才入库）</span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              待处理：{samples.filter((s) => s.status === "pending").length} 项
            </span>
          </div>

          {samples.map((sample) => (
            <Card key={sample.id} className="transition-all hover:border-[#B57BFF]">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs font-bold text-[#B57BFF]">
                      {sample.type}
                    </span>
                    <h4 className="text-xs font-bold">
                      来源：{sample.sourceProject} · {sample.sourceShot}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-muted-foreground">{sample.timestamp}</span>
                    <span className="text-primary">提交人：{sample.agentName}</span>
                  </div>
                </div>

                <div className="space-y-1 rounded-lg border border-border bg-background p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      专家复核建议：<strong>{sample.recommendation}</strong>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-red-600">
                        初试得分：{(sample.confidenceBefore * 100).toFixed(0)}%
                      </span>
                      <span>→</span>
                      <span className="text-emerald-500">
                        入库预期：{(sample.confidenceExpected * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="pt-1 text-[11px] leading-relaxed">{sample.reviewNote}</p>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-[11px] text-muted-foreground/70">
                    入库后将作为该角色/运镜后续推理的 Few-shot 检索锚点
                  </span>
                  <div className="flex items-center gap-2">
                    {sample.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRejectSample(sample.id)}
                          className="cursor-pointer rounded-lg bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-red-600/20 hover:text-red-600"
                        >
                          拒绝入库
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveSample(sample.id)}
                          className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>人工审核通过 · 入库 Few-shot</span>
                        </button>
                      </>
                    ) : (
                      <span className="font-mono text-xs font-bold text-emerald-500">
                        ✓ 已正式收录至基座示例库
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3 · 记忆管理 */}
      {activeTab === "memory" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-sky-400/25 bg-card p-3 text-xs">
            <span className="font-bold">三层记忆管理（会话层 / 项目层 / 全局层 · 支持合规遗忘）</span>
            <span className="font-mono text-[11px] text-sky-400">
              已收录 {memories.length} 条有效事实记忆
            </span>
          </div>

          {memories.map((mem) => (
            <Card key={mem.id} className="transition-all hover:border-sky-400">
              <CardContent className="flex items-start justify-between gap-4 p-3.5 text-xs">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-sky-400">
                      {mem.scope}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      分类：{mem.category}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      已回溯 {mem.usageCount} 次
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{mem.content}</p>
                  <div className="flex items-center gap-3 pt-1 font-mono text-[10px] text-muted-foreground/70">
                    <span>来源：{mem.source}</span>
                    <span>影响镜头：{mem.traceShots.join(", ")}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleForgetMemory(mem.id)}
                  className="shrink-0 cursor-pointer rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:bg-red-600/20 hover:text-red-600"
                  title="遗忘该条记忆（合规删除）"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 4 · 提示词工程 */}
      {activeTab === "prompts" && (
        <Card className="border-primary/15">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">创想·灵韵 System Prompt 版本管理（90 天审计追踪）</span>
              <span className="font-mono text-xs text-primary">当前生效版本：v4.2.1-prod</span>
            </div>

            <textarea
              rows={4}
              readOnly
              value="You are 创想·灵韵, the master creative agent of YYC³ AI Family. Output strictly 12-field schema JSON. Keep character face alignment consistent with assigned RefCard."
              className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs text-primary focus:outline-none"
            />

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">新版本灰度放量比例（Canary Rollout）：</span>
                <span className="font-mono font-bold text-primary">{canaryRollout}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={10}
                value={canaryRollout}
                onChange={(e) => {
                  setCanaryRollout(Number(e.target.value));
                  demoAction("灰度比例调整");
                }}
                className="w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground/70">
                <span>10%（小范围测试）</span>
                <span>50%（半数流量）</span>
                <span>100%（全量发布）</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
