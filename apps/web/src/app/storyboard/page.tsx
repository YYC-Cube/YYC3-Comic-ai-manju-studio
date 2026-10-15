"use client";

/**
 * 分镜设计器（M3 · 迁移自 MiniMax-3 原型 production/StoryboardPage）
 * 双模式：12 字段表格 / 画布节点流；右侧 Inspector 支持 Prompt 编辑（PATCH 真实生效）
 * 数据分层（D2 治理落地）：
 *   - 结构数据 ← 真实 GET 持久化端点（StoryboardV1，引擎播种），经适配器转 UI 全称枚举
 *   - 生产态字段（status/consistencyScore/confidence/thumbnail/seed）← 演示覆盖层（按镜头序位），
 *     显式 Badge 标注；TODO(M4) 生产态存储落地后按 shot_id 真实关联
 *   - 远程校验：store.load 优先 validateRemote（引擎规则），校验来源与 warnings 上页面
 */
import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Layers,
  LayoutGrid,
  Loader2,
  Play,
  RotateCw,
  Shield,
  Table as TableIcon,
  XCircle,
} from "lucide-react";
import { BatchActionBar } from "@/components/common/batch-action-bar";
import { ConfidenceBadge } from "@/components/common/confidence-badge";
import { Thumb } from "@/components/common/thumb";
import { ViewStateGate } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { resolveViewState } from "@/hooks/use-view-state";
import { toUiShot, type ShotUI } from "@/lib/storyboard-adapter";
import { REF_CONSISTENCY_PASS } from "@/lib/gates";
import { MOCK_PRODUCTION_SHOTS } from "@/lib/mock/production";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/use-project-store";
import { useStoryboardStore } from "@/store/use-storyboard-store";
import type { ProductionShot } from "@/types/domain";

/** 生产态覆盖（演示）：状态/一致性/置信度/缩略图（D2：不上协议） */
type ProductionOverlay = Pick<
  ProductionShot,
  "status" | "rejectReason" | "consistencyScore" | "confidence" | "thumbnailUrl"
>;

type ShotRow = ShotUI & { production: ProductionOverlay };

const DEFAULT_PRODUCTION: ProductionOverlay = {
  status: "pending",
  consistencyScore: 0,
  confidence: 0.5,
  thumbnailUrl: "",
};

export default function StoryboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const storyboard = useStoryboardStore((s) => s.storyboard);
  const validationErrors = useStoryboardStore((s) => s.validationErrors);
  const remoteWarnings = useStoryboardStore((s) => s.remoteWarnings);
  const validationSource = useStoryboardStore((s) => s.validationSource);
  const loading = useStoryboardStore((s) => s.loading);
  const isMock = useStoryboardStore((s) => s.isMock);
  const load = useStoryboardStore((s) => s.load);
  const updateShot = useStoryboardStore((s) => s.updateShot);

  const [activeTab, setActiveTab] = useState<"table" | "canvas">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [narrativeMode, setNarrativeMode] = useState<"标准" | "紧凑" | "电影感">("标准");
  const [promptDraft, setPromptDraft] = useState<string | null>(null);
  const [savingPrompt, setSavingPrompt] = useState(false);

  useEffect(() => {
    if (activeProjectId) void load(activeProjectId);
  }, [activeProjectId, load]);

  /** 行组合：协议结构（UI 全称枚举）+ 生产态覆盖层（演示，按镜头序位） */
  const rows: ShotRow[] = useMemo(() => {
    if (!storyboard) return [];
    return storyboard.shots.map((shot, i) => {
      const demo = MOCK_PRODUCTION_SHOTS[i % MOCK_PRODUCTION_SHOTS.length];
      return {
        ...toUiShot(shot),
        production: {
          status: demo.status,
          rejectReason: demo.rejectReason,
          consistencyScore: demo.consistencyScore,
          confidence: demo.confidence,
          thumbnailUrl: demo.thumbnailUrl,
        },
      };
    });
  }, [storyboard]);

  // 默认聚焦首个打回拦截镜头（原型 S01-04 演示语义），否则首个镜头
  const inspectedShot =
    (inspectedId ? rows.find((r) => r.id === inspectedId) : null) ??
    rows.find((r) => r.production.status === "rejected") ??
    rows[0] ??
    null;

  const state = resolveViewState({
    loading,
    error: null,
    itemCount: loading ? null : rows.length,
  });
  const passed = validationErrors.length === 0;

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  const handleSelectAll = () =>
    setSelectedIds(selectedIds.length === rows.length ? [] : rows.map((r) => r.id));

  const handleSavePrompt = async () => {
    if (!inspectedShot || promptDraft === null) return;
    setSavingPrompt(true);
    await updateShot(inspectedShot.id, { image_prompt: promptDraft });
    setSavingPrompt(false);
    setPromptDraft(null);
    toast({ title: "提示词已保存", description: `${inspectedShot.id} 已同步后端`, variant: "success" });
  };

  const handleCounsel = () =>
    toast({
      title: "议事厅仲裁（TODO M4）",
      description: "P04 冲突仲裁抽屉随 M4 编排对齐落地，当前为占位动作",
      variant: "warning",
    });

  return (
    <div className="space-y-4">
      {/* 顶栏：标题 + 模式切换 + 叙事节奏 + 批量生成入口 */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">分镜设计器</h1>
            <Badge variant="outline" className="font-mono text-[11px]">
              12 字段 Schema
            </Badge>
            {isMock && <Badge variant="warning">演示数据</Badge>}
            <Badge variant={validationSource === "remote" ? "secondary" : "outline"}>
              {validationSource === "remote" ? "远程引擎校验" : "本地校验"}
            </Badge>
            <Badge variant="warning" title="生产态字段（状态/一致性分/置信度）来自演示覆盖层，TODO(M4) 真实关联">
              生产态演示
            </Badge>
          </div>

          {/* 模式 Tabs */}
          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
            <TabButton active={activeTab === "table"} onClick={() => setActiveTab("table")} icon={<TableIcon className="h-3.5 w-3.5" />} label="表格模式" />
            <TabButton active={activeTab === "canvas"} onClick={() => setActiveTab("canvas")} icon={<LayoutGrid className="h-3.5 w-3.5" />} label="画布节点流" />
            <TabButton
              active={false}
              onClick={() =>
                toast({ title: "3D 导演视角（TODO M5）", description: "Storyboard3DPage 随 P2 页面铺开迁移", variant: "warning" })
              }
              icon={<Box className="h-3.5 w-3.5 text-sky-500" />}
              label="3D 导演视角"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>叙事节奏:</span>
            <div className="flex items-center rounded border bg-muted/50 p-0.5">
              {(["紧凑", "标准", "电影感"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setNarrativeMode(m)}
                  className={cn(
                    "cursor-pointer rounded px-2 py-0.5 text-[11px]",
                    narrativeMode === m ? "bg-muted font-bold text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Button size="sm" onClick={() => router.push("/production")}>
            <Layers className="h-3.5 w-3.5" />
            进入批量生成任务台
          </Button>
        </div>
      </div>

      {/* 校验结果条（远程引擎规则 + warnings） */}
      <div
        className={cn(
          "rounded-md border p-4",
          passed
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400"
        )}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : passed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {loading
            ? "分镜校验中…"
            : passed
              ? "分镜校验通过：结构完整，钩子镜头已标记"
              : `分镜校验发现 ${validationErrors.length} 个问题`}
        </div>
        {!passed && (
          <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
            {validationErrors.slice(0, 6).map((err) => (
              <li key={err}>{err}</li>
            ))}
            {validationErrors.length > 6 && <li>…共 {validationErrors.length} 条（详见协议预览）</li>}
          </ul>
        )}
        {remoteWarnings.length > 0 && (
          <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-amber-600">
            {remoteWarnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        )}
      </div>

      <ViewStateGate
        state={state}
        loadingMessage="创想·灵韵 正在构建 12 字段分镜矩阵与运镜提示词…"
        emptyTitle="当前剧本尚未生成分镜"
        emptyDescription="请先在剧本工作台提取分镜，或等待 AI 拆解完成。"
        emptyActionText="前往剧本工作台"
        onEmptyAction={() => router.push("/script")}
      >
        {/* 表格模式 */}
        {activeTab === "table" && (
          <div className="flex gap-4">
            {/* 12 列主表 */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse whitespace-nowrap text-left text-xs">
                  <thead>
                    <tr className="border-b bg-muted/60 text-muted-foreground">
                      <th className="w-10 p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === rows.length && rows.length > 0}
                          onChange={handleSelectAll}
                          className="cursor-pointer accent-primary"
                        />
                      </th>
                      <th className="p-2.5 font-semibold">镜头号</th>
                      <th className="p-2.5 font-semibold">缩略图</th>
                      <th className="p-2.5 font-semibold">景别</th>
                      <th className="p-2.5 font-semibold">运镜</th>
                      <th className="max-w-xs p-2.5 font-semibold">画面描述</th>
                      <th className="p-2.5 font-semibold">台词</th>
                      <th className="p-2.5 font-mono font-semibold">时长</th>
                      <th className="p-2.5 font-semibold">钩子</th>
                      <th className="p-2.5 font-semibold">一致性分</th>
                      <th className="p-2.5 font-semibold">置信度</th>
                      <th className="p-2.5 font-semibold">状态</th>
                      <th className="p-2.5 text-right font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((shot) => {
                      const isSelected = selectedIds.includes(shot.id);
                      const isInspected = inspectedShot?.id === shot.id;
                      const isRejected = shot.production.status === "rejected";
                      return (
                        <tr
                          key={shot.id}
                          onClick={() => {
                            setInspectedId(shot.id);
                            setPromptDraft(null);
                          }}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/60",
                            isInspected && "bg-muted/40",
                            isRejected && "bg-red-500/5"
                          )}
                        >
                          <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(shot.id)}
                              className="cursor-pointer accent-primary"
                            />
                          </td>
                          <td className="p-2.5 font-mono font-bold">{shot.id}</td>
                          <td className="p-2.5">
                            <Thumb
                              src={shot.production.thumbnailUrl}
                              label={shot.id}
                              className="h-8 w-12 rounded border object-cover"
                            />
                          </td>
                          <td className="p-2.5">
                            <Badge variant="secondary" className="font-mono text-[11px]">
                              {shot.shotSize}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-muted-foreground">{shot.cameraMove}</td>
                          <td className="max-w-[240px] truncate p-2.5">{shot.description || "（无描述）"}</td>
                          <td className="max-w-[160px] truncate p-2.5 text-muted-foreground">
                            {shot.dialogue || "（无台词）"}
                          </td>
                          <td className="p-2.5 font-mono tabular-nums text-muted-foreground">{shot.durationSec}s</td>
                          <td className="p-2.5">
                            {shot.hookFlag ? (
                              <Badge variant="warning">钩子</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={cn(
                                "font-mono text-xs font-bold",
                                shot.production.consistencyScore >= REF_CONSISTENCY_PASS
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              )}
                            >
                              {shot.production.consistencyScore}%
                            </span>
                          </td>
                          <td className="p-2.5">
                            <ConfidenceBadge confidence={shot.production.confidence} size="sm" />
                          </td>
                          <td className="p-2.5">
                            <ProductionStatusBadge status={shot.production.status} rejectReason={shot.production.rejectReason} />
                          </td>
                          <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isRejected && (
                                <Button variant="destructive" size="sm" className="h-7 px-2 text-[11px]" onClick={handleCounsel}>
                                  仲裁
                                </Button>
                              )}
                              <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                                重绘
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 右 Inspector */}
            {inspectedShot && (
              <div className="hidden w-88 shrink-0 flex-col justify-between space-y-4 rounded-xl border bg-card p-4 xl:flex">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{inspectedShot.id} 镜头详情</span>
                      <ConfidenceBadge confidence={inspectedShot.production.confidence} size="sm" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {inspectedShot.shotSize} · {inspectedShot.cameraMove}
                    </span>
                  </div>

                  {/* 预览图（含打回覆层） */}
                  <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
                    <Thumb src={inspectedShot.production.thumbnailUrl} label={inspectedShot.id} className="h-full w-full object-cover" />
                    {inspectedShot.production.status === "rejected" && (
                      <div className="absolute inset-0 flex flex-col justify-between bg-red-950/60 p-3 text-xs backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 font-bold text-red-400">
                          <AlertTriangle className="h-4 w-4" />
                          格物·宗师 质检打回
                        </div>
                        <p className="rounded bg-black/60 p-2 text-[11px] leading-snug text-white">
                          {inspectedShot.production.rejectReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prompt 编辑器（PATCH 真实生效） */}
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      运镜正向提示词（Prompt）
                    </span>
                    <Textarea
                      rows={3}
                      value={promptDraft ?? inspectedShot.prompt}
                      onChange={(e) => setPromptDraft(e.target.value)}
                      className="font-mono text-xs"
                    />
                    {promptDraft !== null && promptDraft !== inspectedShot.prompt && (
                      <Button size="sm" className="mt-2 w-full" disabled={savingPrompt} onClick={handleSavePrompt}>
                        {savingPrompt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        保存提示词（PATCH 同步后端）
                      </Button>
                    )}
                  </div>

                  {/* 一致性锚定 */}
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      一致性锚定与 Ref 约束
                    </span>
                    <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5 text-xs">
                      <div>
                        <span className="block font-semibold">{inspectedShot.consistencyAnchor || "未锚定"}</span>
                        <span className="text-[10px] text-muted-foreground">钩子标记：{inspectedShot.hookFlag ? "是" : "否"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push("/assets")}
                        className="cursor-pointer text-[10px] text-primary hover:underline"
                      >
                        调整权重 →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  {inspectedShot.production.status === "rejected" ? (
                    <Button variant="destructive" className="w-full" onClick={handleCounsel}>
                      <Shield className="h-3.5 w-3.5" />
                      发起议事厅冲突仲裁（P04 触发点）
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline">
                      重新生成单镜
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 画布节点流模式 */}
        {activeTab === "canvas" && (
          <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-xl border bg-muted/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary">横向镜头节点流（Graph Canvas）</span>
                <span className="text-xs text-muted-foreground">支持拖拽连线与批量重排</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">统一画风预设</Button>
                <Button variant="outline" size="sm">自动卡点重排</Button>
              </div>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto py-6">
              {rows.map((shot, idx) => (
                <Fragment key={shot.id}>
                  <div
                    onClick={() => {
                      setInspectedId(shot.id);
                      setPromptDraft(null);
                    }}
                    className={cn(
                      "w-52 shrink-0 cursor-pointer rounded-xl border bg-card p-3 transition-all hover:scale-[1.02]",
                      inspectedShot?.id === shot.id
                        ? "border-primary shadow-lg"
                        : shot.production.status === "rejected"
                          ? "border-red-500"
                          : "border-border"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">{shot.id}</span>
                      <ConfidenceBadge confidence={shot.production.confidence} size="sm" showValue={false} />
                    </div>
                    <div className="relative mb-2 aspect-video overflow-hidden rounded-lg bg-muted">
                      <Thumb src={shot.production.thumbnailUrl} label={shot.id} className="h-full w-full object-cover" />
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 font-mono text-[9px] text-white">
                        {shot.durationSec}s
                      </span>
                    </div>
                    <p className="mb-1 line-clamp-2 text-[11px] leading-tight">{shot.description || "（无描述）"}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{shot.shotSize}</span>
                      <span className="text-sky-500">{shot.cameraMove}</span>
                    </div>
                  </div>
                  {idx < rows.length - 1 && <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                </Fragment>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-card p-3 text-xs text-muted-foreground">
              <span>提示：按住 Shift 框选多个分镜卡片可呼出浮动批量调色与重生成工具栏</span>
              <span className="font-mono">
                Zoom: 100% · Total Duration: {rows.reduce((a, r) => a + r.durationSec, 0).toFixed(1)}s
              </span>
            </div>
          </div>
        )}
      </ViewStateGate>

      {/* 批量操作浮动条 */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={rows.length}
        onClear={() => setSelectedIds([])}
        actions={[
          {
            label: "批量生成选定镜头",
            icon: <Play className="h-3.5 w-3.5" />,
            variant: "primary",
            onClick: () => router.push("/production"),
          },
          { label: "批量重试打回项", icon: <RotateCw className="h-3.5 w-3.5" />, onClick: () => setSelectedIds([]) },
        ]}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
        active ? "bg-primary font-bold text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ProductionStatusBadge({ status, rejectReason }: { status: ProductionOverlay["status"]; rejectReason?: string }) {
  if (status === "passed") return <Badge variant="success">已通过</Badge>;
  if (status === "rejected")
    return (
      <span
        className="animate-pulse rounded bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-600"
        title={rejectReason}
      >
        打回拦截
      </span>
    );
  if (status === "generating")
    return (
      <span className="flex items-center gap-1 rounded bg-teal-500/15 px-2 py-0.5 font-mono text-[11px] text-teal-600">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-teal-500" />
        生成中
      </span>
    );
  return <Badge variant="outline">待生成</Badge>;
}
