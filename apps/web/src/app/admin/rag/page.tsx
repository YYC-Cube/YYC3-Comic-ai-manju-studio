"use client";

/**
 * RAG 与知识库管理页（M5-P2 · 迁移自 MiniMax-3 原型 management/AdminRagPage）
 * 真链路：语料集合端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/management.ts）；
 *         「上传并切块索引文档」「检索 Top-3」端点缺位——toast 占位 + TODO；
 *         检索结果卡为演示数据（随页面 Badge 留痕，不伪装真实召回）
 * 布局：头部（徽章 + 上传入口）→ 左知识库集合清单 → 右实时检索验证测试台
 */
import { useState } from "react";
import { Upload } from "lucide-react";
import { withFallback } from "@/api/client";
import { listRagCorpora } from "@/api/management";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";

/** 演示集合（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_COLLECTIONS = [
  { name: "世界观设定库", docs: 12, chunks: 1420, vectors: 1420, hitRate: "98.4%" },
  { name: "爆款漫剧分镜库", docs: 34, chunks: 3890, vectors: 3890, hitRate: "94.2%" },
  { name: "平台规则与敏感词库", docs: 8, chunks: 640, vectors: 640, hitRate: "99.8%" },
];

export default function AdminRagPage() {
  const { toast } = useToast();
  const [testQuery, setTestQuery] = useState("叶凌霄本命飞剑外观特征与施法禁忌");
  const [selectedKb, setSelectedKb] = useState("世界观设定库");

  const { data } = useApiData(() => withFallback(listRagCorpora, () => DEMO_COLLECTIONS), {
    snapshotKey: "rag-corpora:v1",
  });
  const isMock = data?.isMock ?? true;
  const collections = DEMO_COLLECTIONS;

  return (
    <div>
      <PageHeader
        title="RAG 与知识库管理（Vector Knowledge）"
        description="世界观/剧本/规则库统一向量化 · 毫秒级语义检索 · 检索测试验证台"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            Milvus / RAGFlow 对标
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · RAG 端点待接入
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() =>
            // TODO：文档上传与切块索引端点缺位
            toast({
              title: "文档索引端点待接入",
              description: "上传 → 切块 → 向量入库管线随 RAG 域批次落地",
              variant: "warning",
            })
          }
        >
          <Upload className="h-3.5 w-3.5" />
          上传并切块索引文档
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* 左 · 知识库集合 */}
        <Card className="w-full lg:w-1/2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">向量知识库集合</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {collections.map((col) => (
              <button
                key={col.name}
                type="button"
                onClick={() => setSelectedKb(col.name)}
                className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-all ${
                  selectedKb === col.name
                    ? "border-sky-400 bg-secondary"
                    : "border-border bg-background hover:border-sky-400/40"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="text-xs font-bold">{col.name}</h4>
                  <span className="font-mono text-[10px] text-emerald-500">命中率 {col.hitRate}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                  <span>文档数：{col.docs}</span>
                  <span>切块数：{col.chunks}</span>
                  <span>向量数：{col.vectors}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* 右 · 检索测试台 */}
        <Card className="w-full border-sky-400/20 lg:w-1/2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">实时检索验证测试台</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="输入检索词…"
                className="min-w-0 flex-1 bg-transparent text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  // TODO：向量检索端点缺位
                  toast({
                    title: "检索端点待接入",
                    description: `对「${selectedKb}」的 Top-3 语义检索随 RAG 域批次落地`,
                    variant: "warning",
                  })
                }
                className="cursor-pointer rounded bg-sky-400 px-3 py-1 text-xs font-bold text-background"
              >
                检索 Top-3
              </button>
            </div>

            {/* 演示命中结果（页面 Badge 留痕） */}
            <div className="space-y-1.5 rounded-lg border border-primary/20 bg-background p-3 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px] text-primary">
                <span>[Top-1 命中] 相似度：0.94</span>
                <span>召回用时：14ms</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                「叶凌霄本命飞剑名唤『冰魄』，平时化作食指上的一枚古拙墨玉戒。在现代室内光线下，聚光角度超过 45 度时会映射出微弱晶莹水雾。」
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
