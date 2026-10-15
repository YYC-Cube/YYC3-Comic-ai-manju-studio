/**
 * 分镜 API（M2 · 对齐 M1 后端真实端点 /api/v1/factory/storyboards*）
 * 真实可用：远程校验（引擎规则含 YYC3-74 G3 护栏）/ 契约自省 / 规则基线草稿
 * TODO(M3)：分镜持久化端点（GET/PATCH）随后端 M3 落地接通，当前 404 自动降级 mock
 */
import { request } from "@/api/client";
import { validateStoryboard, type Shot, type StoryboardV1 } from "@/types/storyboard";

/** 校验回执（与后端 storyboard_schema.validate_* 同构） */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** 远程校验：引擎规则（含钩子矛盾 / G3 同描述护栏 / 80-120 节奏窗口） */
export function validateRemote(sb: StoryboardV1): Promise<ValidationResult> {
  return request<ValidationResult>("/api/v1/factory/storyboards:validate", {
    method: "POST",
    body: JSON.stringify(sb),
  });
}

/** 契约自省：storyboard.v1.json（packages/manifest-schema 同步物） */
export function getSchema(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>("/api/v1/factory/storyboards/schema");
}

export interface DraftRequest {
  project_id: string;
  episode: { episode_id: string; content: string; hook_line?: string };
  elements?: {
    characters?: Array<{ name: string }>;
    scenes?: Array<{ name: string }>;
  };
  style_ref?: string;
  trace_id?: string;
}

/** 规则基线草稿生成（80-120 镜节奏窗口），附自校验回执 */
export function draftStoryboard(
  req: DraftRequest
): Promise<{ storyboard: StoryboardV1; validation: ValidationResult }> {
  return request("/api/v1/factory/storyboards:draft", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/** TODO(M3)：拉取单集分镜（后端持久化端点未落地，404 时由 withFallback 降级） */
export function getStoryboard(
  projectId: string,
  episodeId = "ep01"
): Promise<StoryboardV1> {
  return request<StoryboardV1>(
    `/api/v1/factory/storyboards/${encodeURIComponent(projectId)}/${encodeURIComponent(episodeId)}`
  );
}

/** TODO(M3)：更新单个镜头（局部字段 PATCH，同上降级语义） */
export function updateShot(
  episodeId: string,
  shotId: string,
  patch: Partial<Shot>
): Promise<Shot> {
  return request<Shot>(
    `/api/v1/factory/storyboards/${encodeURIComponent(episodeId)}/shots/${encodeURIComponent(shotId)}`,
    { method: "PATCH", body: JSON.stringify(patch) }
  );
}

/** 本地校验分镜（不请求后端；远程不可用时的降级路径） */
export function validate(sb: StoryboardV1): string[] {
  return validateStoryboard(sb);
}
