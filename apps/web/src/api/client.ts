/**
 * API 客户端：统一请求封装 + mock 降级（M2 · YYC3-78 错误码对齐）
 * 后端未实现期间，前端依赖 withFallback 降级到演示数据，可独立开发
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:25200";

export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:30001";

/** 请求超时时间（毫秒，YYC3-78 统一为 10s） */
export const TIMEOUT_MS = 10_000;

/** 错误码（YYC3-78 第三节） */
export type ApiErrorCode = "NO_BACKEND" | "NETWORK" | "TIMEOUT" | "HTTP";

/** API 业务错误 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly endpoint: string;
  readonly status?: number;

  constructor(
    message: string,
    options: { code: ApiErrorCode; endpoint: string; status?: number }
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.endpoint = options.endpoint;
    this.status = options.status;
  }
}

/** 统一 JSON 请求：10 秒超时 + 统一错误处理 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      // M4 鉴权基座：跨源携带会话 Cookie（yyc3_session，HttpOnly）；
      // 后端 CORSMiddleware 已 allow_credentials=True + 精确源白名单
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(`请求超时（${TIMEOUT_MS / 1000}s）：${path}`, {
        code: "TIMEOUT",
        endpoint: path,
      });
    }
    throw new ApiError(
      `网络错误：${err instanceof Error ? err.message : String(err)}`,
      { code: "NETWORK", endpoint: path }
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new ApiError(`请求失败 ${res.status}：${path}`, {
      code: "HTTP",
      endpoint: path,
      status: res.status,
    });
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(`响应不是合法 JSON：${path}`, {
      code: "HTTP",
      endpoint: path,
    });
  }
}

/** request 的别名导出，语义上表示“通用 API 拉取” */
export const apiFetch = request;

/**
 * mock 降级包装：真实请求失败时打印警告并返回演示数据
 * 后端补齐后无需改动调用方，自动切换回真实数据
 */
export async function withFallback<T>(
  realFn: () => Promise<T>,
  mockFn: () => T | Promise<T>
): Promise<{ data: T; isMock: boolean }> {
  try {
    const data = await realFn();
    return { data, isMock: false };
  } catch (err) {
    // P3 修复（2026-10-05 首审）：区分错误类型——仅「后端不可实现」场景降级
    // mock（网络/超时错误、5xx、404 未实现）；4xx 业务错误（参数错/鉴权失败）
    // 原样上抛，联调期不再系统性掩盖服务端业务问题
    const status = err instanceof ApiError ? err.status : undefined;
    const fallbackable =
      status === undefined || status >= 500 || status === 404;
    if (!fallbackable) {
      throw err;
    }
    console.warn(
      "[API 降级] 后端不可达或未实现，使用演示数据：",
      err instanceof Error ? err.message : err
    );
    return { data: await mockFn(), isMock: true };
  }
}
