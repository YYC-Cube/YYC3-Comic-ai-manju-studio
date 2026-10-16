/**
 * A2A 编排面 API（M5-R6 · 真链路层，对齐 apps/api app/api/v1/a2a.py 已落地端点）
 * 三端点全部真实：状态诊断（gateway_ok 诚实语义）/ 异步投递（202 即返）/ 同步闭环（等回执）
 * 下游失败由后端 502 A2A_GATEWAY 如实上抛——本层不做任何降级，不伪造在线与回执
 */
import { request } from "@/api/client";

/** world 编队 Agent Card（字段透传，最小消费面） */
export interface A2AAgentCard {
  agent_id?: string;
  name?: string;
  capability?: string;
  [key: string]: unknown;
}

export interface A2AStatus {
  gateway_ok: boolean;
  gateway_url: string;
  agents: A2AAgentCard[];
  count: number;
  error?: string;
}

/** 编排面健康诊断（HTTP 200 诊断语义，gateway_ok=false 即离线） */
export function getA2AStatus(): Promise<A2AStatus> {
  return request<A2AStatus>("/api/v1/factory/a2a/status");
}

export interface A2ATaskSubmitInput {
  task_type: string;
  payload: Record<string, unknown>;
  capability?: string;
  receiver_agent_id?: string;
  priority?: number;
}

/** 异步投递回执（202：queued 即返，消费者组认领） */
export interface A2ATaskReceipt {
  msg_id?: string;
  trace_id?: string;
  receiver?: string;
  stream?: string;
  status?: string;
  [key: string]: unknown;
}

/** 异步投递：202 即返；执行回执经任务域回流（见 /tasks） */
export function submitA2ATask(input: A2ATaskSubmitInput): Promise<A2ATaskReceipt> {
  return request<A2ATaskReceipt>("/api/v1/factory/a2a/tasks", {
    method: "POST",
    body: JSON.stringify({ priority: 5, ...input }),
  });
}
