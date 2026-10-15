/**
 * 生产任务 API（M2 真实端点 + M5 真遥测切换）
 * 真实可用：入队 / 状态查询 / 近期登记 / board 业务形状列表 / SSE stream 实时推送
 * M5：listTasks/subscribeTaskStream 由幻影端点切换 /factory/tasks/{board,stream}
 *   （registry + AsyncResult → ProductionTask；进度按状态阶粗粒度映射不伪造；
 *     九步步迹仍由前端确定性推导——引擎未产出步迹数据，tasks 页「步迹演示」Badge 保留）
 */
import { API_BASE, request } from "@/api/client";
import type { ProductionTask } from "@/types/task";

/* -------------------- M2 真实端点 -------------------- */

export type TaskType = "image" | "audio" | "video" | "render";

export interface EnqueueResult {
  task_id: string;
  task_type: TaskType;
  status: "QUEUED";
}

export interface TaskStatusResult {
  task_id: string;
  state: string; // PENDING | STARTED | SUCCESS | FAILURE | ...
  result?: unknown;
  error?: string;
}

/** 任务入队（四队列：image/audio/video/render） */
export function enqueueTask(
  taskType: TaskType,
  payload: Record<string, unknown>
): Promise<EnqueueResult> {
  return request<EnqueueResult>("/api/v1/factory/tasks", {
    method: "POST",
    body: JSON.stringify({ task_type: taskType, payload }),
  });
}

/** 任务状态/结果查询（Celery 结果后端） */
export function getTaskStatus(taskId: string): Promise<TaskStatusResult> {
  return request<TaskStatusResult>(
    `/api/v1/factory/tasks/${encodeURIComponent(taskId)}`
  );
}

/** 近期入队登记（开发态，进程内存） */
export function listRecentTasks(): Promise<{ items: unknown[]; note: string }> {
  return request("/api/v1/factory/tasks");
}

/* -------------------- M5 真遥测（board + SSE stream） -------------------- */

/** 任务列表（可按项目过滤）—— M5 起切真：GET /factory/tasks/board（ProductionTask[]） */
export async function listTasks(projectId?: string): Promise<ProductionTask[]> {
  const query = projectId
    ? `?project_id=${encodeURIComponent(projectId)}`
    : "";
  const res = await request<{ items: ProductionTask[] }>(
    `/api/v1/factory/tasks/board${query}`
  );
  return res.items ?? [];
}

/**
 * 订阅任务进度 SSE 流 —— M5 起切真：GET /factory/tasks/stream（2s 快照比对，变化即推）
 * 跨源携带会话 Cookie（withCredentials）；返回 close 函数用于组件卸载时断开连接
 */
export function subscribeTaskStream(
  projectId: string,
  onEvent: (task: ProductionTask) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  const url = `${API_BASE}/api/v1/factory/tasks/stream?project_id=${encodeURIComponent(projectId)}`;
  const source = new EventSource(url, { withCredentials: true });

  source.onopen = () => onStatusChange?.(true);

  source.onmessage = (event: MessageEvent<string>) => {
    try {
      const task = JSON.parse(event.data) as ProductionTask;
      onEvent(task);
    } catch {
      // 单条消息解析失败不影响流，忽略
    }
  };

  source.onerror = () => onStatusChange?.(false);

  return () => source.close();
}
