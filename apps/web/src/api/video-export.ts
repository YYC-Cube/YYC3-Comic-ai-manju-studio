/**
 * 渲染导出域 API（M4 新建 / M5 端点落地）
 * M5：GET/POST /api/v1/factory/videos/exports 真端点（export_tasks 表）；
 *     新建任务 queued 态（转码 worker 未接，进度/体积不伪造推进，FFmpeg 管线接入后回写）；
 *     withFallback 保留作网络失败兜底
 */
import { request } from "@/api/client";

/** 导出任务状态 */
export type ExportTaskStatus = "queued" | "rendering" | "completed" | "failed";

/** 渲染导出任务 */
export interface ExportTask {
  id: string;
  title: string;
  /** 如 3840×2160 (16:9)；M5 创建态为预设值（1080p/4K/720p） */
  resolution: string;
  /** 如 45 Mbps · HEVC；转码 worker 评估前为占位说明 */
  bitrate: string;
  /** 0-100 */
  progress: number;
  status: ExportTaskStatus;
  /** 渲染耗时，如 01m 20s */
  duration: string;
  /** 硬件加速标签 */
  hwTag: string;
  /** 产物体积 */
  size: string;
  /** 封装格式（M5 新增） */
  format?: string;
}

/** 导出任务队列（真端点，{items} 信封解包） */
export async function listExportTasks(): Promise<ExportTask[]> {
  const res = await request<{ items: ExportTask[] }>("/api/v1/factory/videos/exports");
  return res.items ?? [];
}

/** 新建批量导出任务（201，EXP-NNN 序号，queued 态） */
export function createExportTask(payload: {
  title: string;
  resolution: string;
  format: string;
}): Promise<ExportTask> {
  return request<ExportTask>("/api/v1/factory/videos/exports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
