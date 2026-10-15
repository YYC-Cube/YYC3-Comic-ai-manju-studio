"use client";

/**
 * 生产指挥工作台（M3 · 迁移自 MiniMax-3 原型 production/DashboardPage）
 * 五指标卡 + 六阶段流水线态势 + 进行中项目 + 待办异常拦截 + 四域快捷入口
 * 数据：进行中项目 ← library 剧本域（端点缺位降级 MOCK_SCRIPTS）；
 *       指标/流水线/待办为演示聚合数据（TODO(M5) 聚合端点落地）
 */
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brain,
  ChevronRight,
  Cpu,
  Film,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { withFallback } from "@/api/client";
import { listScripts } from "@/api/library";
import { useApiData } from "@/hooks/use-api-data";
import { resolveViewState } from "@/hooks/use-view-state";
import { ConfidenceBadge } from "@/components/common/confidence-badge";
import { GateBadge } from "@/components/common/gate-badge";
import { MetricCard } from "@/components/common/metric-card";
import { ViewStateGate } from "@/components/common/states";
import { Thumb } from "@/components/common/thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { GATE_CURRENT_ID } from "@/lib/gates";
import { MOCK_SCRIPTS } from "@/lib/mock/production";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isMock, setIsMock] = useState(false);
  const loader = useCallback(async () => {
    const { data, isMock: mock } = await withFallback(() => listScripts(), () => MOCK_SCRIPTS);
    setIsMock(mock);
    return data;
  }, []);
  const { data, loading, error, degraded, retry } = useApiData(loader, {
    snapshotKey: "/api/v1/factory/library/scripts",
  });
  const scripts = data ?? [];

  const state = resolveViewState({
    loading,
    error,
    itemCount: loading || error ? null : scripts.length,
  });

  const handleCounsel = () =>
    toast({
      title: "议事厅仲裁（TODO M4）",
      description: "P04 冲突仲裁抽屉随 M4 编排对齐落地",
      variant: "warning",
    });
  const handleTodoNav = (target: string, todo: string) =>
    toast({ title: `${target}（${todo}）`, description: "该目标页随后续里程碑迁移", variant: "warning" });

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">YYC³ · 生产指挥工作台</h1>
            <Badge variant="outline" className="font-mono text-[11px]">
              双 DGX GB10 算力集群就绪
            </Badge>
            {isMock && <Badge variant="warning">演示数据</Badge>}
            {degraded && <Badge variant="warning">离线快照</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            今日全线产出 214 镜头 · 平均置信度 0.91 · 单集核算成本 ¥ 0.0018
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Button size="sm" onClick={() => router.push("/script/new")}>
            <Plus className="h-3.5 w-3.5" />
            新建剧本立项
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleTodoNav("Agent 协同大屏", "TODO M4")}>
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Agent 协同大屏
          </Button>
        </div>
      </div>

      <ViewStateGate
        state={state}
        error={error}
        loadingMessage="正在同步 DGX 算力集群与流水线状态…"
        emptyTitle="产线尚未建立任何漫剧剧目"
        emptyDescription="当前工作空间无任何剧目立项且任务队列为 0。创建第一部剧目启动产线。"
        emptyActionText="创建第一部剧目"
        onEmptyAction={() => router.push("/script/new")}
        onRetry={retry}
      >
        {/* Row 1: 五指标卡 */}
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
          <MetricCard label="今日生成镜头数" value="214" unit="镜" change="+18.4%" domain="production" icon={<Film className="h-4 w-4" />} subtext="日产标杆 240 镜" />
          <MetricCard label="待质检镜头" value="18" unit="镜" change="-4 镜" domain="production" icon={<ShieldCheck className="h-4 w-4" />} subtext="格物·宗师 校验中" />
          <MetricCard label="渲染中任务" value="6" unit="批" domain="editing" icon={<Cpu className="h-4 w-4" />} subtext="硬件加速 100%" />
          <MetricCard label="昨日发布全网数" value="32" unit="条" change="+24.1%" domain="publishing" icon={<Send className="h-4 w-4" />} subtext="5 平台矩阵协同" />
          <MetricCard label="本周 Agent 学习样本" value="89" unit="例" domain="cognition" icon={<Brain className="h-4 w-4" />} subtext="Learning Inbox 待审 3" />
        </div>

        {/* Row 2: 六阶段流水线 */}
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                六阶段流水线实时态势（Six-Stage Pipeline）
              </h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">全链路闭环编排：元启·天枢</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6">
            {PIPELINE_STAGES.map((stg, idx) => {
              const isActive = idx === 2;
              const isDone = idx < 2;
              return (
                <div
                  key={stg.id}
                  onClick={() => router.push(stg.route)}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-xl border p-3 transition-all",
                    isActive ? "border-primary bg-muted shadow-md" : "hover:border-primary/40"
                  )}
                >
                  {isActive && <div className="absolute left-0 right-0 top-0 h-0.5 animate-pulse bg-primary" />}
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">STAGE {stg.stage}</span>
                    <ConfidenceBadge confidence={0.92} size="sm" showValue={false} />
                  </div>
                  <h4 className="mb-1 text-xs font-semibold">{stg.name}</h4>
                  <p className="mb-2 truncate text-[10px] text-muted-foreground">{stg.agent}</p>
                  <div className="flex items-center justify-between border-t pt-1 font-mono text-[10px]">
                    <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                      {isActive ? "运行中 (8)" : isDone ? "就绪 (12)" : "待排产"}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: 进行中项目 + 待办异常 */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* 左 2/3 */}
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                进行中的项目（Active Drama Series）
              </h3>
              <button
                type="button"
                onClick={() => router.push("/project")}
                className="flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
              >
                查看全部剧目
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  onClick={() => router.push("/storyboard")}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-4 transition-all hover:border-primary/50"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3.5">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        <Thumb
                          src={script.characters[0]?.avatar}
                          alt={script.title}
                          label={script.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 font-mono text-[9px] text-primary">
                          {script.genre}
                        </span>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="text-sm font-semibold transition-colors group-hover:text-primary">
                            {script.title}
                          </h4>
                          <GateBadge level={script.gateLevel} active={script.gateLevel === GATE_CURRENT_ID} />
                        </div>
                        <p className="mb-2 line-clamp-1 max-w-lg text-xs text-muted-foreground">{script.synopsis}</p>
                        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                          <span>字数: {(script.wordCount / 10000).toFixed(1)}万</span>
                          <span>角色: {script.characterCount}位</span>
                          <span>图谱完备度: {script.loreCompleteness}%</span>
                          <span>活跃: {script.lastEdited}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                      <ConfidenceBadge confidence={0.93} size="sm" />
                      <span className="font-mono text-xs font-bold text-primary">{script.stage}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右 1/3：待办与异常 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                待办与异常拦截（Action Items）
              </h3>
              <span className="font-mono text-xs text-red-500">1 处阻塞</span>
            </div>
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <div
                onClick={handleCounsel}
                className="group cursor-pointer rounded-lg border border-red-500/40 bg-red-500/10 p-3 transition-colors hover:border-red-500"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-600">
                    门禁拦截 G3
                  </span>
                  <span className="text-[10px] text-muted-foreground">14:22</span>
                </div>
                <h5 className="mb-1 text-xs font-semibold transition-colors group-hover:text-red-500">
                  镜头 S01-04 身份漂移（相似度 64%）
                </h5>
                <p className="mb-2 text-[11px] leading-tight text-muted-foreground">
                  格物·宗师判定面部与 RefCard 差异过大，置信度仅 0.54。
                </p>
                <div className="flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>进入议事厅仲裁 →</span>
                  <ConfidenceBadge confidence={0.54} size="sm" />
                </div>
              </div>

              <div
                onClick={() => handleTodoNav("Learning Inbox 复核", "TODO M4 admin-agents")}
                className="group cursor-pointer rounded-lg border border-violet-400/30 bg-muted/40 p-3 transition-colors hover:border-violet-400"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="rounded bg-violet-400/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-violet-500">
                    学习沉淀
                  </span>
                  <span className="text-[10px] text-muted-foreground">今天 11:40</span>
                </div>
                <h5 className="mb-1 text-xs font-semibold transition-colors group-hover:text-violet-400">
                  Learning Inbox 有 3 条样本待人工复核
                </h5>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  语枢·万物提交了口型同步音素增强示例，待核准入库。
                </p>
              </div>

              <div
                onClick={() => handleTodoNav("快手凭证轮换", "TODO M4 publish-accounts")}
                className="group cursor-pointer rounded-lg border border-amber-500/30 bg-muted/40 p-3 transition-colors hover:border-amber-500"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-600">
                    凭证预警
                  </span>
                  <span className="text-[10px] text-muted-foreground">4 天后到期</span>
                </div>
                <h5 className="mb-1 text-xs font-semibold transition-colors group-hover:text-amber-500">
                  快手矩阵号凭证即将到期
                </h5>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  建议进行扫码一键轮换授权，避免发布任务中断。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: 四域快捷入口 */}
        <div className="grid grid-cols-2 gap-3.5 pt-2 md:grid-cols-4">
          <QuickAction domain="生产域" tone="text-teal-500 border-t-teal-500" icon={<Plus className="h-4 w-4" />} title="新建剧本文档" desc="支持 20 万字长文直接导入提取" onClick={() => router.push("/script/new")} />
          <QuickAction domain="剪辑域" tone="text-purple-500 border-t-purple-500" icon={<Film className="h-4 w-4" />} title="继续分镜设计" desc="12 字段专业 Schema 与画布流" onClick={() => router.push("/storyboard")} />
          <QuickAction domain="管理域" tone="text-sky-500 border-t-sky-500" icon={<Cpu className="h-4 w-4" />} title="提交批量生成" desc="DGX 硬件直通与泳道看板" onClick={() => router.push("/production")} />
          <QuickAction domain="推送域" tone="text-orange-500 border-t-orange-500" icon={<Send className="h-4 w-4" />} title="发起多端分发" desc="自适应比例、敏感词预检" onClick={() => handleTodoNav("多端分发", "TODO M4 publish")} />
        </div>
      </ViewStateGate>
    </div>
  );
}

function QuickAction({
  domain,
  tone,
  icon,
  title,
  desc,
  onClick,
}: {
  domain: string;
  tone: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-xl border border-t-[3px] bg-card p-4 text-left transition-all hover:shadow-md",
        tone.split(" ")[1]
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={cn("text-[11px] font-semibold uppercase", tone.split(" ")[0])}>{domain}</span>
        <span className={cn("transition-transform group-hover:translate-x-1", tone.split(" ")[0])}>{icon}</span>
      </div>
      <h4 className="mb-1 text-sm font-semibold">{title}</h4>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
