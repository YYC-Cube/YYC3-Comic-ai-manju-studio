"use client";

/**
 * 时间线剪辑页（M4 · 融合 MiniMax-3 原型 editing/TimelineEditorPage IA）
 * 真链路：时间线/检查器数据 = 分镜注册表 shots（StoryboardV1 真源）；预览复用 VideoPreview（NAS 未映射时诚实占位）
 * 原型假数据不迁：SNAPSHOT.timelineClips 四轨假片段、固定 18s 跑道、硬编码字幕文案
 * 占位动作（无真实端点，toast + TODO(M5)）：AI 智能粗剪、版本 Diff、素材库配音/BGM/广告、转场与音量落库
 * 布局：动作头（画幅切换/AI 粗剪/版本 Diff/渲染导出）→ 三栏（素材库 / 预览 / 检查器）→ 四语义轨时间线
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  FileVideo,
  GitCompare,
  Mic,
  Music,
  Share2,
  Sparkles,
  Star,
  Type,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { VideoPreview } from "@/components/preview/video-preview";
import { TimelineEditor } from "@/components/timeline/timeline-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/use-project-store";
import { useStoryboardStore } from "@/store/use-storyboard-store";

type AspectRatio = "16:9" | "9:16" | "1:1";

export default function VideoPage() {
  const { toast } = useToast();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const storyboard = useStoryboardStore((s) => s.storyboard);
  const shots = useMemo(() => storyboard?.shots ?? [], [storyboard]);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  // TODO(M5)：转场/音量为剪辑参数端点的本地预演，端点落地后接持久化
  const [transition, setTransition] = useState("none");
  const [volume, setVolume] = useState(100);

  const selectedShot = shots.find((s) => s.shot_id === selectedShotId) ?? shots[0];
  const totalDuration = shots.reduce((sum, s) => sum + s.duration_sec, 0);

  const todo = (title: string, description: string) =>
    toast({ title: `${title}（TODO M5）`, description, variant: "warning" });

  return (
    <div>
      <PageHeader
        title={storyboard ? `《${storyboard.episode_title}》多轨道剪辑` : "时间线剪辑"}
        description="镜头轨与音画轨对齐预览；成片合成后回传 NAS 归档"
      />

      {/* 动作头：画幅切换 + AI 粗剪 / 版本 Diff / 渲染导出 */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
            剪映专业版级内核
          </span>
          <div className="flex items-center rounded border bg-muted/50 p-0.5 font-mono text-xs">
            {(["16:9", "9:16", "1:1"] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatio(ratio)}
                className={cn(
                  "cursor-pointer rounded px-2 py-0.5",
                  aspectRatio === ratio
                    ? "bg-primary font-bold text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              todo("AI 智能粗剪", "情绪曲线卡点匹配（语枢·万物）与自动卡点粗剪端点随 M5 批次落地")
            }
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 智能粗剪 (自动卡点)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              todo("版本 Diff", "时间线版本对比随 special 域批次（R6 裁决）落地")
            }
          >
            <GitCompare className="h-3.5 w-3.5" />
            版本 Diff
          </Button>
          <Link href="/video/exports" className={buttonVariants({ size: "sm" })}>
            <Share2 className="h-3.5 w-3.5" />
            渲染导出 (4K/多规格)
          </Link>
        </div>
      </div>

      {/* 三栏：素材库 / 预览 / 检查器 */}
      <div className="flex flex-col gap-3 lg:h-[360px] lg:flex-row">
        {/* 左 · 素材库 */}
        <Card className="w-full shrink-0 lg:w-56">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">素材库与音效</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-3">
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <Link
                href="/storyboard"
                className="rounded bg-primary/10 p-2 text-left font-medium text-primary"
              >
                分镜片段 ({shots.length})
              </Link>
              <button
                type="button"
                onClick={() => todo("角色配音", "配音域页面随 P2 批次迁移")}
                className="cursor-pointer rounded bg-muted/50 p-2 text-left text-muted-foreground hover:text-foreground"
              >
                角色配音
              </button>
              <button
                type="button"
                onClick={() => todo("情绪 BGM", "音乐域页面随 P2 批次迁移")}
                className="cursor-pointer rounded bg-muted/50 p-2 text-left text-muted-foreground hover:text-foreground"
              >
                情绪 BGM
              </button>
              <button
                type="button"
                onClick={() => todo("广告挂件", "商业化植入挂件随 P2 批次迁移")}
                className="cursor-pointer rounded bg-muted/50 p-2 text-left text-muted-foreground hover:text-foreground"
              >
                广告挂件
              </button>
            </div>
            <p className="rounded-lg bg-muted/40 p-2 font-mono text-[10px] text-muted-foreground">
              双击轨道片段可进入微调裁剪 · 总时长 {totalDuration.toFixed(1)}s · 画幅 {aspectRatio}
            </p>
          </CardContent>
        </Card>

        {/* 中 · 预览（VideoPreview 自带 NAS 未映射诚实占位） */}
        <VideoPreview
          className="min-w-0 flex-1"
          projectId={activeProjectId ?? "{project_id}"}
          shot={selectedShot}
        />

        {/* 右 · 片段属性检查器（真 shots 数据） */}
        <Card className="w-full shrink-0 overflow-y-auto lg:w-72">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">片段属性检查器</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {selectedShot ? (
              <div className="space-y-1 rounded-lg bg-muted/40 p-2.5">
                <span className="flex items-center gap-1.5 font-mono text-primary">
                  {selectedShot.shot_id}
                  {selectedShot.hook_flag && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  )}
                </span>
                <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span>时长: {selectedShot.duration_sec}s</span>
                  <span>
                    {selectedShot.shot_type}景 · {selectedShot.camera_move}
                  </span>
                </div>
                {selectedShot.dialogue && (
                  <p className="border-t border-border/60 pt-1 text-[11px] leading-relaxed text-muted-foreground">
                    台词：{selectedShot.dialogue}
                  </p>
                )}
                {(selectedShot.bgm || selectedShot.sfx) && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {selectedShot.bgm && <span className="mr-2">BGM：{selectedShot.bgm}</span>}
                    {selectedShot.sfx && <span>音效：{selectedShot.sfx}</span>}
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-lg bg-muted/40 p-2.5 text-muted-foreground">
                分镜注册表暂无镜头——先在分镜页生成或导入分镜
              </p>
            )}

            <div>
              <span className="mb-1 block text-muted-foreground">转场效果 (Transition):</span>
              <select
                value={transition}
                onChange={(e) => setTransition(e.target.value)}
                className="w-full rounded border bg-background p-2 focus:outline-none"
              >
                <option value="none">无转场</option>
                <option value="fade">淡入淡出 (Fade)</option>
                <option value="slide">横向滑动 (Slide)</option>
                <option value="dissolve">交叉叠化 (Dissolve)</option>
              </select>
            </div>

            <div>
              <span className="mb-1 block text-muted-foreground">
                音量包络增益 ({volume}%):
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1 rounded-lg border border-orange-500/30 bg-muted/40 p-2.5 text-[11px]">
              <span className="flex items-center gap-1 font-bold text-orange-500">
                <DollarSign className="h-3.5 w-3.5" />
                商业化植入位 (P25)
              </span>
              <p className="text-muted-foreground">
                可在本片段末尾挂载动态品牌贴片或角标（投放端点随 M5 批次落地）。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 底部 · 时间线（真 shots，视频轨 + BGM/SFX 音轨，受控选中联动检查器） */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-sm">
            时间线（{shots.length} 镜）
            <span className="flex items-center gap-2 font-mono text-[10px] font-normal text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileVideo className="h-3 w-3 text-primary" /> V1 画面主轨
              </span>
              <span className="flex items-center gap-1">
                <Music className="h-3 w-3 text-emerald-500" /> BGM
              </span>
              <span className="flex items-center gap-1">
                <Mic className="h-3 w-3 text-amber-500" /> SFX
              </span>
              <span className="flex items-center gap-1">
                <Type className="h-3 w-3 text-muted-foreground" /> 字幕随台词字段
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineEditor
            shots={shots}
            selectedId={selectedShotId}
            onSelect={setSelectedShotId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
