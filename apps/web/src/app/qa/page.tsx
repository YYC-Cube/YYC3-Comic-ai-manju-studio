"use client";

/**
 * 质检门禁看板（M3 · 迁移自 MiniMax-3 原型 production/QualityAssurancePage，新路由 /qa）
 * 打回问题镜头列表 + 生成画面 vs 角色 RefCard 并排裁决面板
 * 红线常量单源：lib/gates（REF_CONSISTENCY_PASS / SYNCNET_PASS）
 * 数据：资产域 listAssets（TODO(M5) 端点缺位 → MOCK_ASSETS 降级 + useApiData 快照）；
 *       问题镜头为生产态演示覆盖层（MOCK_PRODUCTION_SHOTS  rejected 样本，TODO(M5) 接入真实质检评估）
 */
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Inbox, Scale } from "lucide-react";
import { withFallback } from "@/api/client";
import { listAssets } from "@/api/library";
import { ConfidenceBadge } from "@/components/common/confidence-badge";
import { ViewStateGate } from "@/components/common/states";
import { Thumb } from "@/components/common/thumb";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";
import { resolveViewState } from "@/hooks/use-view-state";
import { REF_CONSISTENCY_PASS, SYNCNET_PASS } from "@/lib/gates";
import { MOCK_ASSETS, MOCK_PRODUCTION_SHOTS } from "@/lib/mock/production";

export default function QualityAssurancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [inboxChecked, setInboxChecked] = useState(true);

  const [isMock, setIsMock] = useState(false);
  const loader = useCallback(async () => {
    const { data, isMock: mock } = await withFallback(() => listAssets(), () => MOCK_ASSETS);
    setIsMock(mock);
    return data;
  }, []);
  const { data, loading, error, degraded, retry } = useApiData(loader, {
    snapshotKey: "/api/v1/factory/library/assets",
  });

  // 生产态演示覆盖层：取 rejected 样本（S01-04 身份漂移）；RefCard 基准按其资产绑定派生
  const problemShot = useMemo(
    () => MOCK_PRODUCTION_SHOTS.find((s) => s.status === "rejected") ?? null,
    []
  );
  const refCard = useMemo(() => {
    const assets = data ?? [];
    return problemShot ? assets.find((a) => a.id === problemShot.assetBinding) ?? null : null;
  }, [data, problemShot]);

  const state = resolveViewState({
    loading,
    error,
    itemCount: loading || error ? null : problemShot ? 1 : 0,
  });

  const handleOpenCounsel = () =>
    toast({
      title: "Agent 议事厅（TODO M4）",
      description: "多 Agent 仲裁模态随 P1 域迁移落地，当前为占位动作",
      variant: "warning",
    });

  const handleRegenerate = () =>
    toast({
      title: "打回重生成（TODO M5）",
      description: "质检裁决回写与重生成入队端点落地后接通，当前跳转批量生成任务台",
      variant: "success",
    });

  return (
    <div className="space-y-4">
      {/* 页头：红线声明 + 议事厅入口 */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-semibold">质检门禁看板 (Quality Assurance Gate)</h1>
            <Badge variant="outline" className="border-red-500/40 font-mono text-[11px] font-bold text-red-600">
              工业红线：&lt;{REF_CONSISTENCY_PASS} 一律打回
            </Badge>
            {isMock && <Badge variant="warning">演示数据</Badge>}
            {degraded && <Badge variant="warning">离线快照</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            格物·宗师 严控产线质量 · 复检 ≤2 轮红线预警 · 全操作可追溯
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCounsel}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/20"
        >
          <Scale className="h-3.5 w-3.5" />
          进入多 Agent 议事厅
        </button>
      </div>

      <ViewStateGate
        state={state}
        error={error}
        loadingMessage="格物·宗师 正在执行严格多模态质检与唇形对齐…"
        emptyTitle="本批次全镜直通！"
        emptyDescription={`所有镜头的一致性评分均 ≥ ${REF_CONSISTENCY_PASS}%，SyncNet ≥ ${SYNCNET_PASS}，无物理与画风畸变，可直接交付成片。`}
        emptyActionText="前往多轨时间线剪辑"
        onEmptyAction={() => router.push("/video")}
        onRetry={retry}
      >
        {/* 批次质检指标（演示聚合，TODO(M5) 接入真实评估端点） */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border bg-card p-3.5">
            <span className="block text-xs text-muted-foreground">本批次通过率</span>
            <span className="font-mono text-2xl font-bold text-emerald-600">94.4%</span>
            <span className="mt-1 block text-[10px] text-muted-foreground/70">34/36 镜一次通过</span>
          </div>
          <div className="rounded-xl border border-red-500/25 bg-card p-3.5">
            <span className="block text-xs text-red-600">待裁决问题镜头</span>
            <span className="font-mono text-2xl font-bold text-red-600">1</span>
            <span className="mt-1 block text-[10px] text-muted-foreground">S01-04 身份漂移</span>
          </div>
          <div className="rounded-xl border bg-card p-3.5">
            <span className="block text-xs text-muted-foreground">复检轮次分布</span>
            <span className="font-mono text-2xl font-bold text-sky-600">第 1 轮</span>
            <span className="mt-1 block text-[10px] text-emerald-600">符合 ≤2 轮红线</span>
          </div>
          <div className="rounded-xl border bg-card p-3.5">
            <span className="block text-xs text-muted-foreground">人工终审介入</span>
            <span className="font-mono text-2xl font-bold text-amber-600">1 次</span>
            <span className="mt-1 block text-[10px] text-muted-foreground/70">干预率 2.7% (持续走低)</span>
          </div>
        </div>

        {/* 主区：左问题镜头列表 + 右并排裁决面板 */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* 打回问题镜头列表 */}
          <div className="w-full space-y-3 rounded-xl border border-red-500/25 bg-card p-4 lg:w-1/2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                打回问题镜头列表
              </span>
              <span className="font-mono text-[11px] text-red-600">1 项待人工裁决</span>
            </div>

            {problemShot && (
              <div className="cursor-pointer space-y-2 rounded-xl border-2 border-red-500 bg-background p-3.5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold">
                    {problemShot.shotNumber} 苏清月阻拦特写
                  </span>
                  <ConfidenceBadge confidence={problemShot.confidence} size="sm" />
                </div>
                <div className="flex gap-3">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-red-500/30 bg-muted">
                    <Thumb
                      src={problemShot.thumbnailUrl}
                      label={problemShot.shotNumber}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-red-600">
                      扣分项: 面部相似度 {problemShot.consistencyScore}% (低于 {REF_CONSISTENCY_PASS}% 阈值)
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      AI 诊断：眼神呈现过度柔弱，缺失“冷面女总裁”核心威仪，且礼服反光与场景灯光产生 14% 偏色。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 并排视觉裁决面板 */}
          {problemShot && (
            <div className="flex w-full flex-col justify-between space-y-4 rounded-xl border bg-card p-4 lg:w-1/2">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <span className="text-xs font-semibold">{problemShot.shotNumber} 视觉对比裁决面板</span>
                    <span className="block text-[10px] text-muted-foreground">
                      生成图 vs 角色 RefCard 并排比对
                    </span>
                  </div>
                  <ConfidenceBadge confidence={problemShot.confidence} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="mb-1 block font-mono text-[11px] text-red-600">
                      当前生成画面 (相似度 {problemShot.consistencyScore}%)
                    </span>
                    <div className="aspect-square overflow-hidden rounded-lg border-2 border-red-500 bg-muted">
                      <Thumb src={problemShot.thumbnailUrl} label="生成画面" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block font-mono text-[11px] text-primary">
                      苏清月 RefCard (标准基准 100%)
                    </span>
                    <div className="aspect-square overflow-hidden rounded-lg border-2 border-primary bg-muted">
                      <Thumb
                        src={refCard?.previewUrl ?? problemShot.thumbnailUrl}
                        label="RefCard"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* 宗师裁决建议 */}
                <div className="space-y-1 rounded-lg border border-primary/20 bg-muted/40 p-3 text-xs">
                  <span className="block font-bold text-primary">格物·宗师 裁决建议:</span>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    建议提权 LoRA Ref 权重至 0.82，锁定眼神高光形态，进行单帧局域重绘（预计耗时 12s）。
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={inboxChecked}
                    onChange={(e) => setInboxChecked(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-input accent-primary"
                  />
                  <Inbox className="h-3.5 w-3.5 text-purple-500" />
                  裁决结果同步归档至 Learning Inbox 作为少样本参考
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <button
                  type="button"
                  onClick={handleOpenCounsel}
                  className="flex-1 cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/20"
                >
                  发起议事厅争辩
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRegenerate();
                    router.push("/production");
                  }}
                  className="flex-1 cursor-pointer rounded-lg bg-red-600 py-2 text-xs font-bold text-white shadow-lg transition-colors hover:bg-red-700"
                >
                  打回立即重生成
                </button>
              </div>
            </div>
          )}
        </div>
      </ViewStateGate>
    </div>
  );
}
