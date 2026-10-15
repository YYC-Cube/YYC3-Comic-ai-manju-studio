/**
 * @file packages/manifest-schema/src/test-schema.ts
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-15
 *
 * StoryboardV1 契约冒烟测试（双端不错位的门禁）
 * 覆盖：合法样例 / total_shots 一致性 / hook 矛盾 / 非法枚举（含原型全称枚举负例）/ 节奏警告
 */
import {
  checkEpisodeShotCount,
  storyboardV1Schema,
  type Shot,
  type StoryboardV1,
} from "./index";

function makeShot(overrides: Partial<Shot> = {}): Shot {
  return {
    shot_id: "shot-ep01-001",
    scene_id: "scene-01",
    description: "夜，天台，主角独白",
    shot_type: "近",
    camera_move: "推",
    dialogue: "……",
    duration_sec: 3,
    image_prompt: "rooftop night, close-up, cinematic",
    sfx: "",
    bgm: "低沉弦乐",
    hook_flag: false,
    consistency_anchor: "char-protagonist",
    ...overrides,
  };
}

const hookShot = makeShot({ shot_id: "shot-ep01-002", hook_flag: true });

const valid: StoryboardV1 = {
  version: "1.0",
  project_id: "proj-demo",
  episode_id: "ep01",
  episode_title: "第一集",
  style_ref: "style-urban-night",
  character_refs: ["char-protagonist"],
  total_shots: 2,
  hook_shots: ["shot-ep01-002"],
  shots: [makeShot(), hookShot],
  created_at: "2026-10-15T00:00:00Z",
  updated_at: "2026-10-15T00:00:00Z",
  trace_id: "trace-m0-demo",
};

let failed = 0;

function expectPass(name: string, data: unknown) {
  const r = storyboardV1Schema.safeParse(data);
  console.log(`${name}: ${r.success ? "✅ 通过（符合预期）" : "❌ 被误拒 " + JSON.stringify(r.error.issues.slice(0, 2))}`);
  if (!r.success) failed++;
}

function expectReject(name: string, data: unknown) {
  const r = storyboardV1Schema.safeParse(data);
  console.log(
    `${name}: ${!r.success ? "✅ 拒绝（符合预期）— " + r.error.issues[0]?.message : "❌ 被误放行"}`,
  );
  if (r.success) failed++;
}

expectPass("合法样例", valid);
expectReject("total_shots 与 shots.length 不一致", { ...valid, total_shots: 99 });
expectReject("hook_shots 指向 hook_flag=false 的镜头", { ...valid, hook_shots: ["shot-ep01-001"] });
expectReject("hook_shots 为空", { ...valid, hook_shots: [] });
// 负例：原型 UI 全称枚举「特写/推镜头」不属于协议枚举，必须被拒（B2 断点防回归）
expectReject("原型全称枚举「特写」应被拒", {
  ...valid,
  shots: [makeShot({ shot_type: "特写" as never }), hookShot],
});
expectReject("非法运镜枚举「环绕」应被拒", {
  ...valid,
  shots: [makeShot({ camera_move: "环绕" as never }), hookShot],
});

// 节奏规则：fixture 仅 2 镜头，应输出「低于下限 80」警告（警告不阻断）
const warnings = checkEpisodeShotCount(valid);
console.log(`节奏规则: ${warnings.length > 0 ? "✅ 按预期输出警告 — " + warnings[0] : "⚠ 无警告（fixture 预期应有）"}`);

if (failed > 0) {
  console.error(`\n${failed} 项未达预期`);
  process.exitCode = 1;
} else {
  console.log("\n全部断言通过");
}
