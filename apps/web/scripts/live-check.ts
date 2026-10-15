/**
 * M2 双模式服务层直测（以前端服务层视角，不经页面）
 * 用法：
 *   后端 up   → EXPECT_MODE=real pnpm --filter @yyc3/manju-frontend exec tsx scripts/live-check.ts
 *   后端 down → EXPECT_MODE=mock pnpm --filter @yyc3/manju-frontend exec tsx scripts/live-check.ts
 * 判定：real 模式要求全部 isMock=false；mock 模式要求全部 isMock=true（降级语义生效）
 */
import { withFallback, TIMEOUT_MS } from "../src/api/client";
import { analyzeScript, type ScriptResult } from "../src/api/script";
import { draftStoryboard, validateRemote } from "../src/api/storyboard";
import { createProject, listProjects } from "../src/api/project";
import { validateStoryboard } from "../src/types/storyboard";
import { mockStoryboard } from "../src/lib/mock-data";

const EXPECT_MODE = process.env.EXPECT_MODE ?? "real";
let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
  if (cond) pass++;
  else fail++;
}

const SAMPLE_TEXT = (
  "夜幕降临，林晚来到天台，手里攥着那封泛黄的信。" +
  "林晚低声道：「你终于来了。」她没有回头。男人撑着黑伞，缓缓走近。" +
  "男人问道：「信，你看过了？」他的声音沙哑。林晚转身，泪水混着雨水滑落。" +
  "林晚怒道：「为什么不告诉我真相？」男人沉默片刻，从怀中取出一张照片。" +
  "男人答道：「因为有些真相，说出来就是一生。」远处警笛声由远及近。" +
  "林晚喊道：「这一次，我不会再让你逃了！」众人站在天台上，雨越下越大。"
).repeat(6);

const MOCK_RESULT: ScriptResult = {
  characters: ["林晚"],
  scenes: ["天台"],
  hooks: ["开场钩子"],
  episode_suggestions: [{ title: "第 1 集", synopsis: "演示" }],
};

function expectMode(name: string, isMock: boolean) {
  const wantMock = EXPECT_MODE === "mock";
  check(
    `${name}（期望 ${EXPECT_MODE} 模式）`,
    isMock === wantMock,
    `isMock=${isMock}`
  );
}

console.log(`== M2 服务层双模式直测 · EXPECT_MODE=${EXPECT_MODE} · TIMEOUT_MS=${TIMEOUT_MS} ==\n`);

async function main() {
  // 1. analyzeScript（对应 script-editor handleGenerate）
  const gen = await withFallback(
    () => analyzeScript({ project_id: "proj-m2-live", novel_text: SAMPLE_TEXT }),
    () => MOCK_RESULT
  );
  expectMode("analyzeScript", gen.isMock);
  check(
    "analyzeScript ScriptResult 四段齐备",
    gen.data.characters.length > 0 &&
      gen.data.scenes.length > 0 &&
      gen.data.hooks.length > 0 &&
      gen.data.episode_suggestions.length > 0,
    `characters=${gen.data.characters.length} scenes=${gen.data.scenes.length} hooks=${gen.data.hooks.length} episodes=${gen.data.episode_suggestions.length}`
  );

  // 2. draftStoryboard（对应 script-editor handleExtract）
  const draft = await withFallback(
    async () => {
      const res = await draftStoryboard({
        project_id: "proj-m2-live",
        episode: { episode_id: "ep01", content: SAMPLE_TEXT, hook_line: "这一次，我不会再让你逃了！" },
        elements: { characters: [], scenes: [] },
      });
      return res.storyboard;
    },
    () => mockStoryboard
  );
  expectMode("draftStoryboard", draft.isMock);
  check("draftStoryboard 产出分镜", draft.data.total_shots > 0, `total_shots=${draft.data.total_shots}`);

  // 3. validateRemote（对应 store.load 远程校验路径）
  const val = await withFallback(
    () => validateRemote(draft.data),
    () => ({
      valid: validateStoryboard(draft.data).length === 0,
      errors: validateStoryboard(draft.data),
      warnings: [] as string[],
    })
  );
  expectMode("validateRemote", val.isMock);
  check(
    "validateRemote 回执三字段",
    "valid" in val.data && Array.isArray(val.data.errors) && Array.isArray(val.data.warnings),
    `valid=${val.data.valid} errors=${val.data.errors.length} warnings=${val.data.warnings.length}`
  );

  // 4. management/projects（创建 + 列表信封）
  const proj = await withFallback(
    () =>
      createProject({
        title: "M2 服务层直测项目",
        novice_source: "night-rooftop.txt",
        episode_target: 3,
      }),
    () => ({
      project_id: "mock-0000",
      title: "演示项目",
      novice_source: "demo.txt",
      episode_target: 1,
      status: "draft" as const,
      cost: 0,
      created_at: new Date().toISOString(),
    })
  );
  expectMode("createProject", proj.isMock);

  const list = await withFallback(() => listProjects(), () => [proj.data]);
  expectMode("listProjects", list.isMock);
  check(
    "listProjects 解 {items} 信封为数组",
    Array.isArray(list.data) && list.data.length > 0,
    `size=${list.data.length}`
  );

  console.log(`\n结果：${pass} 过 / ${fail} 失败`);
  if (fail > 0) process.exit(1);
}

void main();
