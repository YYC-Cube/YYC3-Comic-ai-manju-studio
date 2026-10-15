/**
 * 产线领域模型（M3 · 迁移自 MiniMax-3 原型 src/types/production.ts + tasks.ts）
 * 注意：产线镜头视图 ProductionShot 含生产态字段（seed/status/consistencyScore 等），
 *       上协议必须经 storyboard-adapter 裁剪（D2 裁决：生产态字段不进 StoryboardV1）
 */
import type { GateLevel } from "@/lib/gates";

/** 驱动模式：L0 全自动 / L1 协同（默认） / L2 人工 */
export type DriveModeId = "L0" | "L1" | "L2";

/** 剧本库条目 */
export interface ScriptItem {
  id: string;
  title: string;
  genre: "都市" | "古风" | "悬疑" | "甜宠" | "科幻";
  wordCount: number;
  characterCount: number;
  sceneCount: number;
  /** 世界观图谱完备度 0-100% */
  loreCompleteness: number;
  stage: string;
  gateLevel: GateLevel;
  lastEdited: string;
  synopsis: string;
  characters: { name: string; avatar: string; roleDesc: string; refTrained: boolean }[];
  scenes: { name: string; type: string; lighting: string }[];
}

/** 产线镜头（原型 StoryboardShot 口径；UI 视图模型，非协议） */
export interface ProductionShot {
  id: string;
  /** 镜头编号，如 'S01-01' */
  shotNumber: string;
  shotSize: "特写" | "近景" | "中景" | "全景" | "远景";
  /** 含 V1.1 待扩展值「俯仰/环绕」——UI 可显示，上协议时适配器显式拒绝 */
  cameraMove: "推镜头" | "拉镜头" | "摇镜头" | "移镜头" | "跟镜头" | "固定镜头" | "俯仰" | "环绕";
  visualDesc: string;
  character: string;
  scene: string;
  dialogue: string;
  durationSec: number;
  prompt: string;
  negativePrompt: string;
  assetBinding: string;
  status: "pending" | "generating" | "passed" | "rejected";
  rejectReason?: string;
  /** 一致性评分 0-100%（G2 红线 80） */
  consistencyScore: number;
  /** 置信度 0-1.0 */
  confidence: number;
  thumbnailUrl: string;
  seed: number;
  motionStrength: number;
}

/** 资产库条目 */
export interface AssetItem {
  id: string;
  name: string;
  type: "character" | "scene" | "prop" | "style" | "template";
  tags: string[];
  version: string;
  usageCount: number;
  consistencyTrained: boolean;
  consistencyScore: number;
  previewUrl: string;
  /** 是否一致性 Ref 卡 */
  refCard: boolean;
  dualFormContract?: { mainForm: string; altForm: string };
  evolutionStage: "定妆照" | "角色板" | "多视图" | "LoRA资产包";
  loraRank?: number;
  referenceImages: string[];
}

/** 批量生产条目 */
export interface BatchItem {
  shotId: string;
  shotNumber: string;
  thumbnail: string;
  /** SyncNet 音画同步分（≥ SYNCNET_PASS 达标） */
  syncNetScore: number;
  duration: number;
  confidence: number;
  status: "passed" | "review" | "failed";
  sampleFlagged: boolean;
  /** 预估成本（元） */
  costEstimated: number;
  /** 渲染耗时（秒） */
  renderTime: number;
}

/** 任务中心 ReAct-C 步迹记录 */
export interface TaskRecord {
  id: string;
  type: "视频生成" | "硬件渲染" | "音画转码" | "多端分发" | "知识库抽取";
  projectId: string;
  projectName: string;
  submittedAt: string;
  duration: string;
  progress: number;
  status: "running" | "completed" | "failed" | "paused";
  driveMode: DriveModeId;
  confidence: number;
  hasLearningSample: boolean;
  /** 当前步（1-9 in ReAct-C） */
  currentStep: number;
  stepsTrace: {
    step: number;
    name: string;
    agentId: string;
    durationMs: number;
    confidence: number;
    status: "success" | "running" | "failed" | "pending" | "loopback";
    errorSummary?: string;
  }[];
}
