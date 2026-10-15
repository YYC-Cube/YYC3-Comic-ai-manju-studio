/**
 * 剧本域 API（M2 · 对齐 M1 后端真实端点 /api/v1/factory/scripts:*）
 * 引擎能力：章节切分 / 场景切分 / 要素抽取 / 集数规划 / 钩子检测
 * analyzeScript 为页面侧一键解析的组合编排（多次调用同一域端点）
 */

export interface NameMention {
  name: string;
  mentions: number;
}

export interface ExtractResult {
  characters: NameMention[];
  scenes: NameMention[];
  dialogues: Array<{ speaker: string; line: string }>;
  plot_points: Array<{ type: string; sentence: string; score: number }>;
}

export interface Chapter {
  chapter_id: string;
  content: string;
  [key: string]: unknown;
}

export interface Episode {
  episode_id: string;
  episode_title: string;
  content: string;
  source_chapters: string[];
  duration_seconds: number;
  hook_line: string;
  hook_type: string;
}

export interface HooksResult {
  hooks: Array<{ type: string; sentence: string; score: number }>;
  top: Array<{ type: string; sentence: string; score: number }>;
  episode_hook: { type: string; sentence: string; score?: number };
}

import { request } from "@/api/client";

/** 章节切分 */
export function splitChapters(
  text: string,
  minChars = 300
): Promise<{ count: number; chapters: Chapter[] }> {
  return request("/api/v1/factory/scripts:split", {
    method: "POST",
    body: JSON.stringify({ text, min_chars: minChars }),
  });
}

/** 场景切分 */
export function splitScenes(chapterText: string): Promise<{ scenes: unknown[] }> {
  return request("/api/v1/factory/scripts:scenes", {
    method: "POST",
    body: JSON.stringify({ chapter_text: chapterText }),
  });
}

/** 要素抽取（角色/场景/台词/剧情要点） */
export function extractElements(text: string, topN = 10): Promise<ExtractResult> {
  return request("/api/v1/factory/scripts:extract", {
    method: "POST",
    body: JSON.stringify({ text, top_n: topN }),
  });
}

/** 集数规划（90-120s 节奏窗口，绑定主钩子） */
export function planEpisodes(
  chapters: Chapter[],
  episodeSeconds = 105
): Promise<{ episodes: Episode[] }> {
  return request("/api/v1/factory/scripts:plan", {
    method: "POST",
    body: JSON.stringify({ chapters, episode_seconds: episodeSeconds }),
  });
}

/** 钩子检测（全量 + Top-N + 首镜钩子裁决） */
export function detectHooks(text: string): Promise<HooksResult> {
  return request("/api/v1/factory/scripts/hooks:detect", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

/** 剧本结构化结果（页面视图模型，保持 ScriptEditor 既有渲染契约） */
export interface ScriptResult {
  characters: string[];
  scenes: string[];
  hooks: string[];
  /** 分集建议（每集标题与梗概） */
  episode_suggestions: Array<{ title: string; synopsis: string }>;
}

/**
 * 一键结构化解析：组合 要素抽取 + 钩子检测 + 章节切分 + 集数规划
 * （M2 起替代 M0 骨架的幻影端点 /api/v1/script/generate）
 */
export async function analyzeScript(input: {
  novel_text: string;
  project_id: string;
}): Promise<ScriptResult> {
  const [elements, hooksRes, split] = await Promise.all([
    extractElements(input.novel_text, 10),
    detectHooks(input.novel_text),
    splitChapters(input.novel_text, 300),
  ]);
  const plan = await planEpisodes(split.chapters, 105);

  return {
    characters: elements.characters.map((c) => c.name),
    scenes: elements.scenes.map((s) => s.name),
    hooks: hooksRes.top.map((h) => h.sentence),
    episode_suggestions: plan.episodes.map((ep) => ({
      title: `${ep.episode_id}：${ep.episode_title}`,
      synopsis:
        ep.content.length > 60 ? `${ep.content.slice(0, 60)}…` : ep.content,
    })),
  };
}
