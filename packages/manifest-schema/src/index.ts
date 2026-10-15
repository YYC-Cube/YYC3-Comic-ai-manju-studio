/**
 * @file packages/manifest-schema/src/index.ts
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-15
 *
 * StoryboardV1 分镜协议 zod schema — 跨进程契约唯一真源
 * 同构对齐（修改本文件必须三方同步）：
 *   - apps/web  src/types/storyboard.ts（validateStoryboard 同规则）
 *   - apps/api  app/modules/script_engine/storyboard_schema.py（stdlib 校验同规则）
 * 导出物：schema/storyboard.v1.json（经 pnpm gen 生成，供 Python 侧 jsonschema 校验）
 * 规则口径：单集 80-120 镜头为「警告级」（不进 schema 硬约束），由 checkEpisodeShotCount 输出。
 */
import { z } from "zod";

/** 景别枚举：远景/全景/中景/近景/特写（协议单字形态，勿与原型全称枚举混用） */
export const SHOT_TYPES = ["远", "全", "中", "近", "特"] as const;
export type ShotType = (typeof SHOT_TYPES)[number];

/** 运镜枚举：推/拉/摇/移/跟/固定 */
export const CAMERA_MOVES = ["推", "拉", "摇", "移", "跟", "固定"] as const;
export type CameraMove = (typeof CAMERA_MOVES)[number];

/** 当前协议版本 */
export const STORYBOARD_PROTOCOL_VERSION = "1.0" as const;

/** 单个镜头（Shot 子结构，12 字段） */
export const shotSchema = z.object({
  /** 镜头 ID，如 shot-ep01-001 */
  shot_id: z.string().min(1),
  /** 所属场景 ID */
  scene_id: z.string().min(1),
  /** 画面描述 */
  description: z.string(),
  /** 景别 */
  shot_type: z.enum(SHOT_TYPES),
  /** 运镜方式 */
  camera_move: z.enum(CAMERA_MOVES),
  /** 台词（可为空） */
  dialogue: z.string(),
  /** 时长（秒） */
  duration_sec: z.number().positive(),
  /** 文生图提示词 */
  image_prompt: z.string(),
  /** 音效描述（可为空） */
  sfx: z.string(),
  /** 背景音乐描述（可为空） */
  bgm: z.string(),
  /** 是否钩子镜头（前 3 秒留人点） */
  hook_flag: z.boolean(),
  /** 角色一致性锚定 ID（关联角色资产库） */
  consistency_anchor: z.string(),
});
export type Shot = z.infer<typeof shotSchema>;

/** 分镜剧本顶层结构（StoryboardV1，12 字段 + 跨字段一致性规则） */
export const storyboardV1Schema = z
  .object({
    /** 协议版本，当前为 1.0 */
    version: z.string().min(1),
    /** 项目 ID */
    project_id: z.string().min(1),
    /** 单集 ID */
    episode_id: z.string().min(1),
    /** 单集标题 */
    episode_title: z.string().min(1),
    /** 风格参考（提示词或参考图 ID） */
    style_ref: z.string().min(1),
    /** 出场角色锚定 ID 列表 */
    character_refs: z.array(z.string()),
    /** 镜头总数（必须与 shots.length 一致） */
    total_shots: z.number().int().nonnegative(),
    /** 钩子镜头 ID 列表（必须指向 hook_flag=true 的镜头） */
    hook_shots: z.array(z.string()),
    /** 镜头列表（非空） */
    shots: z.array(shotSchema).min(1, "镜头列表（shots）不能为空"),
    created_at: z.string(),
    updated_at: z.string(),
    /** 链路追踪 ID */
    trace_id: z.string().min(1),
  })
  .superRefine((sb, ctx) => {
    if (sb.total_shots !== sb.shots.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["total_shots"],
        message: `total_shots（${sb.total_shots}）与 shots.length（${sb.shots.length}）不一致`,
      });
    }
    if (sb.hook_shots.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hook_shots"],
        message: "hook_shots 不能为空：每集至少需要 1 个钩子镜头",
      });
    }
    const shotMap = new Map(sb.shots.map((s) => [s.shot_id, s]));
    for (const hookId of sb.hook_shots) {
      const target = shotMap.get(hookId);
      if (!target) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hook_shots"],
          message: `hook_shots 中的 ${hookId} 不存在于 shots 列表`,
        });
      } else if (!target.hook_flag) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hook_shots"],
          message: `镜头 ${hookId} 的 hook_flag 为 false，与 hook_shots 声明矛盾`,
        });
      }
    }
  });
export type StoryboardV1 = z.infer<typeof storyboardV1Schema>;

/** 单集镜头数节奏规则（警告级，与前后端校验器口径一致：80-120） */
export const EPISODE_SHOT_COUNT_RULE = { min: 80, max: 120 } as const;

/** 节奏规则检查：返回警告列表（空数组表示无警告），不参与 schema 硬校验 */
export function checkEpisodeShotCount(sb: StoryboardV1): string[] {
  const warnings: string[] = [];
  if (sb.shots.length < EPISODE_SHOT_COUNT_RULE.min) {
    warnings.push(`[警告] 单集镜头数 ${sb.shots.length} 低于下限 ${EPISODE_SHOT_COUNT_RULE.min}，节奏可能偏慢`);
  } else if (sb.shots.length > EPISODE_SHOT_COUNT_RULE.max) {
    warnings.push(`[警告] 单集镜头数 ${sb.shots.length} 超过上限 ${EPISODE_SHOT_COUNT_RULE.max}，注意成本红线`);
  }
  return warnings;
}
