"use client";

/**
 * 剪辑模板中心页（M5-P2 · 迁移自 MiniMax-3 原型 editing/VideoTemplatesPage）
 * 真链路：模板端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/editing.ts）；
 *         分类筛选为视图状态（原型 selectedCategory 为死状态未渲染，此处补为真实过滤）；
 *         预览图不引用原型 /demo/*.jpg 假资产——确定性渐变底 + 标题字呈现；
 *         「一键应用」「应用至时间线剪辑」→ /video 真路由
 * 布局：头部（徽章 + 应用入口）→ 分类筛选 → 模板网格卡（推荐/品牌置顶徽章 + 调用次数 + 应用入口）
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clapperboard, Crown, Sparkles } from "lucide-react";
import { withFallback } from "@/api/client";
import { listVideoTemplates, type VideoTemplate } from "@/api/editing";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";

/** 演示模板（端点未落地时降级展示，页面挂徽章留痕；口径对齐原型 MOCK_VIDEO_TEMPLATES） */
const DEMO_TEMPLATES: VideoTemplate[] = [
  {
    id: "tpl-01",
    title: "都市打脸反转 · 黄金3秒节奏模板",
    category: "整片模板",
    ratio: "9:16",
    usedCount: 428,
    recommended: true,
    agentRecommend: "知遇·伯乐 推荐",
    brandBadge: false,
  },
  {
    id: "tpl-02",
    title: "玄幻破界重击 · 震屏转场特效包",
    category: "转场包",
    ratio: "16:9 / 9:16",
    usedCount: 312,
    recommended: false,
    brandBadge: false,
  },
  {
    id: "tpl-03",
    title: "YYC³ 官方影视片头（1.5s 快速出标）",
    category: "片头片尾",
    ratio: "通用",
    usedCount: 890,
    recommended: true,
    brandBadge: true,
  },
];

/** 确定性渐变底（按 id 散列取色，不引用外部图片资产） */
const PREVIEW_GRADIENTS = [
  "from-[#2a1f4d] via-[#3b2a6b] to-[#9d7cd8]",
  "from-[#0f2e35] via-[#144a52] to-[#00b4d8]",
  "from-[#3d2b1f] via-[#6b4a2a] to-[#f59e0b]",
];

function previewGradient(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PREVIEW_GRADIENTS[hash % PREVIEW_GRADIENTS.length];
}

export default function VideoTemplatesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  const { data } = useApiData(() => withFallback(listVideoTemplates, () => DEMO_TEMPLATES), {
    snapshotKey: "video-templates:v1",
  });
  const templates = data?.data ?? DEMO_TEMPLATES;
  const isMock = data?.isMock ?? true;

  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(templates.map((t) => t.category)))],
    [templates],
  );
  const visible =
    activeCategory === "全部"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  return (
    <div>
      <PageHeader
        title="剪辑模板中心（Templates）"
        description="片头片尾 · 爆款转场包 · 整片智能套剪 · 品牌企业级规范置顶"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            剪映模板库对标
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 模板端点待接入
            </Badge>
          )}
        </div>
        <Link
          href="/video"
          className="flex items-center gap-1.5 rounded-lg bg-[#9d7cd8] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#8b65cb]"
        >
          <span>应用至时间线剪辑</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 分类筛选（视图状态） */}
      <div className="mb-4 flex items-center gap-2 font-mono text-xs">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCategory(c)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 transition-all ${
              activeCategory === c
                ? "bg-[#9d7cd8] font-bold text-white shadow-md"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 模板网格卡 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {visible.map((tpl) => (
          <Card
            key={tpl.id}
            className="group overflow-hidden transition-all hover:border-[#9d7cd8]"
          >
            {/* 确定性预览块（无外部图片资产） */}
            <div
              className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${previewGradient(tpl.id)}`}
            >
              <Clapperboard className="h-8 w-8 text-white/40 transition-transform group-hover:scale-110" />
              {tpl.recommended && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-[#FFD700] px-2 py-0.5 text-[10px] font-bold text-[#0a1628] shadow-md">
                  <Sparkles className="h-3 w-3" />
                  <span>{tpl.agentRecommend ?? "爆款推荐"}</span>
                </span>
              )}
              {tpl.brandBadge && (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-[#00e0b8] px-2 py-0.5 text-[10px] font-bold text-[#0a1628]">
                  <Crown className="h-3 w-3" />
                  <span>品牌置顶</span>
                </span>
              )}
            </div>

            <CardContent className="space-y-2 p-3.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-[#9d7cd8]">
                  {tpl.category}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  适用 {tpl.ratio}
                </span>
              </div>
              <h4 className="text-xs font-bold transition-colors group-hover:text-[#9d7cd8]">
                {tpl.title}
              </h4>
              <div className="flex items-center justify-between border-t border-border pt-2.5">
                <span className="font-mono text-[11px] text-muted-foreground">
                  调用 {tpl.usedCount} 次
                </span>
                <Link
                  href="/video"
                  className="rounded bg-secondary px-3 py-1 text-xs font-bold text-[#9d7cd8] transition-colors hover:bg-[#9d7cd8] hover:text-white"
                >
                  一键应用
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {visible.length === 0 && (
        <Card className="mt-4 border-dashed">
          <CardContent className="p-8 text-center text-xs text-muted-foreground">
            当前分类下暂无模板——模板库端点接入后按分类真实呈现
          </CardContent>
        </Card>
      )}
    </div>
  );
}
