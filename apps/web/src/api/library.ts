/**
 * 产线库域 API（M3 · 剧本库/资产库/批量生产）
 * TODO(M5)：后端库域持久化端点未落地（M1 仅工厂引擎域 + 管理域），
 *           当前请求 404 时由页面层 withFallback/useApiData 降级 mock 演示数据；
 *           端点路径按 YYC3-78 治理预留（/api/v1/factory/library/*），后端就绪后零改动切换
 */
import { request } from "@/api/client";
import type { AssetItem, BatchItem, ScriptItem } from "@/types/domain";

/** 剧本库列表 */
export function listScripts(): Promise<ScriptItem[]> {
  return request<ScriptItem[]>("/api/v1/factory/library/scripts");
}

/** 剧本库详情 */
export function getScript(scriptId: string): Promise<ScriptItem> {
  return request<ScriptItem>(
    `/api/v1/factory/library/scripts/${encodeURIComponent(scriptId)}`
  );
}

/** 资产库列表 */
export function listAssets(): Promise<AssetItem[]> {
  return request<AssetItem[]>("/api/v1/factory/library/assets");
}

/** 批量生产条目 */
export function listBatchItems(): Promise<BatchItem[]> {
  return request<BatchItem[]>("/api/v1/factory/production/batch");
}
