/**
 * 渲染导出域 API（M4 · 剪辑域）
 * TODO(M5)：后端导出队列端点未落地（M1 仅 POST /videos:render 提交渲染），
 *           列表请求 404 时由页面层 withFallback 降级演示队列；
 *           端点路径按 YYC3-78 治理预留（/api/v1/factory/video/exports），后端就绪后零改动切换
 */
import { request } from "@/api/client";

/** 导出任务状态 */
export type ExportTaskStatus = "queued" | "rendering" | "completed" | "failed";

/** 渲染导出任务 */
export interface ExportTask {
  id: string;
  title: string;
  /** 如 3840×2160 (16:9) */
  resolution: string;
  /** 如 45 Mbps · HEVC */
  bitrate: string;
  /** 0-100 */
  progress: number;
  status: ExportTaskStatus;
  /** 渲染耗时，如 01m 20s */
  duration: string;
  /** 硬件加速标签，如 NVENC 硬件加速 */
  hwTag: string;
  /** 产物体积，如 280 MB */
  size: string;
}

/** 导出任务队列（幻影端点，withFallback 降级） */
export function listExportTasks(): Promise<ExportTask[]> {
  return request<ExportTask[]>("/api/v1/factory/video/exports");
}
