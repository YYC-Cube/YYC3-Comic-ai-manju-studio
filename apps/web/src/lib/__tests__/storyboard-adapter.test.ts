/**
 * StoryboardV1 ↔ UI 适配器测试（M2 · 枚举映射全表覆盖门禁）
 * 运行：pnpm --filter @yyc3/manju-frontend test（tsx 直跑，与 manifest-schema 同范式）
 * 覆盖：
 * 1. 景别/运镜枚举映射全表（双向逐值）
 * 2. 协议→UI→协议 全值往返恒等
 * 3. V1.1 待扩展值（俯仰/环绕）适配边界显式拒绝
 * 4. 原型全称枚举样例（特写/推镜头）正确上单字协议
 * 5. 生产态字段不上协议（fromUiShot 丢弃留证）
 */
import {
  AdapterError,
  CAMERA_MOVE_FROM_PROTOCOL as _cfp, // 仅供覆盖性检查引用
  cameraMoveFromProtocol,
  cameraMoveToProtocol,
  fromUiShot,
  fromUiStoryboard,
  shotSizeFromProtocol,
  shotSizeToProtocol,
  toUiShot,
  toUiStoryboard,
  UI_CAMERA_MOVES,
  UI_SHOT_SIZES,
  type ShotUI,
  type StoryboardUI,
} from "../storyboard-adapter";
import type { CameraMove, Shot, ShotType, StoryboardV1 } from "../../types/storyboard";

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
  if (cond) pass++;
  else fail++;
}

/* ---------- 1. 枚举映射全表 ---------- */

const SHOT_SIZE_TABLE: Array<[ShotType, Parameters<typeof shotSizeFromProtocol>[0], string]> = [
  ["特", "特", "特写"],
  ["近", "近", "近景"],
  ["中", "中", "中景"],
  ["全", "全", "全景"],
  ["远", "远", "远景"],
];
const SHOT_SIZE_EXPECT: Array<[ShotType, string]> = [
  ["特", "特写"],
  ["近", "近景"],
  ["中", "中景"],
  ["全", "全景"],
  ["远", "远景"],
];
for (const [protocol, , ui] of SHOT_SIZE_TABLE) {
  check(`景别 协议→UI：${protocol}→${ui}`, shotSizeFromProtocol(protocol) === ui);
  check(`景别 UI→协议：${ui}→${protocol}`, shotSizeToProtocol(ui as never) === protocol);
}

const MOVE_EXPECT: Array<[CameraMove, string]> = [
  ["推", "推镜头"],
  ["拉", "拉镜头"],
  ["摇", "摇镜头"],
  ["移", "移镜头"],
  ["跟", "跟镜头"],
  ["固定", "固定镜头"],
];
for (const [protocol, ui] of MOVE_EXPECT) {
  check(`运镜 协议→UI：${protocol}→${ui}`, cameraMoveFromProtocol(protocol) === ui);
  check(`运镜 UI→协议：${ui}→${protocol}`, cameraMoveToProtocol(ui as never) === protocol);
}

/* ---------- 2. 往返恒等（全值） ---------- */

function makeShot(over: Partial<Shot> = {}): Shot {
  return {
    shot_id: "shot-ep01-001",
    scene_id: "scene-01",
    description: "夜，天台",
    shot_type: "近",
    camera_move: "推",
    dialogue: "……",
    duration_sec: 3,
    image_prompt: "rooftop night",
    sfx: "",
    bgm: "弦乐",
    hook_flag: false,
    consistency_anchor: "char-01",
    ...over,
  };
}

let roundTripOk = true;
for (const [st] of SHOT_SIZE_EXPECT) {
  for (const [cm] of MOVE_EXPECT) {
    const src = makeShot({ shot_type: st, camera_move: cm, hook_flag: st === "特" });
    const back = fromUiShot(toUiShot(src));
    if (JSON.stringify(back) !== JSON.stringify(src)) roundTripOk = false;
  }
}
check("协议→UI→协议 全值往返恒等（5 景别 × 6 运镜 = 30 组合）", roundTripOk);

/* ---------- 3. V1.1 待扩展值拒绝 ---------- */

for (const pending of ["俯仰", "环绕"] as const) {
  let rejected = false;
  try {
    cameraMoveToProtocol(pending);
  } catch (err) {
    rejected = err instanceof AdapterError && err.field === "cameraMove" && err.value === pending;
  }
  check(`V1.1 待扩展值「${pending}」显式拒绝`, rejected);
}

/* ---------- 4. 原型全称枚举上协议 ---------- */

const protoStyleShot: ShotUI = {
  id: "S01-01",
  sceneId: "scene-01",
  description: "特写：风铃摇动",
  shotSize: "特写",
  cameraMove: "推镜头",
  dialogue: "",
  durationSec: 2.5,
  prompt: "wind chime close-up",
  sfx: "风铃声",
  bgm: "",
  hookFlag: true,
  consistencyAnchor: "char-01",
  /* 生产态字段（应被丢弃） */
  negativePrompt: "lowres",
  seed: 42,
  motionStrength: 0.6,
  status: "passed",
  consistencyScore: 96,
};
const protocolShot = fromUiShot(protoStyleShot);
check(
  "原型全称枚举「特写/推镜头」→ 协议「特/推」",
  protocolShot.shot_type === "特" && protocolShot.camera_move === "推"
);
check(
  "生产态字段不上协议（negativePrompt/seed/status 均不存在）",
  !("negativePrompt" in protocolShot) && !("seed" in protocolShot) && !("status" in protocolShot)
);
check("UI 视图模型保留生产态字段", protoStyleShot.seed === 42 && protoStyleShot.status === "passed");

/* ---------- 5. 分镜级双向转换 ---------- */

const ui: StoryboardUI = {
  version: "1.0",
  projectId: "proj-001",
  episodeId: "ep01",
  episodeTitle: "第一集",
  styleRef: "style-urban",
  characterRefs: ["char-01"],
  totalShots: 1,
  hookShots: ["S01-01"],
  shots: [protoStyleShot],
  createdAt: "2026-10-16T00:00:00Z",
  updatedAt: "2026-10-16T00:00:00Z",
  traceId: "trace-m2",
};
const sb: StoryboardV1 = fromUiStoryboard(ui);
check(
  "分镜级 UI→协议 字段映射（snake_case + total_shots + hook_shots）",
  sb.project_id === "proj-001" && sb.total_shots === 1 && sb.hook_shots[0] === "S01-01"
);
const back = toUiStoryboard(sb);
check(
  "分镜级 协议→UI 还原（camelCase + 全称枚举）",
  back.projectId === "proj-001" && back.shots[0].shotSize === "特写" && back.shots[0].cameraMove === "推镜头"
);

/* ---------- 汇总 ---------- */

console.log(`\n结果：${pass} 过 / ${fail} 失败（UI 枚举常量覆盖：景别 ${UI_SHOT_SIZES.length} / 运镜 ${UI_CAMERA_MOVES.length}）`);
void _cfp;
if (fail > 0) process.exitCode = 1;
