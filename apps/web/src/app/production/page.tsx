"use client";

/**
 * 批量生成任务台（M3 · 迁移自 MiniMax-3 原型 production/BatchProductionPage）
 * 三步向导头 + 批次汇总条（单集成本 ≤ ¥2.00 北极星）+ 三泳道看板（通过/待定/打回）
 * 数据：library 域批量端点（TODO(M5) 端点缺位）→ withFallback 降级 MOCK_BATCH_ITEMS + useApiData 快照
 * 泳道阈值单源：lib/gates classifySyncNet（SYNCNET_PASS / SYNCNET_REVIEW_MIN）
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { RotateCcw, Scale } from "lucide-react";
import { withFallback } from "@/api/client";
import { listBatchItems } from "@/api/library";
import { ConfidenceBadge } from "@/components/common/confidence-badge";
import { DriveModeSwitch } from "@/components/common/drive-mode-switch";
import { ViewStateGate } from "@/components/common/states";
import { Thumb } from "@/components/common/thumb";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";
import { resolveViewState } from "@/hooks/use-view-state";
import { classifySyncNet, SYNCNET_PASS, SYNCNET_REVIEW_MIN } from "@/lib/gates";
import { MOCK_BATCH_ITEMS } from "@/lib/mock/production";
import { cn } from "@/lib/utils";
import { useDriveModeStore } from "@/store/use-drive-mode-store";
import type { BatchItem } from "@/types/domain";

type LaneTone = "emerald" | "amber" | "red";

const LANE_BORDER: Record<LaneTone, string> = {
  emerald: "border-emerald-500/25",
  amber: "border-amber-500/30",
  red: "border-red-500/30",
};
const LANE_DOT: Record<LaneTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500 animate-pulse",
  red: "bg-red-500",
};
const LANE_TEXT: Record<LaneTone, string> = {
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
};
const CARD_HOVER: Record<LaneTone, string> = {
  emerald: "hover:border-emerald-500",
  amber: "hover:border-amber-500",
  red: "hover:border-red-500",
};

/** 泳道容器 */
function Lane({
  tone,
  title,
  count,
  children,
}: {
  tone: LaneTone;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", LANE_BORDER[tone])}>
      <div className="flex items-center justify-between border-b bg-muted/60 p-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", LANE_DOT[tone])} />
          <h3 className="text-xs font-semibold">{title}</h3>
        </div>
        <span className={cn("font-mono text-xs font-bold", LANE_TEXT[tone])}>{count} 镜</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">{children}</div>
    </div>
  );
}

/** 泳道镜头卡（三泳道共用，操作区由调用方注入） */
function BatchShotCard({
  item,
  tone,
  failed,
  children,
}: {
  item: BatchItem;
  tone: LaneTone;
  failed?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("space-y-2 rounded-xl border bg-background p-3 transition-all", CARD_HOVER[tone])}>
      <div className="flex items-center justify-between">
        <span className={cn("font-mono text-xs font-bold", LANE_TEXT[tone])}>{item.shotNumber}</span>
        <ConfidenceBadge confidence={item.confidence} size="sm" />
      </div>
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <Thumb src={item.thumbnail} label={item.shotNumber} className="h-full w-full object-cover" />
        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 font-mono text-[9px] text-white">
          {item.duration}s
        </span>
        {failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/50 p-2">
            <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
              一致性低于 80% 红线
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-muted-foreground">
          SyncNet: <strong className={LANE_TEXT[tone]}>{item.syncNetScore}</strong>
        </span>
        <span className="text-muted-foreground/70">耗时 {item.renderTime}s</span>
      </div>
      {children && <div className="flex items-center gap-2 border-t pt-2">{children}</div>}
    </div>
  );
}

export default function BatchProductionPage() {
  const { toast } = useToast();
  const driveMode = useDriveModeStore((s) => s.driveMode);
  const setDriveMode = useDriveModeStore((s) => s.setDriveMode);

  const [isMock, setIsMock] = useState(false);
  const loader = useCallback(async () => {
    const { data, isMock: mock } = await withFallback(() => listBatchItems(), () => MOCK_BATCH_ITEMS);
    setIsMock(mock);
    return data;
  }, []);
  const { data, loading, error, degraded, retry } = useApiData(loader, {
    snapshotKey: "/api/v1/factory/library/batch",
  });

  // 泳道裁决为演示态本地交互（TODO(M5) 批次裁决端点落地后改为远程提交）
  const [items, setItems] = useState<BatchItem[]>([]);
  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const passedItems = useMemo(() => items.filter((i) => i.status === "passed"), [items]);
  const reviewItems = useMemo(() => items.filter((i) => i.status === "review"), [items]);
  const failedItems = useMemo(() => items.filter((i) => i.status === "failed"), [items]);
  const totalCost = useMemo(() => items.reduce((acc, cur) => acc + cur.costEstimated, 0), [items]);
  const syncNetAvg = useMemo(
    () => (items.length > 0 ? items.reduce((acc, cur) => acc + cur.syncNetScore, 0) / items.length : 0),
    [items]
  );

  const state = resolveViewState({
    loading,
    error,
    itemCount: loading || error ? null : items.length,
  });

  const handleOpenCounsel = () =>
    toast({
      title: "Agent 议事厅（TODO M4）",
      description: "多 Agent 仲裁模态随 P1 域迁移落地，当前为占位动作",
      variant: "warning",
    });

  const moveItem = (shotId: string, status: BatchItem["status"]) =>
    setItems((prev) => prev.map((i) => (i.shotId === shotId ? { ...i, status } : i)));

  /** 一键换种子重试（演示态：新种子出分 0.81 重新归类，TODO(M5) 接入真实重试入队） */
  const retryWithNewSeed = (shotId: string) =>
    setItems((prev) =>
      prev.map((i) =>
        i.shotId === shotId
          ? { ...i, status: classifySyncNet(0.81), syncNetScore: 0.81, confidence: 0.91 }
          : i
      )
    );

  return (
    <div className="space-y-4">
      {/* 页头：三步向导 + 驾驶模式 + 议事厅 */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">批量生成任务台</h1>
            <Badge variant="outline" className="font-mono text-[11px]">
              即梦 API / DGX 并行
            </Badge>
            {isMock && <Badge variant="warning">演示数据</Badge>}
            {degraded && <Badge variant="warning">离线快照</Badge>}
          </div>
          <div className="hidden items-center gap-2 font-mono text-xs lg:flex">
            <span className="text-muted-foreground">① 选分镜 (36镜)</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-muted-foreground">② 参数预设</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-bold text-primary">③ 批次看板 (运行中)</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">驾驶模式:</span>
            <DriveModeSwitch currentMode={driveMode} onChange={setDriveMode} size="sm" />
          </div>
          <button
            type="button"
            onClick={handleOpenCounsel}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/20"
          >
            <Scale className="h-3.5 w-3.5" />
            Agent 议事厅 (1 处冲突)
          </button>
        </div>
      </div>

      <ViewStateGate
        state={state}
        error={error}
        loadingMessage="DGX 双节点 vLLM 正在批量并行生成 36 个镜头…"
        emptyTitle="当前没有正在生成的批次"
        emptyDescription="异步调度队列当前为空。提交第一批分镜生成任务后，泳道看板将实时呈现。"
        emptyActionText="提交第一批生成"
        onRetry={retry}
      >
        {/* 批次汇总条（单集成本 ≤ ¥2.00 北极星） */}
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
          <div>
            <span className="block text-[11px] text-muted-foreground">批次总镜头</span>
            <span className="font-mono text-xl font-bold">
              36 <span className="text-xs font-normal text-muted-foreground">镜 (已产出 {items.length})</span>
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-muted-foreground">质检通过率</span>
            <span className="font-mono text-xl font-bold text-emerald-600">
              {items.length > 0 ? `${((passedItems.length / items.length) * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-muted-foreground">SyncNet 均分</span>
            <span className="font-mono text-xl font-bold text-sky-600">
              {items.length > 0 ? syncNetAvg.toFixed(2) : "—"}{" "}
              <span className="text-[10px] text-emerald-600">(≥{SYNCNET_PASS} 达标)</span>
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-muted-foreground">预计剩余时间</span>
            <span className="font-mono text-xl font-bold text-amber-600">01m 24s</span>
          </div>
          <div>
            <span className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>单集预估成本</span>
              <span className="text-[10px] text-primary">标杆 ≤ ¥2.00</span>
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="font-mono text-xl font-bold text-primary">¥ {totalCost.toFixed(4)}</span>
              <span className="text-[10px] text-emerald-600">（降本 99.9%）</span>
            </div>
          </div>
        </div>

        {/* 三泳道看板（阈值单源 lib/gates） */}
        <div className="grid min-h-[460px] grid-cols-1 gap-4 md:grid-cols-3">
          {/* 质检通过 */}
          <Lane tone="emerald" title={`质检通过 (评分 ≥ ${SYNCNET_PASS})`} count={passedItems.length}>
            {passedItems.map((item) => (
              <BatchShotCard key={item.shotId} item={item} tone="emerald" />
            ))}
          </Lane>

          {/* 待定复核（人工裁决） */}
          <Lane tone="amber" title={`待定复核 (${SYNCNET_REVIEW_MIN} – ${SYNCNET_PASS})`} count={reviewItems.length}>
            {reviewItems.map((item) => (
              <BatchShotCard key={item.shotId} item={item} tone="amber">
                <button
                  type="button"
                  onClick={() => moveItem(item.shotId, "passed")}
                  className="flex-1 cursor-pointer rounded bg-emerald-500/15 py-1 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-500/25"
                >
                  人工放行
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(item.shotId, "failed")}
                  className="flex-1 cursor-pointer rounded bg-red-500/15 py-1 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-500/25"
                >
                  打回重绘
                </button>
              </BatchShotCard>
            ))}
          </Lane>

          {/* 失败打回（换种子重试） */}
          <Lane tone="red" title={`失败打回 (评分 < ${SYNCNET_REVIEW_MIN})`} count={failedItems.length}>
            {failedItems.map((item) => (
              <BatchShotCard key={item.shotId} item={item} tone="red" failed>
                <button
                  type="button"
                  onClick={() => retryWithNewSeed(item.shotId)}
                  className="flex w-full cursor-pointer items-center justify-center gap-1 rounded bg-primary py-1 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <RotateCcw className="h-3 w-3" />
                  一键换种子重试 (Seed +1)
                </button>
                <button
                  type="button"
                  onClick={handleOpenCounsel}
                  className="shrink-0 cursor-pointer text-[10px] text-amber-600 hover:underline"
                >
                  议事厅仲裁 →
                </button>
              </BatchShotCard>
            ))}
          </Lane>
        </div>
      </ViewStateGate>
    </div>
  );
}
