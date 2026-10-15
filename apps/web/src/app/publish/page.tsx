"use client";

/**
 * 发布看板页（M4 · 迁移自 MiniMax-3 原型 publishing/PublishBoardPage）
 * 真链路：GET /api/v1/publishing/matrix 直连——M1 骨架返回空集，渲染诚实空态（不伪造演示矩阵）；
 *         四指标卡由矩阵数据派生（已发布/排队/驳回/成功率），空集时显示 0
 * 占位动作：「一键应用建议并重新分发」无参数化端点 → toast TODO(M5)
 */
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Film, Send } from "lucide-react";
import { listPublishMatrix, type PlatformKey, type PublishMatrixRow } from "@/api/publish";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";
import { cn } from "@/lib/utils";

const PLATFORMS: { key: PlatformKey; name: string }[] = [
  { key: "douyin", name: "抖音" },
  { key: "channels", name: "视频号" },
  { key: "bilibili", name: "B站" },
  { key: "kuaishou", name: "快手" },
  { key: "xiaohongshu", name: "小红书" },
];

interface RejectionInfo {
  film: string;
  platform: string;
  reason: string;
  fix: string;
}

export default function PublishBoardPage() {
  const { toast } = useToast();
  const { data: matrix, loading } = useApiData(listPublishMatrix, {
    snapshotKey: "publish-matrix:v1",
  });
  const rows = matrix ?? [];
  const [inspectedRejection, setInspectedRejection] = useState<RejectionInfo | null>(null);

  // 四指标由矩阵真数据派生
  let published = 0;
  let queued = 0;
  let rejected = 0;
  for (const row of rows) {
    for (const p of PLATFORMS) {
      const t = row.targets[p.key];
      if (!t) continue;
      if (t.status === "published") published += 1;
      else if (t.status === "queued" || t.status === "transcoding") queued += 1;
      else if (t.status === "rejected") rejected += 1;
    }
  }
  const successRate =
    published + rejected > 0 ? ((published / (published + rejected)) * 100).toFixed(1) : "—";

  const metrics = [
    { label: "已发布条数", value: `${published} 条`, cls: "text-emerald-500" },
    { label: "排队队列中", value: `${queued} 条`, cls: "text-sky-500" },
    { label: "平台驳回拦截", value: `${rejected} 条`, cls: "text-red-500" },
    { label: "分发成功率", value: successRate === "—" ? "—" : `${successRate}%`, cls: "text-primary" },
  ];

  return (
    <div>
      <PageHeader
        title="发布看板 (Publish Board)"
        description="多平台发布状态矩阵 · 驳回原因码智能溯源 · 播放回执直通运营反哺"
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <Badge variant="secondary" className="font-mono">
          蚁小二矩阵对标
        </Badge>
        <Link href="/publish/wizard" className={buttonVariants({ size: "sm" })}>
          <Send className="h-3.5 w-3.5" />
          新建一键分发
        </Link>
      </div>

      {/* 四指标卡（矩阵派生） */}
      <div className="mb-4 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-3.5">
              <span className="block text-xs text-muted-foreground">{m.label}</span>
              <span className={cn("font-mono text-2xl font-bold", m.cls)}>{m.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 矩阵表 / 空态 */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Film className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              {loading ? "正在同步多平台发布回执…" : "暂无发布记录"}
            </p>
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              推送域后端当前为 M1 骨架阶段（GET matrix 返回空集）；推送任务随 H3 产出回流与 M5 批次落地后，此处呈现五平台状态矩阵。
            </p>
            {!loading && (
              <Link href="/publish/wizard" className={buttonVariants({ variant: "outline", size: "sm" })}>
                前往分发向导
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="p-3 font-semibold">成片信息</th>
                  {PLATFORMS.map((p) => (
                    <th key={p.key} className="p-3 text-center font-semibold">
                      {p.name}
                    </th>
                  ))}
                  <th className="p-3 text-right font-semibold">数据回流</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((row: PublishMatrixRow) => (
                  <tr key={row.filmId} className="transition-colors hover:bg-muted/40">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-10 shrink-0 items-center justify-center rounded border bg-muted/60 font-mono text-[10px] text-muted-foreground">
                          {row.filmTitle.slice(0, 2)}
                        </div>
                        <span className="font-bold">{row.filmTitle}</span>
                      </div>
                    </td>

                    {PLATFORMS.map((p) => {
                      const target = row.targets[p.key];
                      if (!target || target.status === "unassigned") {
                        return (
                          <td key={p.key} className="p-3 text-center font-mono text-muted-foreground/60">
                            未排期
                          </td>
                        );
                      }
                      if (target.status === "published") {
                        return (
                          <td key={p.key} className="p-3 text-center">
                            <Link
                              href="/analytics"
                              className="inline-flex flex-col items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-500 hover:bg-emerald-500/20"
                              title="查看详细运营数据"
                            >
                              <span className="text-[11px] font-bold">已发布✓</span>
                              {typeof target.views === "number" && (
                                <span className="font-mono text-[10px] opacity-80">
                                  {(target.views / 10000).toFixed(1)}w 播放
                                </span>
                              )}
                            </Link>
                          </td>
                        );
                      }
                      if (target.status === "rejected") {
                        return (
                          <td key={p.key} className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setInspectedRejection({
                                  film: row.filmTitle,
                                  platform: p.name,
                                  reason: target.rejectReason || "敏感词拦截",
                                  fix: target.suggestedFix || "更换封面人物特写",
                                })
                              }
                              className="inline-flex cursor-pointer flex-col items-center rounded-lg border border-red-500/40 bg-red-500/15 p-1.5 text-red-500 hover:bg-red-500/25"
                            >
                              <span className="text-[11px] font-bold">驳回 {target.rejectCode}</span>
                              <span className="text-[10px] underline">点击查看原因</span>
                            </button>
                          </td>
                        );
                      }
                      if (target.status === "queued") {
                        return (
                          <td key={p.key} className="p-3 text-center font-mono text-amber-500">
                            <span className="rounded bg-amber-500/15 px-2 py-0.5">排队中</span>
                          </td>
                        );
                      }
                      return (
                        <td key={p.key} className="p-3 text-center font-mono text-primary">
                          转码中…
                        </td>
                      );
                    })}

                    <td className="p-3 text-right">
                      <Link
                        href="/analytics"
                        className="ml-auto flex w-fit items-center gap-1 rounded bg-muted/60 px-2.5 py-1 font-mono text-xs text-sky-500 hover:bg-muted"
                      >
                        数据回流
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 驳回诊断卡 */}
      {inspectedRejection && (
        <Card className="mt-4 border-red-500/40">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-xs font-bold">
                  {inspectedRejection.platform} 平台驳回详情诊断
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedRejection(null)}
                className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
              >
                关闭
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div>
                <strong className="text-muted-foreground">涉及剧目:</strong>{" "}
                <span>{inspectedRejection.film}</span>
              </div>
              <div>
                <strong className="text-red-500">平台驳回原因:</strong>{" "}
                <span>{inspectedRejection.reason}</span>
              </div>
              <div className="rounded border border-primary/30 bg-muted/40 p-2.5 text-primary">
                <strong>AI 创想·灵韵 修复建议:</strong> {inspectedRejection.fix}
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: "一键应用建议并重新分发（TODO M5）",
                    description: "参数化重发端点随推送队列 M5 批次落地",
                    variant: "warning",
                  })
                }
                className="cursor-pointer rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground"
              >
                一键应用建议并重新分发
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
