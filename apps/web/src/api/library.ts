/**
 * 产线库域 API（M3 · 剧本库/资产库/批量生产；M5 端点落地）
 * M5：三端点真落地（library_docs 表；空表由后端 app/seeds 灌演示种子，
 *      业务流登记接入后数据自然更替）；withFallback 保留作网络失败兜底
 * M5-R6 修复：列表端点统一 {items} 信封解包（对齐 project/publish/task 服务层惯例）——
 *      缺解包导致联通真后端时 .map 运行时崩溃（dev 视觉留证暴露，typecheck/build 不覆盖）
 */
import { request } from "@/api/client";
import type { AssetItem, BatchItem, ScriptItem } from "@/types/domain";

/** 剧本库列表（{items} 信封解包） */
export async function listScripts(): Promise<ScriptItem[]> {
  const res = await request<{ items: ScriptItem[] }>("/api/v1/factory/library/scripts");
  return res.items ?? [];
}

/** 剧本库详情（单对象无信封） */
export function getScript(scriptId: string): Promise<ScriptItem> {
  return request<ScriptItem>(
    `/api/v1/factory/library/scripts/${encodeURIComponent(scriptId)}`
  );
}

/** 资产库列表（{items} 信封解包） */
export async function listAssets(): Promise<AssetItem[]> {
  const res = await request<{ items: AssetItem[] }>("/api/v1/factory/library/assets");
  return res.items ?? [];
}

/** 批量生产条目（{items} 信封解包） */
export async function listBatchItems(): Promise<BatchItem[]> {
  const res = await request<{ items: BatchItem[] }>("/api/v1/factory/production/batch");
  return res.items ?? [];
}
