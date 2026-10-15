/**
 * StoryboardV1 ↔ UI 视图模型 适配器（M2 · D2 三层 Schema 治理落地）
 *
 * 职责：
 * 1. 协议（snake_case 单字枚举）↔ UI（camelCase 全称枚举）双向映射
 * 2. 枚举映射全表集中定义（唯一事实源，禁止散写）
 * 3. V1.1 待扩展值（俯仰/环绕）在适配边界显式拒绝并指向提案通道
 * 4. 生产态字段（negativePrompt/seed/motionStrength/status 等）属
 *    ShotProductionState，不进入协议（fromUiShot 丢弃并留证）
 */
import type { CameraMove, Shot, ShotType, StoryboardV1 } from "@/types/storyboard";

/* ------------------------------ UI 视图模型（对齐原型 src/types/production.ts） ------------------------------ */

/** UI 景别全称枚举（原型口径） */
export const UI_SHOT_SIZES = ["特写", "近景", "中景", "全景", "远景"] as const;
export type UiShotSize = (typeof UI_SHOT_SIZES)[number];

/** UI 运镜全称枚举（原型口径 + D2 补充：摇镜头/固定镜头，来自 V1 的 摇/固定） */
export const UI_CAMERA_MOVES = [
  "推镜头",
  "拉镜头",
  "摇镜头",
  "移镜头",
  "跟镜头",
  "固定镜头",
  "俯仰",
  "环绕",
] as const;
export type UiCameraMove = (typeof UI_CAMERA_MOVES)[number];

/** V1.1 待扩展值（H3 E2 勘察包提案通道；进入契约前不得上协议） */
export const PENDING_V1_1_MOVES: ReadonlySet<string> = new Set(["俯仰", "环绕"]);

/** 适配器错误：携带字段与值，页面可据此给出精确提示 */
export class AdapterError extends Error {
  readonly field: string;
  readonly value: string;

  constructor(field: string, value: string, message: string) {
    super(message);
    this.name = "AdapterError";
    this.field = field;
    this.value = value;
  }
}

/** UI 镜头视图模型（原型 StoryboardShot 口径；生产态字段可选） */
export interface ShotUI {
  id: string;
  sceneId: string;
  description: string;
  shotSize: UiShotSize;
  cameraMove: UiCameraMove;
  dialogue: string;
  durationSec: number;
  prompt: string;
  sfx: string;
  bgm: string;
  hookFlag: boolean;
  consistencyAnchor: string;
  /* 生产态字段（ShotProductionState，不入协议） */
  negativePrompt?: string;
  status?: "pending" | "generating" | "passed" | "rejected";
  rejectReason?: string;
  consistencyScore?: number;
  confidence?: number;
  thumbnailUrl?: string;
  seed?: number;
  motionStrength?: number;
}

/** UI 分镜视图模型 */
export interface StoryboardUI {
  version: string;
  projectId: string;
  episodeId: string;
  episodeTitle: string;
  styleRef: string;
  characterRefs: string[];
  totalShots: number;
  hookShots: string[];
  shots: ShotUI[];
  createdAt: string;
  updatedAt: string;
  traceId: string;
}

/* ------------------------------ 枚举映射全表（唯一事实源） ------------------------------ */

const SHOT_SIZE_TO_PROTOCOL: Record<UiShotSize, ShotType> = {
  特写: "特",
  近景: "近",
  中景: "中",
  全景: "全",
  远景: "远",
};
const SHOT_SIZE_FROM_PROTOCOL: Record<ShotType, UiShotSize> = {
  特: "特写",
  近: "近景",
  中: "中景",
  全: "全景",
  远: "远景",
};

/** 运镜：UI 全称 → 协议单字（俯仰/环绕走 V1.1 拒绝通道） */
const CAMERA_MOVE_TO_PROTOCOL: Record<Exclude<UiCameraMove, "俯仰" | "环绕">, CameraMove> = {
  推镜头: "推",
  拉镜头: "拉",
  摇镜头: "摇",
  移镜头: "移",
  跟镜头: "跟",
  固定镜头: "固定",
};
/** 运镜：协议单字 → UI 全称（导出供覆盖性检查与调试用） */
export const CAMERA_MOVE_FROM_PROTOCOL: Record<CameraMove, UiCameraMove> = {
  推: "推镜头",
  拉: "拉镜头",
  摇: "摇镜头",
  移: "移镜头",
  跟: "跟镜头",
  固定: "固定镜头",
};

export function shotSizeToProtocol(v: UiShotSize): ShotType {
  return SHOT_SIZE_TO_PROTOCOL[v];
}
export function shotSizeFromProtocol(v: ShotType): UiShotSize {
  return SHOT_SIZE_FROM_PROTOCOL[v];
}
export function cameraMoveToProtocol(v: UiCameraMove): CameraMove {
  if (PENDING_V1_1_MOVES.has(v)) {
    throw new AdapterError(
      "cameraMove",
      v,
      `运镜「${v}」为 V1.1 待扩展值：进入 StoryboardV1.1 契约前不得上协议（H3 E2 提案通道）`
    );
  }
  return CAMERA_MOVE_TO_PROTOCOL[v as Exclude<UiCameraMove, "俯仰" | "环绕">];
}
export function cameraMoveFromProtocol(v: CameraMove): UiCameraMove {
  return CAMERA_MOVE_FROM_PROTOCOL[v];
}

/* ------------------------------ 双向转换 ------------------------------ */

/** 协议镜头 → UI 视图模型 */
export function toUiShot(shot: Shot): ShotUI {
  return {
    id: shot.shot_id,
    sceneId: shot.scene_id,
    description: shot.description,
    shotSize: shotSizeFromProtocol(shot.shot_type),
    cameraMove: cameraMoveFromProtocol(shot.camera_move),
    dialogue: shot.dialogue,
    durationSec: shot.duration_sec,
    prompt: shot.image_prompt,
    sfx: shot.sfx,
    bgm: shot.bgm,
    hookFlag: shot.hook_flag,
    consistencyAnchor: shot.consistency_anchor,
  };
}

/**
 * UI 视图模型 → 协议镜头
 * 注意：生产态字段（negativePrompt/seed/motionStrength/status 等）按 D2 裁决
 *       不进入协议，本函数丢弃（ShotProductionState 由生产态存储承担）
 */
export function fromUiShot(ui: ShotUI): Shot {
  return {
    shot_id: ui.id,
    scene_id: ui.sceneId,
    description: ui.description,
    shot_type: shotSizeToProtocol(ui.shotSize),
    camera_move: cameraMoveToProtocol(ui.cameraMove),
    dialogue: ui.dialogue,
    duration_sec: ui.durationSec,
    image_prompt: ui.prompt,
    sfx: ui.sfx,
    bgm: ui.bgm,
    hook_flag: ui.hookFlag,
    consistency_anchor: ui.consistencyAnchor,
  };
}

/** 协议分镜 → UI 视图模型 */
export function toUiStoryboard(sb: StoryboardV1): StoryboardUI {
  return {
    version: sb.version,
    projectId: sb.project_id,
    episodeId: sb.episode_id,
    episodeTitle: sb.episode_title,
    styleRef: sb.style_ref,
    characterRefs: sb.character_refs,
    totalShots: sb.total_shots,
    hookShots: sb.hook_shots,
    shots: sb.shots.map(toUiShot),
    createdAt: sb.created_at,
    updatedAt: sb.updated_at,
    traceId: sb.trace_id,
  };
}

/** UI 视图模型 → 协议分镜 */
export function fromUiStoryboard(ui: StoryboardUI): StoryboardV1 {
  return {
    version: ui.version,
    project_id: ui.projectId,
    episode_id: ui.episodeId,
    episode_title: ui.episodeTitle,
    style_ref: ui.styleRef,
    character_refs: ui.characterRefs,
    total_shots: ui.totalShots,
    hook_shots: ui.hookShots,
    shots: ui.shots.map(fromUiShot),
    created_at: ui.createdAt,
    updated_at: ui.updatedAt,
    trace_id: ui.traceId,
  };
}
