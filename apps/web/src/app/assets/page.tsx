"use client";

/**
 * 影视级资产中心（M3 · 迁移自 MiniMax-3 原型 production/AssetsPage）
 * 类型分栏 + 资产卡网格 + 右 Inspector（双形态契约 / 反向引用）
 * 数据：library 域（TODO(M5) 端点缺位）→ withFallback 降级 MOCK_ASSETS + useApiData 快照
 */
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, ExternalLink, Plus, Search, ShieldCheck } from "lucide-react";
import { withFallback } from "@/api/client";
import { listAssets } from "@/api/library";
import { useApiData } from "@/hooks/use-api-data";
import { resolveViewState } from "@/hooks/use-view-state";
import { ViewStateGate } from "@/components/common/states";
import { Thumb } from "@/components/common/thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { MOCK_ASSETS } from "@/lib/mock/production";
import { cn } from "@/lib/utils";
import type { AssetItem } from "@/types/domain";

const TYPE_LABELS: Record<AssetItem["type"], string> = {
  character: "角色资产",
  scene: "场景资产",
  prop: "道具法宝",
  style: "画风预设",
  template: "品牌模板",
};

export default function AssetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isMock, setIsMock] = useState(false);
  const loader = useCallback(async () => {
    const { data, isMock: mock } = await withFallback(() => listAssets(), () => MOCK_ASSETS);
    setIsMock(mock);
    return data;
  }, []);
  const { data, loading, error, degraded, retry } = useApiData(loader, {
    snapshotKey: "/api/v1/factory/library/assets",
  });

  const assets = useMemo(() => data ?? [], [data]);
  const [selectedType, setSelectedType] = useState<AssetItem["type"]>("character");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const inspectedAsset = (inspectedId ? assets.find((a) => a.id === inspectedId) : assets[0]) ?? null;

  const assetTypes = useMemo(
    () =>
      (Object.keys(TYPE_LABELS) as AssetItem["type"][]).map((t) => ({
        id: t,
        label: TYPE_LABELS[t],
        count: assets.filter((a) => a.type === t).length,
      })),
    [assets]
  );

  const filtered = assets.filter((a) => {
    const matchesType = a.type === selectedType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q || a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  const state = resolveViewState({
    loading,
    error,
    itemCount: loading || error ? null : assets.length,
  });

  const handleConsistencyCenter = () =>
    toast({
      title: "一致性训练中心（TODO M4）",
      description: "ConsistencyTrainingPage 随 P1 域迁移落地，当前为占位动作",
      variant: "warning",
    });

  return (
    <div className="space-y-4">
      {/* 页头 */}
      <div className="flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">影视级资产中心</h1>
            <Badge variant="outline" className="font-mono text-[11px]">
              Pixmax 对标 · 跨剧目复用
            </Badge>
            {isMock && <Badge variant="warning">演示数据</Badge>}
            {degraded && <Badge variant="warning">离线快照</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            定妆照 → 角色板 → 多视图 → LoRA 资产包全演化链路
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleConsistencyCenter}>
            <ShieldCheck className="h-3.5 w-3.5" />
            进入一致性训练中心
          </Button>
          <Button size="sm" onClick={handleConsistencyCenter}>
            <Plus className="h-3.5 w-3.5" />
            新建资产
          </Button>
        </div>
      </div>

      {/* 品牌资产横幅 */}
      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-purple-500/10 p-3.5 text-xs">
        <div className="flex items-center gap-2.5">
          <Crown className="h-4 w-4 text-amber-500" />
          <div>
            <span className="font-semibold">企业品牌专属资产专区已激活</span>
            <span className="ml-2 text-muted-foreground">
              标准片头片尾 · 官方 Logo 水印 · 品牌级调色 LUT 自动注入
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleConsistencyCenter}
          className="cursor-pointer font-mono text-[10px] text-primary hover:underline"
        >
          管理品牌配置 →
        </button>
      </div>

      <ViewStateGate
        state={state}
        error={error}
        loadingMessage="加载影视级高维资产特征与 LoRA 权重…"
        emptyTitle="资产库暂无资产"
        emptyDescription="当前资产中心无任何角色、场景或道具资产。上传第一批角色定妆照启动一致性训练。"
        emptyActionText="上传第一批角色定妆照"
        onEmptyAction={handleConsistencyCenter}
        onRetry={retry}
      >
        {/* 工具栏：搜索 + 类型分栏 */}
        <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="语法检索，如「标签:修真 状态:已训练」…"
              className="h-8 pl-9 text-xs"
            />
          </div>
          <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto">
            {assetTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={cn(
                  "cursor-pointer whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all",
                  selectedType === t.id
                    ? "bg-primary font-bold text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                <span className="ml-1 font-mono text-[10px] opacity-80">({t.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 主区：资产卡网格 + 右 Inspector */}
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setInspectedId(asset.id)}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-xl border bg-card transition-all",
                  inspectedAsset?.id === asset.id
                    ? "border-primary shadow-lg"
                    : "hover:border-primary/40"
                )}
              >
                {asset.refCard && (
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded border border-amber-500 bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-amber-500 shadow-md">
                    <ShieldCheck className="h-3 w-3" />
                    Ref 保持
                  </div>
                )}
                <div className={cn("overflow-hidden bg-muted", asset.type === "character" ? "aspect-[3/4]" : "aspect-video")}>
                  <Thumb
                    src={asset.previewUrl}
                    alt={asset.name}
                    label={asset.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="truncate text-xs font-semibold transition-colors group-hover:text-primary">
                      {asset.name}
                    </h4>
                    <span className="font-mono text-[10px] text-muted-foreground">{asset.version}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag) => (
                      <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 font-mono text-[11px]">
                    <span className="text-muted-foreground">调用 {asset.usageCount} 次</span>
                    <span className="font-bold text-emerald-600">一致性 {asset.consistencyScore}%</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                该类型下无匹配资产——调整类型或搜索关键词
              </p>
            )}
          </div>

          {/* 右 Inspector */}
          {inspectedAsset && (
            <div className="flex w-full flex-col justify-between space-y-4 rounded-xl border bg-card p-4 lg:w-96 lg:shrink-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-primary">
                      {inspectedAsset.evolutionStage}
                    </span>
                    <h3 className="text-sm font-semibold">{inspectedAsset.name}</h3>
                  </div>
                  <span className="font-mono text-xs text-emerald-600">{inspectedAsset.consistencyScore}%</span>
                </div>

                <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                  <Thumb src={inspectedAsset.previewUrl} label={inspectedAsset.name} className="h-full w-full object-cover" />
                </div>

                {/* 双形态契约 */}
                {inspectedAsset.dualFormContract && (
                  <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <span className="block text-[11px] font-semibold text-amber-600">
                      双形态契约（Dual-Form Contract）
                    </span>
                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      <div>
                        <strong className="text-foreground">主形态:</strong> {inspectedAsset.dualFormContract.mainForm}
                      </div>
                      <div>
                        <strong className="text-primary">切换形态:</strong> {inspectedAsset.dualFormContract.altForm}
                      </div>
                    </div>
                  </div>
                )}

                {/* 反向引用 */}
                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    反向引用（已绑定 {inspectedAsset.usageCount > 100 ? 4 : 2} 个剧目分镜）
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {["S01-01", "S01-03"].map((shotNo) => (
                      <div
                        key={shotNo}
                        onClick={() => router.push("/storyboard")}
                        className="flex cursor-pointer items-center justify-between rounded border bg-muted/40 p-2 hover:border-primary"
                      >
                        <span>《凌霄剑仙》{shotNo}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <Button className="w-full" onClick={handleConsistencyCenter}>
                  <ShieldCheck className="h-4 w-4" />
                  进入一致性训练调优
                </Button>
              </div>
            </div>
          )}
        </div>
      </ViewStateGate>
    </div>
  );
}
