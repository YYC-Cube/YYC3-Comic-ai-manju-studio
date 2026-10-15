"use client";

/**
 * 渲染导出中枢页（M4 · 迁移自 MiniMax-3 原型 editing/VideoExportsPage；M5 端点落地）
 * 真链路：GET/POST /videos/exports 真端点（export_tasks 表）——withFallback 保留网络兜底；
 *         「提交批量转码导出」真创建任务（EXP-NNN，queued 态；转码 worker 未接，进度不伪造推进）；
 *         「直通分发向导 / 下载并分发」→ /publish/wizard 真路由
 * 布局：头部 → 左新建导出预设卡（分辨率/封装格式/五平台变体说明）→ 右硬件转码队列
 */
import { useState } from "react";
import Link from "next/link";
import { Download, Share2 } from "lucide-react";
import { createExportTask, listExportTasks, type ExportTask } from "@/api/video-export";
import { withFallback } from "@/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";
import { cn } from "@/lib/utils";

/** 演示队列（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_TASKS: ExportTask[] = [
  {
    id: "EXP-101",
    title: "E01 抖音 9:16 满血竖屏版",
    resolution: "1080×1920 (9:16)",
    bitrate: "18 Mbps · H.264",
    progress: 100,
    status: "completed",
    duration: "00m 42s",
    hwTag: "VideoToolbox HW",
    size: "86 MB",
  },
  {
    id: "EXP-102",
    title: "E01 B站 16:9 4K 收藏母带",
    resolution: "3840×2160 (16:9)",
    bitrate: "45 Mbps · HEVC",
    progress: 68,
    status: "rendering",
    duration: "01m 20s",
    hwTag: "NVENC 硬件加速",
    size: "280 MB",
  },
  {
    id: "EXP-103",
    title: "E01 视频号 9:16 社交版",
    resolution: "1080×1920 (9:16)",
    bitrate: "15 Mbps · H.264",
    progress: 100,
    status: "completed",
    duration: "00m 38s",
    hwTag: "VideoToolbox HW",
    size: "72 MB",
  },
];

type Resolution = "1080p" | "4K" | "720p";
type ContainerFormat = "MP4" | "MOV";

export default function VideoExportsPage() {
  const { toast } = useToast();
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [format, setFormat] = useState<ContainerFormat>("MP4");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, loading, retry } = useApiData(
    () => withFallback(listExportTasks, () => DEMO_TASKS),
    { snapshotKey: "video-exports:v1" }
  );
  const tasks = data?.data ?? [];
  const isMock = data?.isMock ?? false;

  return (
    <div>
      <PageHeader
        title="渲染导出中枢 (Render & Exports)"
        description="一键批量导出全网多规格矩阵（抖音竖屏 / B站 4K / 视频号）· FFmpeg 硬件直通"
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            FFmpeg 硬件直通
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 队列端点待接入 (M5)
            </Badge>
          )}
        </div>
        <Link href="/publish/wizard" className={buttonVariants({ size: "sm" })}>
          <Share2 className="h-3.5 w-3.5" />
          直通多平台分发向导 →
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* 左 · 新建导出预设 */}
        <Card className="w-full shrink-0 lg:w-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">新建多规格导出预设</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="mb-1 block text-xs text-muted-foreground">分辨率规格:</span>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                {(["1080p", "4K", "720p"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={cn(
                      "cursor-pointer rounded py-1.5",
                      resolution === r
                        ? "bg-primary font-bold text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1 block text-xs text-muted-foreground">视频封装格式:</span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                {(["MP4", "MOV"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      "cursor-pointer rounded py-1.5",
                      format === f
                        ? "bg-primary font-bold text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg border border-primary/30 bg-muted/40 p-3 text-xs">
              <span className="block font-bold text-primary">
                一键生成五大平台自适应变体包:
              </span>
              <p className="text-[11px] leading-snug text-muted-foreground">
                抖音 (9:16 1080p) + B站 (16:9 4K) + 视频号 (9:16) + 小红书 (3:4)
              </p>
            </div>

            <Button
              className="w-full font-bold"
              disabled={isSubmitting}
              onClick={async () => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                try {
                  const created = await createExportTask({
                    title: `E01 多规格变体包（${resolution} · ${format}）`,
                    resolution,
                    format,
                  });
                  toast({
                    title: `导出任务已创建 ${created.id}`,
                    description: "queued 态入队；FFmpeg 转码管线接入后自动推进",
                    variant: "success",
                  });
                  retry();
                } catch (err) {
                  toast({
                    title: "创建失败",
                    description: err instanceof Error ? err.message : "请稍后重试",
                    variant: "warning",
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? "正在创建…" : "提交批量转码导出"}
            </Button>
          </CardContent>
        </Card>

        {/* 右 · 硬件转码队列 */}
        <Card className="min-w-0 flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              硬件转码导出队列 (FFmpeg Hardware Pipeline)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && tasks.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                正在装载导出队列…
              </p>
            )}
            {!loading && tasks.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                渲染队列为空——从时间线发起渲染
              </p>
            )}
            {tasks.map((task) => (
              <div key={task.id} className="space-y-2 rounded-xl border bg-muted/30 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 font-mono text-xs font-bold text-primary">
                      {task.id}
                    </span>
                    <h4 className="truncate text-xs font-bold">{task.title}</h4>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {task.hwTag}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {task.size}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        task.status === "completed" ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-xs font-bold text-primary">
                    {task.progress}%
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-1 font-mono text-[11px] text-muted-foreground">
                  <span>
                    {task.resolution} · {task.bitrate} · 耗时 {task.duration}
                  </span>
                  {task.status === "completed" ? (
                    <Link
                      href="/publish/wizard"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      下载并分发
                    </Link>
                  ) : (
                    <span className="text-amber-500">压制中…</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
