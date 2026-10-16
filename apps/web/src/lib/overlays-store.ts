"use client";

/**
 * 全局浮层状态机（M5-R6 · zustand）
 * 三件浮层：W1 协同中枢（右下角浮窗）/ W2 认知浮窗（与 W1 互斥切换）/ 议事厅模态（独立叠加层）
 * 原型 App.tsx overlays/actions 接线（useOverlays hook）的 store 化收敛——全局单源，页面与浮层解耦
 */
import { create } from "zustand";
import { DEFAULT_AGENT_ID } from "@/lib/agents";

interface OverlaysState {
  /** W1 协同中枢浮窗展开态（收起为右下角悬浮球） */
  w1Open: boolean;
  /** W2 认知浮窗展开态（与 W1 互斥） */
  w2Open: boolean;
  /** W2 当前聚焦 Agent（由 W1 切换或 admin/agents「查看轨迹」指定） */
  w2AgentId: string;
  /** 议事厅模态展开态（独立叠加，不与 W1/W2 互斥） */
  counselOpen: boolean;

  toggleW1: () => void;
  /** 打开 W2 并聚焦指定 Agent（打开时收起 W1，对齐原型互斥语义） */
  openW2: (agentId?: string) => void;
  closeW2: () => void;
  /** W2 切回 W1 标准助理视图 */
  switchToW1: () => void;
  openCounsel: () => void;
  closeCounsel: () => void;
}

export const useOverlaysStore = create<OverlaysState>((set) => ({
  w1Open: false,
  w2Open: false,
  w2AgentId: DEFAULT_AGENT_ID,
  counselOpen: false,

  toggleW1: () => set((s) => ({ w1Open: !s.w1Open, w2Open: false })),
  openW2: (agentId) =>
    set((s) => ({
      w2Open: true,
      w1Open: false,
      w2AgentId: agentId ?? s.w2AgentId,
    })),
  closeW2: () => set({ w2Open: false }),
  switchToW1: () => set({ w2Open: false, w1Open: true }),
  openCounsel: () => set({ counselOpen: true }),
  closeCounsel: () => set({ counselOpen: false }),
}));
