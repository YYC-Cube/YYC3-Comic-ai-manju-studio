/**
 * 生产任务 API（M2 真实端点 + M3 遗留收敛）
 * 真实可用（M1/M2 后端）：入队 / 状态查询 / 近期登记
 * 遗留 listTasks / subscribeTaskStream：use-task-store 消费中，幻影端点由 withFallback 降级，
 *   TODO(M4) 业务形状列表与 SSE 流端点随真实遥测落地后切换 /factory/tasks 域
 * M3 退役：getTask（零消费，详情由 getTaskStatus 承接）
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

/* -------------------- 遗留骨架（TODO M3，勿在联通期调用真实路径） -------------------- */

/** 任务列表（可按项目过滤）—— TODO(M3) 业务形状对齐后切换 /factory/tasks */
export function listTasks(projectId?: string): Promise<ProductionTask[]> {
  const query = projectId
    ? `?project_id=${encodeURIComponent(projectId)}`
    : "";
  return request<ProductionTask[]>(`/api/v1/tasks${query}`);
}

/** 任务详情 —— TODO(M3) */
export function getTask(taskId: string): Promise<ProductionTask> {
  return request<ProductionTask>(
    `/api/v1/tasks/${encodeURIComponent(taskId)}`
  );
}

/**
 * 订阅任务进度 SSE 流 —— TODO(M3) 后端流端点落地后切换
 * 返回 close 函数用于组件卸载时断开连接
 */
export function subscribeTaskStream(
  projectId: string,
  onEvent: (task: ProductionTask) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  const url = `${API_BASE}/api/v1/tasks/stream?project_id=${encodeURIComponent(projectId)}`;
  const source = new EventSource(url);

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
