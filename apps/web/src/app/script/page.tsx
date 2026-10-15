"use client";

/**
 * 剧本工作台（M3 · 迁移自 MiniMax-3 原型 production/ScriptListPage）
 * 剧本库列表 + 题材筛选 + 搜索 + 结构化预览抽屉 + 批量操作
 * 数据：library 域（TODO(M5) 端点缺位）→ withFallback 降级 MOCK_SCRIPTS
 *       + useApiData 快照降级；五态由真实响应驱动（M2 五态体系全量消费首站）
 */
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Layers, Network, Plus, Search } from "lucide-react";
import { withFallback } from "@/api/client";
import { listScripts } from "@/api/library";
import { useApiData } from "@/hooks/use-api-data";
import { resolveViewState } from "@/hooks/use-view-state";
import { BatchActionBar } from "@/components/common/batch-action-bar";
import { GateBadge } from "@/components/common/gate-badge";
import { ViewStateGate } from "@/components/common/states";
import { Thumb } from "@/components/common/thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GATE_CURRENT_ID } from "@/lib/gates";
import { MOCK_SCRIPTS } from "@/lib/mock/production";
import { cn } from "@/lib/utils";

const GENRES = ["全部", "都市", "古风", "悬疑", "甜宠", "科幻"] as const;
const SNAPSHOT_KEY = "/api/v1/factory/library/scripts";

export default function ScriptListPage() {
  const router = useRouter();
  const [isMock, setIsMock] = useState(false);
  const loader = useCallback(async () => {
    const { data, isMock: mock } = await withFallback(() => listScripts(), () => MOCK_SCRIPTS);
    setIsMock(mock);
    return data;
  }, []);
  const { data, loading, error, degraded, retry } = useApiData(loader, { snapshotKey: SNAPSHOT_KEY });

  const scripts = useMemo(() => data ?? [], [data]);
  const [selectedGenre, setSelectedGenre] = useState<string>("全部");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const previewScript = (previewId ? scripts.find((s) => s.id === previewId) : scripts[0]) ?? null;

  const filteredScripts = scripts.filter((s) => {
    const matchesGenre = selectedGenre === "全部" || s.genre === selectedGenre;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(q) ||
      s.synopsis.toLowerCase().includes(q) ||
      s.characters.some((c) => c.name.toLowerCase().includes(q));
    return matchesGenre && matchesSearch;
  });

  const state = resolveViewState({
    loading,
    error,
    itemCount: loading || error ? null : scripts.length,
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };
  const handleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === filteredScripts.length ? [] : filteredScripts.map((s) => s.id)
    );
  };

  return (
    <div>
      {/* 页头：标题 + 协同 Agent 标签 + 操作 */}
      <div className="mb-5 flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">剧本工作台</h1>
            <Badge variant="outline" className="font-mono text-[11px]">
              Notion Database Mode
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>协同 Agent:</span>
              <span className="font-semibold text-primary">元启·天枢</span>
              <span>+</span>
              <span className="font-semibold text-orange-500">创想·灵韵</span>
            </div>
            {isMock && <Badge variant="warning">演示数据</Badge>}
            {degraded && <Badge variant="warning">离线快照</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            支持 20 万字小说长文本上传，自动解构为场次、角色表、场景表并构建知识图谱
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => router.push("/project")}>
            <Network className="h-3.5 w-3.5" />
            批量提取世界观
          </Button>
          <Button size="sm" onClick={() => router.push("/script/new")}>
            <Plus className="h-3.5 w-3.5" />
            新建剧本
          </Button>
        </div>
      </div>

      <ViewStateGate
        state={state}
        error={error}
        loadingMessage="正在解析剧本文档结构与世界观实体…"
        emptyTitle="还没有剧本，上传或让 AI 写一个"
        emptyDescription="当前剧本库中尚无任何剧本文档。支持 20 万字小说长文本上传，AI 自动解构为结构化剧本。"
        emptyActionText="新建剧本"
        onEmptyAction={() => router.push("/script/new")}
        onRetry={retry}
      >
        {/* 工具栏：搜索 + 题材 Chips */}
        <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索剧本名称、角色、简介…"
              className="h-8 pl-9 text-xs"
            />
          </div>
          <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto">
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-all",
                  selectedGenre === genre
                    ? "bg-primary font-bold text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* 主区：表格 + 右侧结构化预览抽屉 */}
        <div className="flex gap-5">
          {/* 左：剧本表格 */}
          <div className="flex-1 overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/60 text-muted-foreground">
                    <th className="w-10 p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredScripts.length && filteredScripts.length > 0}
                        onChange={handleSelectAll}
                        className="cursor-pointer accent-primary"
                      />
                    </th>
                    <th className="p-3 font-semibold">剧名</th>
                    <th className="p-3 font-semibold">题材</th>
                    <th className="p-3 font-mono font-semibold">字数</th>
                    <th className="p-3 font-semibold">角色/场景</th>
                    <th className="p-3 font-semibold">图谱完备度</th>
                    <th className="p-3 font-semibold">门禁阶段</th>
                    <th className="p-3 font-semibold">最近编辑</th>
                    <th className="p-3 text-right font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredScripts.map((script) => {
                    const isSelected = selectedIds.includes(script.id);
                    const isPreview = previewScript?.id === script.id;
                    return (
                      <tr
                        key={script.id}
                        onClick={() => setPreviewId(script.id)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/60",
                          isPreview && "bg-muted/40"
                        )}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(script.id)}
                            className="cursor-pointer accent-primary"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <Thumb
                              src={script.characters[0]?.avatar}
                              label={script.title}
                              className="h-8 w-8 shrink-0 rounded-lg border object-cover"
                            />
                            <div>
                              <span className="block font-semibold transition-colors hover:text-primary">
                                {script.title}
                              </span>
                              <span className="block max-w-[200px] truncate text-[10px] text-muted-foreground">
                                {script.synopsis}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="font-mono text-[11px]">
                            {script.genre}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono tabular-nums text-muted-foreground">
                          {(script.wordCount / 10000).toFixed(1)} 万字
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {script.characterCount} 角色 / {script.sceneCount} 场景
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-sky-500"
                                style={{ width: `${script.loreCompleteness}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-sky-500">
                              {script.loreCompleteness}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <GateBadge level={script.gateLevel} active={script.gateLevel === GATE_CURRENT_ID} />
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">{script.lastEdited}</td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => router.push(`/script/${script.id}`)}
                            >
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => router.push("/storyboard")}
                            >
                              转分镜
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredScripts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground">
                        无匹配剧本——调整题材筛选或搜索关键词
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 右：结构化实体预览抽屉（320px） */}
          {previewScript && (
            <div className="hidden w-80 shrink-0 flex-col justify-between space-y-4 rounded-xl border bg-card p-4 xl:flex">
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b pb-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-primary">结构化剧本预览</span>
                    <h3 className="text-sm font-semibold">{previewScript.title}</h3>
                  </div>
                  <GateBadge level={previewScript.gateLevel} />
                </div>

                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    剧目梗概
                  </span>
                  <p className="rounded-lg border bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">
                    {previewScript.synopsis}
                  </p>
                </div>

                {/* 角色表 */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      提取角色表 ({previewScript.characters.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push("/assets")}
                      className="cursor-pointer text-[10px] text-primary hover:underline"
                    >
                      查看资产库
                    </button>
                  </div>
                  <div className="space-y-2">
                    {previewScript.characters.map((char) => (
                      <div
                        key={char.name}
                        className="flex items-center justify-between rounded-lg border bg-muted/40 p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Thumb
                            src={char.avatar}
                            label={char.name}
                            className="h-7 w-7 rounded-full border object-cover"
                          />
                          <div>
                            <span className="block text-xs font-semibold">{char.name}</span>
                            <span className="block max-w-[140px] truncate text-[10px] text-muted-foreground">
                              {char.roleDesc}
                            </span>
                          </div>
                        </div>
                        {char.refTrained ? (
                          <Badge variant="warning" className="font-mono text-[9px]">
                            Ref 已绑定
                          </Badge>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">待训练</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 场景表 */}
                <div>
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    主要场景表 ({previewScript.scenes.length})
                  </span>
                  <div className="space-y-1.5">
                    {previewScript.scenes.map((sc) => (
                      <div
                        key={sc.name}
                        className="flex items-center justify-between rounded-lg border bg-muted/40 p-2 text-xs"
                      >
                        <span>{sc.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{sc.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <Button className="w-full" onClick={() => router.push("/storyboard")}>
                  一键转分镜设计器
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </ViewStateGate>

      {/* 批量操作浮动条 */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredScripts.length}
        onClear={() => setSelectedIds([])}
        actions={[
          {
            label: "批量转分镜",
            icon: <Layers className="h-3.5 w-3.5" />,
            variant: "primary",
            onClick: () => router.push("/storyboard"),
          },
          {
            label: "批量提取世界观图谱",
            icon: <Network className="h-3.5 w-3.5" />,
            onClick: () => router.push("/project"),
          },
          { label: "归档剧目", variant: "secondary", onClick: () => setSelectedIds([]) },
        ]}
      />
    </div>
  );
}
