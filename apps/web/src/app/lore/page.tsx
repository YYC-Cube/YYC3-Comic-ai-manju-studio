"use client";

/**
 * 世界观与知识图谱页（M5-P2 · 迁移自 MiniMax-3 原型 management/ProjectLorePage）
 * 真链路：图谱实体端点缺位——节点/边/冲突告警为演示数据 + Badge 留痕（端点形状见 api/management.ts）；
 *         「AI 从剧本提取图谱」端点缺位——toast 占位 + TODO；
 *         实体点击切换为视图状态；「定位分镜修复」「在资产中心编辑」→ 真实路由；
 *         原型三布局（力导向/时间轴/层级树）仅力导向有实现——其余显式空态，不伪造
 * 布局：头部（徽章 + 布局切换 + AI 提取）→ 冲突告警条 → 左力导向图画布 → 右实体检视器
 */
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { withFallback } from "@/api/client";
import { listLoreEntries } from "@/api/management";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";

interface LoreNode {
  id: string;
  name: string;
  ref: string;
  color: string;
  x: number;
  y: number;
}

/** 演示图谱（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_NODES: LoreNode[] = [
  { id: "n1", name: "叶凌霄", ref: "Ref 94%", color: "#00e0b8", x: 260, y: 160 },
  { id: "n2", name: "苏清月", ref: "Ref 88%", color: "#FF69B4", x: 420, y: 130 },
  { id: "n3", name: "陈浩天", ref: "Ref 89%", color: "#FFD700", x: 280, y: 310 },
  { id: "n4", name: "冰魄飞剑", ref: "Ref 96%", color: "#00B4D8", x: 120, y: 220 },
  { id: "n5", name: "苏家酒会大厅", ref: "一致性 92%", color: "#9d7cd8", x: 460, y: 280 },
];

const DEMO_EDGES = [
  { x1: 260, y1: 160, x2: 420, y2: 130, stroke: "#00e0b8", dash: true, width: 1.5, opacity: 0.6 },
  { x1: 260, y1: 160, x2: 280, y2: 310, stroke: "#ff4422", dash: false, width: 2, opacity: 0.8 },
  { x1: 260, y1: 160, x2: 120, y2: 220, stroke: "#00B4D8", dash: false, width: 2, opacity: 0.9 },
  { x1: 420, y1: 130, x2: 460, y2: 280, stroke: "#9d7cd8", dash: false, width: 1.5, opacity: 0.7 },
];

const DEMO_LORE_BIBLE =
  "万古剑尊重生现代，外表冷峻寡言，无论聚光灯何种角度，瞳孔均映射淡青冰魄寒光，右手戴墨玉戒。";

const DEMO_APPEARANCES = [
  { shot: "S01-01 叶凌霄特写", status: "通过" },
  { shot: "S01-03 冰魄飞剑水箭", status: "通过" },
];

type LayoutMode = "force" | "timeline" | "hierarchy";
const LAYOUTS: { id: LayoutMode; label: string }[] = [
  { id: "force", label: "力导向图" },
  { id: "timeline", label: "时间轴" },
  { id: "hierarchy", label: "层级树" },
];

export default function ProjectLorePage() {
  const { toast } = useToast();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("force");
  const [selectedEntity, setSelectedEntity] = useState("叶凌霄");

  // 端点缺位：图谱数据为演示（Badge 留痕）
  const { data } = useApiData(() => withFallback(listLoreEntries, () => []), {
    snapshotKey: "lore-entries:v1",
  });
  const isMock = data?.isMock ?? true;

  return (
    <div>
      <PageHeader
        title="世界观与知识图谱（Worldview Lore）"
        description="力导向拓扑关系 · 角色/场景/法宝实体反向引用 · 剧本设定逻辑冲突自动检测"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            World Anvil 对标
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 图谱端点待接入
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 font-mono text-xs">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLayoutMode(l.id)}
                className={`cursor-pointer rounded px-3 py-1 ${
                  layoutMode === l.id
                    ? "bg-sky-400 font-bold text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() =>
              // TODO：图谱抽取端点缺位
              toast({
                title: "图谱抽取端点待接入",
                description: "语枢·万物实体三元组抽取随图谱域批次落地",
                variant: "warning",
              })
            }
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 从剧本提取图谱
          </Button>
        </div>
      </div>

      {/* 冲突告警条（演示数据，Badge 留痕） */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs animate-in fade-in">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>世界观逻辑冲突检测：</strong>检测到 1 处潜在矛盾（第 1 场叶凌霄设定为「隐匿修为不发」，但在 S01-05 画面描述中出现了大范围法术外溢）。
          </span>
        </div>
        <Link href="/storyboard" className="shrink-0 font-mono text-[11px] text-primary hover:underline">
          定位分镜修复 →
        </Link>
      </div>

      {layoutMode === "force" ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* 左 · 力导向画布 */}
          <div className="relative h-[500px] min-w-0 flex-1 overflow-x-auto rounded-xl border border-primary/20 bg-background lg:overflow-hidden">
            <div className="relative flex h-full w-[560px] flex-col justify-between p-4 lg:w-full">
              <div className="z-10 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-primary">Force Simulation Active（5 Nodes, 7 Edges）</span>
                <span className="font-mono">Zoom：100% · Physics：Repulsion 400</span>
              </div>

              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                {DEMO_EDGES.map((e, i) => (
                  <line
                    key={i}
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    stroke={e.stroke}
                    strokeWidth={e.width}
                    strokeDasharray={e.dash ? "4 4" : undefined}
                    opacity={e.opacity}
                  />
                ))}
              </svg>

              <div className="pointer-events-auto absolute inset-0">
                {DEMO_NODES.map((node) => {
                  const isSelected = selectedEntity === node.name;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedEntity(node.name)}
                      className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center rounded-xl border p-2.5 transition-all ${
                        isSelected
                          ? "z-20 scale-110 border-2 bg-secondary shadow-lg"
                          : "z-10 border-border bg-card hover:scale-105"
                      }`}
                      style={{
                        left: node.x,
                        top: node.y,
                        borderColor: isSelected ? node.color : undefined,
                      }}
                    >
                      <span className="text-xs font-bold">{node.name}</span>
                      <span className="font-mono text-[9px] opacity-80" style={{ color: node.color }}>
                        {node.ref}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="z-10 flex w-fit items-center gap-4 rounded-lg border border-border bg-card/80 p-2 text-[10px] text-muted-foreground">
                <span>实线（红）：宿敌仇怨</span>
                <span>虚线（青）：夫妻/契约</span>
                <span>实线（蓝）：本命法宝绑定</span>
              </div>
            </div>
          </div>

          {/* 右 · 实体检视器 */}
          <Card className="w-full shrink-0 border-primary/15 lg:w-80">
            <CardContent className="flex h-full flex-col justify-between space-y-4 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-primary">
                      实体属性与反向引用
                    </span>
                    <h3 className="text-sm font-bold">{selectedEntity}</h3>
                  </div>
                  <span className="font-mono text-xs text-emerald-500">
                    {DEMO_NODES.find((n) => n.name === selectedEntity)?.ref ?? "Ref —"}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="block text-muted-foreground">核心人设圣经（Lore Bible）：</span>
                  <p className="rounded-lg border border-border bg-background p-2.5 text-[11px] leading-relaxed">
                    {DEMO_LORE_BIBLE}
                  </p>
                </div>

                <div>
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    分镜出场记录（{DEMO_APPEARANCES.length} 个镜头）
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {DEMO_APPEARANCES.map((a) => (
                      <Link
                        key={a.shot}
                        href="/storyboard"
                        className="flex items-center justify-between rounded border border-border bg-background p-2 transition-colors hover:border-primary"
                      >
                        <span>{a.shot}</span>
                        <span className="font-mono text-[10px] text-primary">{a.status}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <Link
                  href="/assets"
                  className="block w-full rounded-lg bg-primary py-2 text-center text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  在资产中心编辑该实体
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* 时间轴/层级树：原型无实现，显式空态不伪造 */
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-sm font-bold">
              「{LAYOUTS.find((l) => l.id === layoutMode)?.label}」布局待接入
            </span>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              该布局随图谱域端点批次落地（编年时间轴 / 实体层级树）。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
