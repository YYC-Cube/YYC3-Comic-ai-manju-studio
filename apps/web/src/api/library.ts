/**
 * 产线库域 API（M3 · 剧本库/资产库/批量生产；M5 端点落地）
 * M5：三端点真落地（library_docs 表；空表由后端 app/seeds 灌演示种子，
 *      业务流登记接入后数据自然更替）；withFallback 保留作网络失败兜底
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
