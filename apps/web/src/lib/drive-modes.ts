/**
 * 驾驶模式与置信度元数据（M3 · 迁移自 MiniMax-3 原型 src/tokens）
 * 颜色以 tailwind 语义类表达（不再硬编码 hex），组件消费 tone 映射
 */
import type { DriveModeId } from "@/types/domain";

export interface DriveModeInfo {
  id: DriveModeId;
  name: string;
  /** 语义色调：组件内映射为 tailwind 类 */
  tone: "teal" | "sky" | "amber";
  desc: string;
  tag: string;
}

export const DRIVE_MODES: Record<DriveModeId, DriveModeInfo> = {
  L0: {
    id: "L0",
    name: "全自动",
    tone: "teal",
    desc: "Agent 自主完成，关键决策 5s 内撤销，人工只看结果",
    tag: "AUTONOMOUS",
  },
  L1: {
    id: "L1",
    name: "半自动",
    tone: "sky",
    desc: "置信度 < 0.9 自动阻塞，关键节点由人工确认与裁决",
    tag: "HUMAN-IN-THE-LOOP",
  },
  L2: {
    id: "L2",
    name: "人工主导",
    tone: "amber",
    desc: "Agent 仅提供方案建议与数据分析，执行权完全归属人类",
    tag: "HUMAN-DIRECTED",
  },
};

export type ConfidenceLevel = "high" | "mid" | "low";

export interface ConfidenceMeta {
  level: ConfidenceLevel;
  tone: "emerald" | "amber" | "red";
  label: string;
  tag: "PASS" | "REVIEW" | "INTERVENE";
  desc: string;
}

/** 置信度三档元数据（≥0.9 高 / ≥0.6 中 / 低） */
export function getConfidenceMeta(confidence: number): ConfidenceMeta {
  if (confidence >= 0.9) {
    return { level: "high", tone: "emerald", label: "高置信", tag: "PASS", desc: "建议直接采纳/自动流转" };
  }
  if (confidence >= 0.6) {
    return { level: "mid", tone: "amber", label: "中置信", tag: "REVIEW", desc: "需人工快速复核" };
  }
  return { level: "low", tone: "red", label: "低置信", tag: "INTERVENE", desc: "需人工重构或触发议事厅" };
}
