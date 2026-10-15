/**
 * 推送分发域 API（M4 · P1 推送域）
 * 后端实况：M1 骨架——GET accounts/matrix 返回 200 空集 + note 阶段标注；
 *           POST jobs 501（推送队列随 M5 落地）。
 *           页面层对空集渲染诚实空态（不降级伪造演示数据）；提交动作对 501 显式报错提示
 */
import { request } from "@/api/client";

/** 平台键（五平台矩阵） */
export type PlatformKey = "douyin" | "channels" | "bilibili" | "kuaishou" | "xiaohongshu";

/** 平台账号授权状态 */
export type AuthStatus = "active" | "expiring" | "expired";

/** 矩阵账号 */
export interface PublishAccount {
  id: string;
  platformKey: PlatformKey;
  platformName: string;
  accountName: string;
  group: string;
  /** 粉丝数（展示串，如 12.4w） */
  followers: string;
  /** 发布成功率 0-100 */
  successRate: number;
  /** 预见·先知 掉线风险 % */
  predictOfflineRisk: number;
  /** 凭证剩余有效天数 */
  expireDays: number;
  authStatus: AuthStatus;
}

/** 单平台发布目标状态 */
export interface PublishTarget {
  status: "unassigned" | "queued" | "transcoding" | "published" | "rejected";
  views?: number;
  rejectCode?: string;
  rejectReason?: string;
  suggestedFix?: string;
}

/** 发布看板矩阵行 */
export interface PublishMatrixRow {
  filmId: string;
  filmTitle: string;
  thumbnail?: string;
  targets: Partial<Record<PlatformKey, PublishTarget>>;
}

interface ListEnvelope<T> {
  items: T[];
  note?: string;
}

/** 矩阵账号列表（骨架阶段返回空集） */
export async function listPublishAccounts(): Promise<PublishAccount[]> {
  const res = await request<ListEnvelope<PublishAccount>>("/api/v1/publishing/accounts");
  return res.items ?? [];
}

/** 发布看板矩阵（骨架阶段返回空集） */
export async function listPublishMatrix(): Promise<PublishMatrixRow[]> {
  const res = await request<ListEnvelope<PublishMatrixRow>>("/api/v1/publishing/matrix");
  return res.items ?? [];
}

/** 提交分发任务（骨架阶段 501，页面层显式报错提示） */
export function enqueuePublishJob(payload: {
  platforms: PlatformKey[];
  title: string;
}): Promise<{ jobId?: string }> {
  return request<{ jobId?: string }>("/api/v1/publishing/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
