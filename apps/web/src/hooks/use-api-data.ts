"use client";

/**
 * 域服务数据装载 Hook（M3 · 移植自 MiniMax-3 原型 api/useApiData，快照降级保留）
 * 统一「真实请求 + 离线快照降级」异步取数模式：
 * - 成功即写 localStorage 快照（snapshotKey 版本化）
 * - 网络失败自动降级读最近成功快照（degraded=true），无快照才落 error
 * - 与 withFallback 的关系：withFallback 管「mock 演示数据降级」（服务层），
 *   useApiData 管「快照降级」（页面层）；两者可叠加，页面侧 degraded 徽章留痕
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/api/client";

export interface ApiDataState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** true 表示当前数据来自离线快照（网络失败降级），非实时结果 */
  degraded: boolean;
  /** 手动重试（ErrorState 恢复动作单源） */
  retry: () => void;
}

const SNAPSHOT_KEY_PREFIX = "yyc3:snapshot:";

function readSnapshot<T>(key: string): T | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(SNAPSHOT_KEY_PREFIX + key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn("[useApiData] 快照解析失败，回落 error 态：", key);
    return null;
  }
}

function writeSnapshot(key: string, data: unknown) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SNAPSHOT_KEY_PREFIX + key, JSON.stringify(data));
  } catch {
    console.warn("[useApiData] 快照写入失败（存储配额或隐私模式）：", key);
  }
}

export function useApiData<T>(
  loader: () => Promise<T>,
  options: { snapshotKey?: string } = {}
): ApiDataState<T> {
  const [state, setState] = useState<Omit<ApiDataState<T>, "retry">>({
    data: null,
    loading: true,
    error: null,
    degraded: false,
  });
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef.current().then(
      (data) => {
        if (!active) return;
        setState({ data, loading: false, error: null, degraded: false });
        if (options.snapshotKey) writeSnapshot(options.snapshotKey, data);
      },
      (error) => {
        if (!active) return;
        if (options.snapshotKey) {
          const snapshot = readSnapshot<T>(options.snapshotKey);
          if (snapshot !== null) {
            console.warn(
              "[useApiData] 网络失败，已降级读离线快照：",
              error instanceof Error ? error.message : error
            );
            setState({ data: snapshot, loading: false, error: null, degraded: true });
            return;
          }
        }
        setState({
          data: null,
          loading: false,
          error:
            error instanceof ApiError
              ? error
              : new ApiError(error instanceof Error ? error.message : String(error), {
                  code: "NETWORK",
                  endpoint: options.snapshotKey ?? "unknown",
                }),
          degraded: false,
        });
      }
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.snapshotKey, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, retry };
}
