/**
 * 后期工坊 API（M5-P2 · 幻影端点层）
 * 后端端点未落地：全部经 withFallback 降级演示数据 + 页面 Badge 留痕；
 * 端点形状对齐 MiniMax-3 原型 DEV_META 口径，落地时按此契约实现后端。
 */
import { request } from "@/api/client";

// ── BGM 情绪库（Music Library）────────────────────────────────

export interface MusicTrack {
  id: string;
  title: string;
  duration: string;
  bpm: number;
  emotion: string;
  license: string;
  licenseColor: string;
  matchScore: number;
}

/** BGM 曲目（原型口径：情绪象限 + BPM 检索） */
export function listMusicTracks(): Promise<MusicTrack[]> {
  return request<MusicTrack[]>("/api/v1/factory/editing/music-tracks");
}

// ── 剪辑模板中心（Video Templates）─────────────────────────────

export interface VideoTemplate {
  id: string;
  title: string;
  category: string;
  ratio: string;
  usedCount: number;
  recommended: boolean;
  agentRecommend?: string;
  brandBadge: boolean;
}

/** 剪辑模板清单 */
export function listVideoTemplates(): Promise<VideoTemplate[]> {
  return request<VideoTemplate[]>("/api/v1/factory/editing/templates");
}

// ── 配音导演台（Voice Studio）──────────────────────────────────

export interface VoiceDialogue {
  id: number;
  shot: string;
  character: string;
  line: string;
  emotion: string;
  timbre: string;
}

export interface TimbreBinding {
  character: string;
  timbre: string;
  cloneId: string;
  speed: string;
  breathComp: string;
  color: string;
}

/** 分镜台词对白列表 */
export function listVoiceDialogues(): Promise<VoiceDialogue[]> {
  return request<VoiceDialogue[]>("/api/v1/factory/editing/voice-dialogues");
}

/** 角色音色绑定矩阵 */
export function listTimbreBindings(): Promise<TimbreBinding[]> {
  return request<TimbreBinding[]>("/api/v1/factory/editing/timbre-bindings");
}
