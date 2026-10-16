"use client";

/**
 * BGM 情绪库页（M5-P2 · 迁移自 MiniMax-3 原型 editing/MusicLibraryPage）
 * 真链路：曲目端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/editing.ts）；
 *         情绪象限筛选为视图状态；播放钮为演示试听态（音频文件未接，不伪造真实播放）；
 *         「基于剧本情绪曲线 AI 智能选乐」端点缺位——toast 占位 + TODO；
 *         「应用到 A2 轨道」→ /video 真路由
 * 布局：头部（徽章 + AI 选乐）→ 情绪象限分段 → 曲目卡列表（授权徽章/匹配度/应用入口）
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Pause, Play, Sparkles } from "lucide-react";
import { withFallback } from "@/api/client";
import { listMusicTracks, type MusicTrack } from "@/api/editing";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";

/** 演示曲目（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_TRACKS: MusicTrack[] = [
  { id: "bgm-01", title: "暗潮涌动 · 宿命初醒", duration: "02m 45s", bpm: 124, emotion: "悬疑/史诗", license: "商用已授权", licenseColor: "#22C55E", matchScore: 96 },
  { id: "bgm-02", title: "雷霆万钧 · 剑破苍穹", duration: "03m 12s", bpm: 148, emotion: "激昂/反转", license: "商用已授权", licenseColor: "#22C55E", matchScore: 92 },
  { id: "bgm-03", title: "月华如水 · 浮生若梦", duration: "01m 58s", bpm: 82, emotion: "温暖/情感", license: "需署名", licenseColor: "#00B4D8", matchScore: 84 },
];

const QUADRANTS = ["激昂", "温暖", "悬疑", "悲伤", "欢快"] as const;

export default function MusicLibraryPage() {
  const { toast } = useToast();
  const [activeQuadrant, setActiveQuadrant] = useState<string>("悬疑");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data } = useApiData(() => withFallback(listMusicTracks, () => DEMO_TRACKS), {
    snapshotKey: "music-tracks:v1",
  });
  const tracks = data?.data ?? DEMO_TRACKS;
  const isMock = data?.isMock ?? true;

  return (
    <div>
      <PageHeader
        title="BGM 情绪库（Music Library）"
        description="二维情绪象限 · BPM 智能卡点 · 联动时间线 A2 情绪轨道"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            Epidemic Sound 对标
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 曲库端点待接入
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() =>
            // TODO：AI 选乐端点缺位
            toast({
              title: "AI 选乐端点待接入",
              description: "剧本情绪曲线解析与 BGM 匹配随音频域批次落地",
              variant: "warning",
            })
          }
        >
          <Sparkles className="h-3.5 w-3.5" />
          基于剧本情绪曲线 AI 智能选乐
        </Button>
      </div>

      {/* 情绪象限分段 */}
      <Card className="mb-4 border-[#9d7cd8]/20">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-4 md:flex-row">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-[#9d7cd8]" />
            <div>
              <h3 className="text-xs font-bold">情绪象限分段（Emotion Quadrant）</h3>
              <span className="text-[10px] text-muted-foreground">
                横轴：唤醒度（Arousal）· 纵轴：效价（Valence）
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            {QUADRANTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setActiveQuadrant(q)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 transition-all ${
                  activeQuadrant === q
                    ? "bg-[#9d7cd8] font-bold text-white shadow-md"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 曲目卡列表 */}
      <div className="space-y-3">
        {tracks.map((track) => {
          const isPlaying = playingId === track.id;
          return (
            <Card key={track.id} className="transition-all hover:border-[#9d7cd8]">
              <CardContent className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPlayingId(isPlaying ? null : track.id);
                      if (!isPlaying) {
                        // 音频文件未接：演示试听态明示
                        toast({
                          title: "演示试听态",
                          description: "音频流随曲库端点接入后真实播放",
                          variant: "default",
                        });
                      }
                    }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-secondary text-primary transition-colors hover:bg-[#9d7cd8] hover:text-white"
                    aria-label={isPlaying ? "暂停" : "播放"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                  </button>

                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="text-sm font-bold">{track.title}</h4>
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                        style={{ backgroundColor: `${track.licenseColor}15`, color: track.licenseColor }}
                      >
                        {track.license}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                      <span>时长：{track.duration}</span>
                      <span>BPM：{track.bpm}</span>
                      <span>象限：{track.emotion}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-[10px] text-muted-foreground">剧本匹配度</span>
                    <span className="font-mono text-base font-bold text-primary">
                      {track.matchScore}%
                    </span>
                  </div>
                  <Link
                    href="/video"
                    className="flex items-center gap-1.5 rounded-lg bg-[#9d7cd8] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#8b65cb]"
                  >
                    <span>应用到 A2 轨道</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
