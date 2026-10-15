"use client";

/**
 * 五态视图状态解析器（M2 · 原型五态模拟体系的服务端驱动版）
 * normal / empty / loading / error / forbidden —— 由真实响应状态驱动，
 * 替代原型时期的页面级 props 模拟（gap 分析摩擦点 #3 的落地形态）
 */
import { ApiError } from "@/api/client";

export type ViewState = "normal" | "empty" | "loading" | "error" | "forbidden";

export interface ViewStateInput {
  loading: boolean;
  error: unknown;
  /** null 表示非列表场景（不参与 empty 判定） */
  itemCount: number | null;
}

export function resolveViewState({
  loading,
  error,
  itemCount,
}: ViewStateInput): ViewState {
  if (loading) return "loading";
  if (error) {
    if (error instanceof ApiError && error.status === 403) return "forbidden";
    return "error";
  }
  if (itemCount !== null && itemCount === 0) return "empty";
  return "normal";
}

/** 错误的人话摘要（页面统一文案入口） */
export function viewStateMessage(state: ViewState, error?: unknown): string {
  switch (state) {
    case "loading":
      return "加载中…";
    case "empty":
      return "暂无数据";
    case "forbidden":
      return "无权限访问该资源（403）";
    case "error":
      return error instanceof Error ? error.message : "请求失败";
    default:
      return "";
  }
}
