"use client";

/**
 * 项目剧集中心页（M5-P2 · 迁移自 MiniMax-3 原型 management/ProjectSeriesPage）
 * 真链路：看板列分布端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/management.ts）；
 *         「新建漫剧项目」→ /script 真路由；剧目卡 → /storyboard 真路由；
 *         原型三视图（看板/表格/甘特）仅看板有实现——表格/甘特迁入为显式空态，不伪造
 * 布局：头部（徽章 + 视图切换 + 新建入口）→ 五列阶段看板（剧本→分镜→批量→剪辑→发布）
 */
import { useState } from "react";
import Link from "next/link";
import { Calendar, Kanban, Plus, Table as TableIcon } from "lucide-react";
import { withFallback } from "@/api/client";
import { listSeries } from "@/api/management";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useApiData } from "@/hooks/use-api-data";
import { cn } from "@/lib/utils";

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  cards: { title: string; lastEdited: string; progress: string; readiness: string[] }[];
}

/** 演示看板（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_COLUMNS: KanbanColumn[] = [
  {
    id: "script",
    name: "剧本立项",
    color: "#00e0b8",
    cards: [
      { title: "《星河赘婿》", lastEdited: "2 小时前", progress: "1/12 集", readiness: ["剧本⚙", "分镜○", "成片○", "发布○"] },
    ],
  },
  {
    id: "storyboard",
    name: "分镜设计",
    color: "#00B4D8",
    cards: [
      { title: "《雨夜霓虹》", lastEdited: "26 分钟前", progress: "2/12 集", readiness: ["剧本✓", "分镜⚙", "成片○", "发布○"] },
    ],
  },
  {
    id: "production",
    name: "批量生成",
    color: "#FFB020",
    cards: [
      { title: "《凌霄剑仙》", lastEdited: "昨天 22:14", progress: "5/24 集", readiness: ["剧本✓", "分镜✓", "成片⚙", "发布○"] },
    ],
  },
  {
    id: "editing",
    name: "剪辑成片",
    color: "#9d7cd8",
    cards: [
      { title: "《凌霄剑仙》E03", lastEdited: "昨天 18:40", progress: "3/24 集", readiness: ["剧本✓", "分镜✓", "成片⚙", "发布○"] },
    ],
  },
  {
    id: "published",
    name: "全网发布",
    color: "#22C55E",
    cards: [
      { title: "《凌霄剑仙》E01", lastEdited: "3 天前", progress: "已发布", readiness: ["剧本✓", "分镜✓", "成片✓", "发布✓"] },
      { title: "《凌霄剑仙》E02", lastEdited: "2 天前", progress: "已发布", readiness: ["剧本✓", "分镜✓", "成片✓", "发布✓"] },
    ],
  },
];

type ViewMode = "kanban" | "table" | "timeline";
const VIEW_MODES: { id: ViewMode; label: string; icon: typeof Kanban }[] = [
  { id: "kanban", label: "看板", icon: Kanban },
  { id: "table", label: "表格", icon: TableIcon },
  { id: "timeline", label: "甘特", icon: Calendar },
];

export default function ProjectSeriesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  // 端点缺位：看板列分布为演示数据（Badge 留痕）
  const { data } = useApiData(() => withFallback(listSeries, () => []), {
    snapshotKey: "series-list:v1",
  });
  const isMock = data?.isMock ?? true;

  return (
    <div>
      <PageHeader
        title="项目剧集中心（Series Center）"
        description="全链路六阶段工期跟踪 · 集数产物齐备度 · 延期自动预警"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            Linear 敏捷视图对标
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 剧集端点待接入
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
            {VIEW_MODES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewMode(v.id)}
                className={`flex cursor-pointer items-center gap-1.5 rounded px-3 py-1 ${
                  viewMode === v.id
                    ? "bg-sky-400 font-bold text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <v.icon className="h-3.5 w-3.5" />
                <span>{v.label}</span>
              </button>
            ))}
          </div>
          <Link href="/script" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-3.5 w-3.5" />
            新建漫剧项目
          </Link>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-5">
          {DEMO_COLUMNS.map((col) => (
            <div
              key={col.id}
              className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border bg-secondary p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <h3 className="font-bold">{col.name}</h3>
                </div>
                <span className="font-mono text-muted-foreground">（{col.cards.length}）</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {col.cards.map((card) => (
                  <Link
                    key={card.title}
                    href="/storyboard"
                    className="group block space-y-2 rounded-xl border border-primary/10 bg-background p-3.5 transition-all hover:border-primary"
                  >
                    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-secondary">
                      <span className="font-mono text-xs text-muted-foreground/60">
                        {card.title.slice(1, 3)}
                      </span>
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 font-mono text-[9px] text-primary">
                        进度：{card.progress}
                      </span>
                    </div>

                    <div>
                      <h4 className="truncate text-xs font-bold transition-colors group-hover:text-primary">
                        {card.title}
                      </h4>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        最近活跃：{card.lastEdited}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-2 font-mono text-[10px]">
                      <div className="flex items-center gap-1.5">
                        {card.readiness.map((r) => (
                          <span
                            key={r}
                            className={
                              r.endsWith("✓")
                                ? "text-emerald-500"
                                : r.endsWith("⚙")
                                  ? "text-primary"
                                  : "text-muted-foreground/50"
                            }
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 表格/甘特：原型无实现，显式空态不伪造 */
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
          <span className="text-sm font-bold">
            「{VIEW_MODES.find((v) => v.id === viewMode)?.label}」视图待接入
          </span>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            该视图随剧集中心端点批次落地（多维表格 / 六阶段甘特排期）。
          </p>
        </div>
      )}
    </div>
  );
}
