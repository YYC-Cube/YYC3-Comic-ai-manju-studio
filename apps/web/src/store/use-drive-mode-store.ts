"use client";

/**
 * 驾驶模式全局状态（M3 · 原型壳层注入的 driveMode 收编为 zustand store）
 * 默认 L1 半自动（协同范式）；script-detail / production / tasks 页共享
 */
import { create } from "zustand";
import type { DriveModeId } from "@/types/domain";

interface DriveModeState {
  driveMode: DriveModeId;
  setDriveMode: (mode: DriveModeId) => void;
}

export const useDriveModeStore = create<DriveModeState>((set) => ({
  driveMode: "L1",
  setDriveMode: (driveMode) => set({ driveMode }),
}));
