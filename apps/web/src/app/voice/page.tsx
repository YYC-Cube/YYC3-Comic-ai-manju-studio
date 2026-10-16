"use client";

/**
 * 配音导演台页（M5-P2 · 迁移自 MiniMax-3 原型 production/VoiceStudioPage）
 * 真链路：台词/音色端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/editing.ts）；
 *         「AI 一键全集配音」「导入外录干音」端点缺位——toast 占位 + TODO；
 *         波形为确定性视觉呈现（正弦柱，非真实音频频谱）；试听钮为演示态；
 *         情绪滑杆为视图状态（合成参数随 TTS 端点接入生效）；
 *         「应用并跳转时间线剪辑」→ /video 真路由
 * 布局：头部（徽章 + 双动作）→ 左台词列表 → 中波形与情绪滑杆 → 右角色音色绑定矩阵
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play, Sparkles } from "lucide-react";
import { withFallback } from "@/api/client";
import {
  listTimbreBindings,
  listVoiceDialogues,
  type TimbreBinding,
  type VoiceDialogue,
} from "@/api/editing";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";

/** 演示数据（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_DIALOGUES: VoiceDialogue[] = [
  { id: 1, shot: "S01-01", character: "叶凌霄", line: "三百年了，这具肉躯终于感应到灵枢。", emotion: "冷峻沉着", timbre: "修真青年原音" },
  { id: 2, shot: "S01-02", character: "陈浩天", line: "哟，这不是我们苏家的大能人吗？怎么躲在角落里？", emotion: "讥讽狂妄", timbre: "豪门纨绔特音" },
  { id: 3, shot: "S01-03", character: "叶凌霄", line: "蝼蚁之辈，也敢惊扰本座清修？", emotion: "杀意威严", timbre: "修真青年原音" },
  { id: 4, shot: "S01-04", character: "苏清月", line: "陈少，这里是苏家年会，请你自重！", emotion: "冷艳斥责", timbre: "高贵女总裁音" },
];

const DEMO_TIMBRES: TimbreBinding[] = [
  { character: "叶凌霄", timbre: "修真冷傲青年音", cloneId: "cl_091", speed: "1.05x", breathComp: "+15ms", color: "#00e0b8" },
  { character: "苏清月", timbre: "高贵冷艳女总裁音", cloneId: "cl_114", speed: "1.00x", breathComp: "+10ms", color: "#9d7cd8" },
];

const EMOTION_LABELS = ["极度平静", "冷峻压抑", "克制暗讽", "凌厉杀意", "狂怒爆发"];

export default function VoiceStudioPage() {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [emotionLevel, setEmotionLevel] = useState(3);
  const [selectedId, setSelectedId] = useState(1);

  const { data: dialoguesData } = useApiData(
    () => withFallback(listVoiceDialogues, () => DEMO_DIALOGUES),
    { snapshotKey: "voice-dialogues:v1" },
  );
  const { data: timbresData } = useApiData(
    () => withFallback(listTimbreBindings, () => DEMO_TIMBRES),
    { snapshotKey: "timbre-bindings:v1" },
  );
  const dialogues = dialoguesData?.data ?? DEMO_DIALOGUES;
  const timbres = timbresData?.data ?? DEMO_TIMBRES;
  const isMock = (dialoguesData?.isMock ?? true) || (timbresData?.isMock ?? true);

  const selected = dialogues.find((d) => d.id === selectedId) ?? dialogues[0];

  return (
    <div>
      <PageHeader
        title="配音导演台（Voice Studio）"
        description="音色克隆 · 情绪五档滑杆 · 语速气口微调 · 直通时间线 A1 轨道"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            ElevenLabs 对标
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · TTS 端点待接入
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast({
                title: "干音导入端点待接入",
                description: "外录干音上传与对齐随音频域批次落地",
                variant: "warning",
              })
            }
          >
            导入外录干音
          </Button>
          <Button
            size="sm"
            onClick={() =>
              toast({
                title: "AI 配音端点待接入",
                description: "全集 TTS 合成（音色克隆 + 情绪参数）随音频域批次落地",
                variant: "warning",
              })
            }
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 一键全集配音
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* 左 · 台词列表 */}
        <Card className="w-full shrink-0 lg:w-72">
          <CardContent className="space-y-2.5 p-3">
            <span className="block text-xs font-bold">分镜台词对白列表</span>
            <div className="space-y-2 text-xs">
              {dialogues.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full cursor-pointer rounded-lg border p-2.5 text-left transition-all ${
                    d.id === selectedId
                      ? "border-primary bg-secondary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-primary">
                      {d.shot} · {d.character}
                    </span>
                    <span className="text-amber-500">{d.emotion}</span>
                  </div>
                  <p className="line-clamp-2 text-[11px] leading-tight">{d.line}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 中 · 波形与情绪控制 */}
        <Card className="flex-1">
          <CardContent className="space-y-5 p-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold">
                  当前试听：{selected?.shot} {selected?.character}
                </span>
                <span className="font-mono text-xs text-primary">时长：02.8s</span>
              </div>

              {/* 确定性波形呈现（正弦柱，非真实音频频谱） */}
              <div className="relative flex h-28 items-center justify-center gap-1 overflow-hidden rounded-xl border border-primary/20 bg-background p-4">
                <div className="absolute left-3 top-2 font-mono text-[10px] text-muted-foreground/70">
                  48kHz · 24-bit PCM
                </div>
                {Array.from({ length: 48 }).map((_, idx) => {
                  const height = Math.sin(idx * 0.3) * 35 + 40;
                  return (
                    <div
                      key={idx}
                      className="w-1 rounded-full transition-all duration-150"
                      style={{ height: `${height}%`, backgroundColor: idx < 20 ? "hsl(var(--primary))" : "hsl(var(--secondary))" }}
                    />
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(!isPlaying);
                    if (!isPlaying) {
                      toast({
                        title: "演示试听态",
                        description: "合成音频随 TTS 端点接入后真实播放",
                        variant: "default",
                      });
                    }
                  }}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 transition-colors hover:bg-black/10"
                  aria-label={isPlaying ? "暂停" : "播放"}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-lg">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                  </span>
                </button>
              </div>
            </div>

            {/* 情绪滑杆（五档） */}
            <div className="space-y-2 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">情绪强度滑杆（Emotion Arc）</span>
                <span className="font-mono font-bold text-primary">
                  Level {emotionLevel}：{EMOTION_LABELS[emotionLevel - 1]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={emotionLevel}
                onChange={(e) => setEmotionLevel(Number(e.target.value))}
                className="w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground/70">
                <span>平静日常</span>
                <span>戏剧对峙</span>
                <span>巅峰高潮</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">已锁定 A1 轨道实时卡点</span>
              <Link
                href="/video"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <span>应用并跳转时间线剪辑</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 右 · 音色绑定矩阵 */}
        <Card className="w-full shrink-0 lg:w-72">
          <CardContent className="space-y-3 p-4">
            <span className="block text-xs font-bold">角色音色绑定矩阵</span>
            <div className="space-y-2 text-xs">
              {timbres.map((t) => (
                <div
                  key={t.character}
                  className="rounded-lg border border-border bg-background p-2.5"
                  style={{ borderColor: `${t.color}33` }}
                >
                  <span className="block font-bold">{t.character}</span>
                  <span className="text-[11px]" style={{ color: t.color }}>
                    {t.timbre}（克隆ID：{t.cloneId}）
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground/70">
                    语速：{t.speed} · 气口补偿 {t.breathComp}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
