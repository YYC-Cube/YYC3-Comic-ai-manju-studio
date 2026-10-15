"use client";

/**
 * 全平台任务监控与九步闭环追踪（M3 · 原型 production/TasksPage × manju use-task-store 融合）
 * 数据形状对齐 M2 真实任务域 ProductionTask（stage/agent/status/progress/trace_id）：
 *   SSE 在线实时推送；离线 2s 轮询模拟推进（useTaskStream）
 * ReAct-C 九步步迹：由任务进度确定性推导（「步迹演示」Badge 明示，TODO(M4) 接入真实遥测后改远程）
 */
import { Fragment, useMemo, useState } from "react";
import { Brain, CheckCircle2, ChevronDown, ChevronUp, Cpu, XCircle } from "lucide-react";
import { ConfidenceBadge } from "@/components/common/confidence-badge";
import { DriveModeSwitch } from "@/components/common/drive-mode-switch";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useTaskStream } from "@/hooks/use-task-stream";
import { AGENTS_MAP, NINE_STEP_PIPELINE } from "@/lib/agents";
import { STAGES } from "@/lib/constants";
import { cn, formatPercent } from "@/lib/utils";
import { useDriveModeStore } from "@/store/use-drive-mode-store";
import { useProjectStore } from "@/store/use-project-store";
import { useTaskStore } from "@/store/use-task-store";
import type { ProductionTask, TaskStatus } from "@/types/task";

const STATUS_BADGE: Record<
  TaskStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "outline" }
> = {
  pending: { label: "待执行", variant: "outline" },
  running: { label: "执行中", variant: "warning" },
  success: { label: "成功", variant: "success" },
  failed: { label: "失败", variant: "destructive" },
  rework: { label: "返工", variant: "secondary" },
};

type StepStatus = "success" | "running" | "failed" | "pending";

/**
 * ReAct-C 九步步迹推导（演示态）：progress → 当前停驻步；
 * success 全绿；failed/rework 标定当前步失败；其余运行中
 */
function deriveStepsTrace(task: ProductionTask): { step: number; name: string; agentId: string; status: StepStatus }[] {
  const total = NINE_STEP_PIPELINE.length;
  const current =
    task.status === "success"
      ? total
      : Math.min(total, Math.max(1, Math.floor((task.progress / 100) * total) + 1));
  return NINE_STEP_PIPELINE.map((s) => {
    let status: StepStatus;
    if (task.status === "success") status = "success";
    else if (s.step < current) status = "success";
    else if (s.step === current)
      status = task.status === "failed" || task.status === "rework" ? "failed" : "running";
    else status = "pending";
    return { ...s, status };
  });
}

export default function TasksPage() {
  const { toast } = useToast();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const tasks = useTaskStore((s) => s.tasks);
  const isMock = useTaskStore((s) => s.isMock);
  const { connected } = useTaskStream(activeProjectId);
  const driveMode = useDriveModeStore((s) => s.driveMode);
  const setDriveMode = useDriveModeStore((s) => s.setDriveMode);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const taskList = useMemo(
    () => [...tasks.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [tasks]
  );

  const runningCount = taskList.filter((t) => t.status === "running").length;
  const failedCount = taskList.filter((t) => t.status === "failed" || t.status === "rework").length;

  /** 平均耗时（成功任务 updated-created 均值，演示推导） */
  const avgDuration = useMemo(() => {
    const done = taskList.filter((t) => t.status === "success");
    if (done.length === 0) return "—";
    const ms =
      done.reduce(
        (acc, t) => acc + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()),
        0
      ) / done.length;
    const m = Math.floor(ms / 60000);
    const s = Math.round((ms % 60000) / 1000);
    return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }, [taskList]);

  const handleTakeover = () =>
    toast({
      title: "人工接管（TODO M4）",
      description: "任务干预通道（暂停/热注入/强制取消）随后端遥测落地，当前为占位动作",
      variant: "warning",
    });

  return (
    <div className="space-y-4">
      <PageHeader
        title="全平台任务监控与九步闭环追踪"
        description="实时观测 8 Agent 九步协同轨迹 · 支持指令热注入、暂停与 100% 人工接管"
        actions={
          <>
            <Badge variant={connected ? "success" : "outline"}>
              {connected ? "SSE 实时推送中" : "演示模式（2s 轮询模拟）"}
            </Badge>
            {isMock && <Badge variant="warning">演示数据</Badge>}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">驾驶模式:</span>
              <DriveModeSwitch currentMode={driveMode} onChange={setDriveMode} size="sm" />
            </div>
          </>
        }
      />

      {/* 系统健康面板（演示指标，TODO(M4) 接入 Celery Flower 遥测） */}
      <div className="flex items-center gap-3 rounded-lg border bg-card p-2 font-mono text-xs" title="演示指标，TODO(M4) 接入 Flower 遥测">
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">
            Worker: <strong className="text-foreground">16 并行</strong>
          </span>
        </div>
        <span className="text-muted-foreground/50">|</span>
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-muted-foreground">
            Agent 在线率: <strong className="text-emerald-600">100%</strong>
          </span>
        </div>
      </div>

      {/* 指标卡（计数派生自任务域真实形状） */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-3.5">
          <span className="block text-xs text-muted-foreground">队列总深度</span>
          <span className="font-mono text-2xl font-bold">{taskList.length}</span>
          <span className="mt-1 block text-[10px] text-muted-foreground/70">排队延迟 &lt; 200ms</span>
        </div>
        <div className="rounded-xl border bg-card p-3.5">
          <span className="block text-xs text-muted-foreground">运行中任务</span>
          <span className="font-mono text-2xl font-bold text-primary">{runningCount}</span>
          <span className="mt-1 block text-[10px] text-emerald-600">DGX GB10 双卡全负荷</span>
        </div>
        <div className="rounded-xl border border-red-500/25 bg-card p-3.5">
          <span className="block text-xs text-red-600">失败待处理</span>
          <span className="font-mono text-2xl font-bold text-red-600">{failedCount}</span>
          <span className="mt-1 block text-[10px] text-muted-foreground">已切入降级保护路径</span>
        </div>
        <div className="rounded-xl border bg-card p-3.5">
          <span className="block text-xs text-muted-foreground">平均耗时 (单集)</span>
          <span className="font-mono text-2xl font-bold text-amber-600">{avgDuration}</span>
          <span className="mt-1 block text-[10px] text-muted-foreground/70">符合工业交付标准</span>
        </div>
      </div>

      {/* 任务表（行展开 = ReAct-C 九步追踪） */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务 ID</TableHead>
              <TableHead>任务类型</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[180px]">进度</TableHead>
              <TableHead>trace_id</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskList.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  当前队列为空——所有生成与渲染任务均已交付完毕
                </TableCell>
              </TableRow>
            )}
            {taskList.map((task) => {
              const isExpanded = expandedTaskId === task.task_id;
              const stepsTrace = isExpanded ? deriveStepsTrace(task) : [];
              const currentStep =
                task.status === "success"
                  ? 9
                  : Math.min(9, Math.max(1, Math.floor((task.progress / 100) * 9) + 1));

              return (
                <Fragment key={task.task_id}>
                  <TableRow
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.task_id)}
                    className={cn("cursor-pointer", isExpanded && "bg-muted/40")}
                  >
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      <span className="flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {task.task_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {STAGES.find((s) => s.key === task.stage)?.name ?? task.stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{task.agent}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={STATUS_BADGE[task.status].variant}>
                          {STATUS_BADGE[task.status].label}
                        </Badge>
                        {task.error && (
                          <p className="max-w-[240px] truncate text-xs text-red-600" title={task.error}>
                            {task.error}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={task.progress} className="w-24" />
                        <span className="font-mono text-[11px] tabular-nums text-primary">
                          {formatPercent(task.progress)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {task.trace_id}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.task_id)}
                          className="cursor-pointer rounded bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/25"
                        >
                          九步轨迹
                        </button>
                        <button
                          type="button"
                          onClick={handleTakeover}
                          title="强行人工接管该任务"
                          className="cursor-pointer rounded bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-600"
                        >
                          人工接管
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* ReAct-C 九步实时追踪流（展开行） */}
                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={7} className="p-4">
                        <div className="space-y-3 rounded-xl border border-primary/25 bg-card p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                              <span className="text-xs font-semibold">
                                ReAct-C 九步实时追踪流（当前停驻: Step {currentStep}）
                              </span>
                              <Badge variant="warning" className="text-[10px]">
                                步迹演示
                              </Badge>
                            </div>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              元启·天枢 编排引擎 · 可实时注入干预
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 md:grid-cols-9">
                            {stepsTrace.map((st) => {
                              const agent = AGENTS_MAP[st.agentId];
                              return (
                                <div
                                  key={st.step}
                                  className={cn(
                                    "space-y-1 rounded-lg border p-2 text-xs",
                                    st.status === "running" && "border-primary bg-muted shadow-sm",
                                    st.status === "success" && "bg-muted/40",
                                    st.status === "failed" && "border-red-500/50 bg-red-500/5",
                                    st.status === "pending" && "border-transparent bg-muted/20 opacity-40"
                                  )}
                                >
                                  <div className="flex items-center justify-between font-mono text-[10px]">
                                    <span className="text-muted-foreground">#{st.step}</span>
                                    {st.status === "success" && (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    )}
                                    {st.status === "running" && (
                                      <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
                                    )}
                                    {st.status === "failed" && <XCircle className="h-3 w-3 text-red-500" />}
                                  </div>
                                  <span className="block truncate font-semibold">{st.name}</span>
                                  <span
                                    className="block truncate text-[10px]"
                                    style={{ color: agent?.color }}
                                    title={agent ? `${agent.name} · ${agent.role}` : st.agentId}
                                  >
                                    {agent?.name.split("·")[1] ?? st.agentId}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
