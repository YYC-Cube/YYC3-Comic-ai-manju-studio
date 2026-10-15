"use client";

/**
 * 剧本详情页（M3 · 迁移自 MiniMax-3 原型 production/ScriptDetailPage）
 * 三栏布局：场次导航树 / 剧本正文 + AI Diff 审核 / 结构化资产绑定
 * 路由约定：/script/new → 新建剧本（ScriptEditor 原文解析器）；/script/[id] → 场次视图
 * 数据：library 域（TODO(M5) 端点缺位）→ withFallback 降级 MOCK_SCRIPTS
 */
import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Download, Film, History, Inbox, Sparkles } from "lucide-react";
import { withFallback } from "@/api/client";
import { getScript } from "@/api/library";
import { useApiData } from "@/hooks/use-api-data";
import { resolveViewState } from "@/hooks/use-view-state";
import { ConfidenceBadge } from "@/components/common/confidence-badge";
import { DriveModeSwitch } from "@/components/common/drive-mode-switch";
import { ViewStateGate } from "@/components/common/states";
import { ScriptEditor } from "@/components/editor/script-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { MOCK_SCRIPTS } from "@/lib/mock/production";
import { useDriveModeStore } from "@/store/use-drive-mode-store";
import { useProjectStore } from "@/store/use-project-store";
import { cn } from "@/lib/utils";

/** 演示剧本正文（TODO(M5)：正文持久化端点缺位，现与 mock 剧本脱钩的固定样章） */
const DEMO_SCENE_CONTENT = {
  heading: "[SCENE 101] 内景 - 苏家顶层酒会大厅 - 日",
  paragraphs: [
    "水晶吊灯洒下奢华暖光，衣香鬓影。酒会正中央，世家宾客推杯换盏。叶凌霄一身朴素深色西装，神态自若地坐在角落沙发，指尖轻轻摇晃着一杯香槟。",
    "皮鞋声清脆作响。陈浩天手端红酒，带着两名身材魁梧的黑衣保镖，带着戏谑冷笑径直走向叶凌霄。",
  ],
  dialogues: [
    {
      speaker: "叶凌霄（内心独白）",
      tone: "sky" as const,
      line: "“三百年了，这具肉躯终于感应到灵枢。待本命冰魄剑重铸之日，昔日仇怨，一并清算。”",
    },
    {
      speaker: "陈浩天（讥讽大笑）",
      tone: "pink" as const,
      line: "“哟，这不是我们苏家的大能人吗？听说连苏总的私密年会都没请你坐主桌，你倒是有闲心躲在这里偷酒喝？”",
    },
  ],
  diff: {
    original: "“哟，这不是我们苏家的大能人吗？听说连苏总的私密年会都没请你坐主桌...”",
    suggested: "“叶凌霄，苏家养条狗都知道摇尾巴，你这倒插门的三无赘婿，也配脏了这顶层水晶杯？”",
    confidence: 0.94,
  },
};

const DIALOGUE_TONE = {
  sky: "border-sky-500 text-sky-500",
  pink: "border-pink-500 text-pink-500",
} as const;

export default function ScriptDetailPage() {
  const params = useParams<{ scriptId: string }>();
  const scriptId = params.scriptId;
  const router = useRouter();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  // /script/new：新建剧本 = 原文解析器（M2 真实链路 analyzeScript/draftStoryboard）
  if (scriptId === "new") {
    return (
      <div>
        <PageHeader
          title="新建剧本"
          description="粘贴小说原文，AI 生成结构化剧本并提取分镜（真实引擎链路）"
        />
        {activeProjectId ? (
          <ScriptEditor projectId={activeProjectId} />
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            请先在「项目管理」页选择或创建项目
          </p>
        )}
      </div>
    );
  }

  return <ScriptSceneView scriptId={scriptId} onBack={() => router.push("/script")} />;
}

function ScriptSceneView({ scriptId, onBack }: { scriptId: string; onBack: () => void }) {
  const router = useRouter();
  const driveMode = useDriveModeStore((s) => s.driveMode);
  const setDriveMode = useDriveModeStore((s) => s.setDriveMode);

  const [isMock, setIsMock] = useState(false);
  const loader = useCallback(async () => {
    const { data, isMock: mock } = await withFallback(
      () => getScript(scriptId),
      () => MOCK_SCRIPTS.find((s) => s.id === scriptId) ?? null
    );
    setIsMock(mock);
    return data;
  }, [scriptId]);
  const { data: script, loading, error, retry } = useApiData(loader, {
    snapshotKey: `/api/v1/factory/library/scripts/${scriptId}`,
  });

  const [activeScene, setActiveScene] = useState(0);
  const [isSaved] = useState(true);
  const [showDiff, setShowDiff] = useState(true);
  const [inboxChecked, setInboxChecked] = useState(true);

  const state = resolveViewState({
    loading,
    error,
    itemCount: loading || error ? null : script ? 1 : 0,
  });

  // 场次导航：由剧本 scenes 派生（演示数据；shocksEst 为估算占位）
  const scenes =
    script?.scenes.map((sc, i) => ({
      id: i,
      title: `第 ${i + 1} 场 · ${sc.name}`,
      desc: `${sc.type} · ${sc.lighting}`,
      shotsEst: 5 + ((i * 3) % 4),
    })) ?? [];

  return (
    <div className="space-y-4">
      {/* 顶栏：面包屑 + 保存状态 + 操作 */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            ← 剧本列表
          </button>
          <span className="text-muted-foreground">/</span>
          <h2 className="text-sm font-semibold">《{script?.title ?? scriptId}》E01 剧本正文</h2>
          <Badge variant="success" className="gap-1 font-mono text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {isSaved ? "已自动保存" : "保存中…"}
          </Badge>
          {isMock && <Badge variant="warning">演示数据</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">单任务驾驶:</span>
            <DriveModeSwitch currentMode={driveMode} onChange={setDriveMode} size="sm" />
          </div>
          <Button variant="outline" size="sm" title="版本历史（90天审计）">
            <History className="h-3.5 w-3.5" />
            v3.4 历史
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" />
            导出 docx
          </Button>
          <Button size="sm" onClick={() => router.push("/storyboard")}>
            一键转分镜（预计 {scenes.reduce((a, s) => a + s.shotsEst, 0)} 镜）
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ViewStateGate
        state={state}
        error={error}
        loadingMessage="剧本语意分析与角色对白着色中…"
        emptyTitle="剧本场次为空或剧本不存在"
        emptyDescription="当前剧本尚未划分任何场次与对白，或剧本 ID 不存在。"
        emptyActionText="返回剧本列表"
        onEmptyAction={onBack}
        onRetry={retry}
      >
        {/* 三栏布局 */}
        <div className="flex flex-col gap-4 lg:h-[calc(100vh-14rem)] lg:flex-row">
          {/* 左栏（240px）：场次导航树 */}
          <div className="flex max-h-[32vh] w-full flex-col justify-between overflow-y-auto rounded-xl border bg-card p-3 lg:max-h-none lg:w-60 lg:shrink-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-semibold">第 1 集 · 场次导航</span>
                <span className="font-mono text-[10px] text-primary">共 {scenes.length} 场</span>
              </div>
              <div className="space-y-1.5">
                {scenes.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => setActiveScene(sc.id)}
                    className={cn(
                      "cursor-pointer rounded-lg p-2.5 transition-all",
                      activeScene === sc.id
                        ? "border-l-2 border-primary bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-xs font-semibold">{sc.title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{sc.shotsEst} 镜</span>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{sc.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              + 添加新场次
            </Button>
          </div>

          {/* 中栏：剧本正文 + AI Diff */}
          <div className="relative flex min-h-[50vh] w-full flex-1 flex-col overflow-y-auto rounded-xl border bg-card p-4 lg:w-auto lg:p-5">
            <div className="mb-4 flex items-center justify-between border-b pb-3 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-bold">
                  场次 {activeScene + 1}
                </Badge>
                <span className="text-muted-foreground">
                  日内 · {script?.scenes[activeScene]?.name ?? "—"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                自动着色: 场景[紫] 角色[蓝] 对白[白] 动作[绿]
              </span>
            </div>

            <div className="flex-1 space-y-4 font-mono text-xs leading-relaxed">
              <div className="rounded bg-purple-500/10 p-2 font-bold text-purple-500">
                {DEMO_SCENE_CONTENT.heading}
              </div>

              <p className="text-muted-foreground">{DEMO_SCENE_CONTENT.paragraphs[0]}</p>

              <div className={cn("space-y-1 border-l-2 pl-4", DIALOGUE_TONE.sky)}>
                <span className="block font-bold">{DEMO_SCENE_CONTENT.dialogues[0].speaker}:</span>
                <p className="text-foreground">{DEMO_SCENE_CONTENT.dialogues[0].line}</p>
              </div>

              <p className="text-muted-foreground">{DEMO_SCENE_CONTENT.paragraphs[1]}</p>

              <div className={cn("space-y-1 border-l-2 pl-4", DIALOGUE_TONE.pink)}>
                <span className="block font-bold">{DEMO_SCENE_CONTENT.dialogues[1].speaker}:</span>
                <p className="text-foreground">{DEMO_SCENE_CONTENT.dialogues[1].line}</p>
              </div>

              {/* AI Diff 审核面板（创想·灵韵 改写建议） */}
              {showDiff && (
                <div className="my-4 space-y-3 rounded-xl border border-primary/30 bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                      <span className="font-sans font-semibold">AI 创想·灵韵 改写建议（张力增强）</span>
                      <ConfidenceBadge confidence={DEMO_SCENE_CONTENT.diff.confidence} size="sm" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">ReAct-C Step 5</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="rounded border border-red-500/25 bg-red-500/10 p-2.5">
                      <span className="mb-1 block font-bold text-red-600">- 原文（陈浩天）:</span>
                      <p className="text-muted-foreground">{DEMO_SCENE_CONTENT.diff.original}</p>
                    </div>
                    <div className="rounded border border-teal-500/25 bg-teal-500/10 p-2.5">
                      <span className="mb-1 block font-bold text-teal-600">+ 建议改写（黄金3秒打脸前奏）:</span>
                      <p>{DEMO_SCENE_CONTENT.diff.suggested}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2">
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={inboxChecked}
                        onChange={(e) => setInboxChecked(e.target.checked)}
                        className="accent-primary"
                      />
                      <Inbox className="h-3 w-3 text-purple-500" />
                      采纳后自动归档至 Learning Inbox
                    </label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowDiff(false)}>
                        拒绝建议
                      </Button>
                      <Button size="sm" onClick={() => setShowDiff(false)}>
                        采纳改写
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右栏（320px）：结构化资产绑定 */}
          <div className="flex w-full flex-col justify-between space-y-4 overflow-y-auto rounded-xl border bg-card p-4 lg:w-80 lg:shrink-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-semibold">结构化资产绑定</span>
                <span className="font-mono text-[10px] text-primary">
                  本场 {script?.characters.length ?? 0} 人 {script ? 1 : 0} 景
                </span>
              </div>

              {/* 角色卡 */}
              <div>
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  出场角色
                </span>
                <div className="space-y-2">
                  {(script?.characters ?? []).map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-muted font-bold text-primary">
                          {c.name.slice(0, 1)}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold">{c.name}</span>
                          <span className="block text-[10px] text-muted-foreground">{c.roleDesc}</span>
                        </div>
                      </div>
                      <Badge variant={c.refTrained ? "secondary" : "warning"} className="font-mono text-[9px]">
                        {c.refTrained ? "Ref 已绑定" : "待训练"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* 场景卡 */}
              {script?.scenes[activeScene] && (
                <div>
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    绑现场景
                  </span>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5 text-xs">
                    <div>
                      <span className="block font-semibold">{script.scenes[activeScene].name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {script.scenes[activeScene].type} · {script.scenes[activeScene].lighting}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-sky-500">一致性 92%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <Button className="w-full" onClick={() => router.push("/storyboard")}>
                <Film className="h-4 w-4" />
                一键转分镜设计器
              </Button>
            </div>
          </div>
        </div>
      </ViewStateGate>
    </div>
  );
}
