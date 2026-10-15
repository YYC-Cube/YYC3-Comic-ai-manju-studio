/**
 * 分镜状态：当前分镜、本地校验结果、镜头局部更新
 */
import { create } from "zustand";
import {
  getStoryboard,
  updateShot as apiUpdateShot,
  validateRemote,
} from "@/api/storyboard";
import { withFallback } from "@/api/client";
import { mockStoryboard } from "@/lib/mock-data";
import { validateStoryboard, type Shot, type StoryboardV1 } from "@/types/storyboard";

interface StoryboardState {
  storyboard: StoryboardV1 | null;
  validationErrors: string[];
  /** 远程校验引擎给出的非阻断性提示（M2 · 含 YYC3-74 G3 护栏等引擎规则） */
  remoteWarnings: string[];
  /** 最近一次校验来源：远程引擎 or 本地降级 */
  validationSource: "remote" | "local";
  loading: boolean;
  isMock: boolean;
  /** 拉取分镜并自动校验（优先远程引擎规则，失败降级本地结构校验） */
  load: (projectId: string) => Promise<void>;
  /** 更新镜头：先改本地，再尝试 PATCH 后端（失败静默，保持本地态） */
  updateShot: (shotId: string, patch: Partial<Shot>) => Promise<void>;
  /** 重新执行本地校验 */
  revalidate: () => void;
}

export const useStoryboardStore = create<StoryboardState>((set, get) => ({
  storyboard: null,
  validationErrors: [],
  remoteWarnings: [],
  validationSource: "local",
  loading: false,
  isMock: false,

  load: async (projectId) => {
    set({ loading: true });
    const { data, isMock } = await withFallback(
      () => getStoryboard(projectId),
      () => ({ ...mockStoryboard, project_id: projectId })
    );
    // 远程引擎校验优先（含 G3 护栏 / 钩子矛盾 / 节奏窗口），失败降级本地结构校验
    const { data: validation, isMock: localOnly } = await withFallback(
      () => validateRemote(data),
      () => ({
        valid: validateStoryboard(data).length === 0,
        errors: validateStoryboard(data),
        warnings: [] as string[],
      })
    );
    set({
      storyboard: data,
      isMock,
      loading: false,
      validationErrors: validation.errors,
      remoteWarnings: validation.warnings,
      validationSource: localOnly ? "local" : "remote",
    });
  },

  updateShot: async (shotId, patch) => {
    const sb = get().storyboard;
    if (!sb) return;

    // 乐观更新本地
    const shots = sb.shots.map((s) =>
      s.shot_id === shotId ? { ...s, ...patch } : s
    );
    const next: StoryboardV1 = {
      ...sb,
      shots,
      total_shots: shots.length,
      updated_at: new Date().toISOString(),
    };
    set({
      storyboard: next,
      validationErrors: validateStoryboard(next),
    });

    // 同步后端：失败保持本地态但留痕（P3 修复 2026-10-05：不再完全静默）
    try {
      await apiUpdateShot(sb.episode_id, shotId, patch);
    } catch (err) {
      console.warn(
        `[storyboard] 镜头 ${shotId} 后端同步失败，保持本地态：`,
        err instanceof Error ? err.message : err
      );
    }
  },

  revalidate: () => {
    const sb = get().storyboard;
    set({ validationErrors: sb ? validateStoryboard(sb) : [] });
  },
}));
