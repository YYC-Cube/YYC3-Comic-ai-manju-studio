"use client";

/**
 * 成本中心页（M5-P2 · 迁移自 MiniMax-3 原型 management/CostCenterPage，替换 M3 前简版）
 * 真链路：台账端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/management.ts）；
 *         「导出财务 CSV 账单」「一键应用夜间错峰排期」端点缺位——toast 占位 + TODO；
 *         Agent 色点取 lib/agents 真实名录色（原型硬编码色值对齐迁移）
 * 布局：头部（North Star 徽章 + 导出入口）→ 4 KPI（首卡含红线进度条）→ 左 Agent 成本表 → 右错峰套利面板
 */
import { Calendar, Coins, Download, PiggyBank, Wallet, Zap } from "lucide-react";
import { withFallback } from "@/api/client";
import { getCostLedger, type CostLedger } from "@/api/management";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";
import { AGENTS_MAP } from "@/lib/agents";

/** 演示数据（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_LEDGER: CostLedger = {
  perEpisode: "¥ 0.0018",
  monthlySpend: "¥ 148.60",
  monthlySpendDelta: "-24.8% 较上月",
  nightlyCapacity: "48 集/晚",
  totalTokens: "13.2 M",
  agentCosts: [
    { agentId: "chuangxiang-lingyun", name: "创想·灵韵", token: "4.2M", gpuHours: "12.4h", cost: 18.4 },
    { agentId: "gewu-zongshi", name: "格物·宗师", token: "2.8M", gpuHours: "8.2h", cost: 12.8 },
    { agentId: "yushu-wanwu", name: "语枢·万物", token: "3.1M", gpuHours: "4.5h", cost: 9.2 },
    { agentId: "yuanqi-tianshu", name: "元启·天枢", token: "1.9M", gpuHours: "2.1h", cost: 4.8 },
    { agentId: "yujian-xianzhi", name: "预见·先知", token: "1.2M", gpuHours: "1.8h", cost: 3.6 },
  ],
  agentCostTotal: 48.8,
  offpeak: { window: "00:00–08:00", currentPhase: "昼间平电期", suggestedTasks: 2, queuedBatches: 14 },
};

export default function CostPage() {
  const { toast } = useToast();
  const { data } = useApiData(() => withFallback(getCostLedger, () => DEMO_LEDGER), {
    snapshotKey: "cost-ledger:v1",
  });
  const ledger = data?.data ?? DEMO_LEDGER;
  const isMock = data?.isMock ?? true;

  return (
    <div>
      <PageHeader
        title="成本中心（Cost Center）"
        description="严控 AI 成本黑洞 · 全 Agent 算力透明可见 · DGX 错峰电价自动套利"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            North Star：单集 ≤ ¥2.00
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 台账端点待接入
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            // TODO：账单导出端点缺位
            toast({
              title: "账单导出端点待接入",
              description: "财务 CSV 导出随成本台账端点批次落地",
              variant: "warning",
            })
          }
        >
          <Download className="h-3.5 w-3.5" />
          导出财务 CSV 账单
        </Button>
      </div>

      {/* 4 KPI（首卡为单集红线卡） */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/30">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold text-foreground">当前单集核算成本</span>
              <span className="font-mono text-[10px] text-emerald-500">达标 99.9%</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold tabular-nums text-primary">
                {ledger.perEpisode}
              </span>
              <span className="text-xs text-muted-foreground">/ 集</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-background">
              <div className="h-full rounded-full bg-primary" style={{ width: "12%" }} />
            </div>
            <span className="block text-[10px] text-muted-foreground/70">极限定价上限 ¥ 2.00</span>
          </CardContent>
        </Card>
        <StatCard title="本月算力总支出" value={ledger.monthlySpend} delta={ledger.monthlySpendDelta} trend="up" icon={<Coins className="h-4 w-4" />} />
        <StatCard title="日均夜间错峰产能" value={ledger.nightlyCapacity} delta="+12 集 较上月" trend="up" icon={<Zap className="h-4 w-4" />} />
        <StatCard title="总 Token 消耗量" value={ledger.totalTokens} delta="全 Agent 合计" trend="flat" icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 左 2 列：Agent 成本表 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PiggyBank className="h-4 w-4 text-primary" />
              Agent 细分成本核算（杜绝成本黑洞）
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary text-muted-foreground">
                  <th className="p-2.5">Agent 成员</th>
                  <th className="p-2.5 font-mono">Token 消耗</th>
                  <th className="p-2.5 font-mono">GPU 算力时长</th>
                  <th className="p-2.5 font-mono">核算成本</th>
                  <th className="p-2.5 text-right font-mono">占比</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {ledger.agentCosts.map((agent) => (
                  <tr key={agent.agentId} className="transition-colors hover:bg-secondary/50">
                    <td className="flex items-center gap-2 p-2.5 font-sans font-bold">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: AGENTS_MAP[agent.agentId]?.color ?? "#8a97a8" }}
                      />
                      <span>{agent.name}</span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">{agent.token}</td>
                    <td className="p-2.5 text-muted-foreground">{agent.gpuHours}</td>
                    <td className="p-2.5 font-bold text-primary">¥ {agent.cost.toFixed(2)}</td>
                    <td className="p-2.5 text-right text-muted-foreground">
                      {((agent.cost / ledger.agentCostTotal) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 右 1 列：错峰套利面板 */}
        <Card className="flex flex-col justify-between border-sky-400/25">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-sky-400" />
              DGX 错峰调度套利面板
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between space-y-4">
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                谷电时段（{ledger.offpeak.window}）算力成本仅为峰电 32%。建议批量渲染任务排期至夜间执行。
              </p>
              <div className="space-y-1 rounded-lg border border-primary/20 bg-background p-3 font-mono text-xs text-primary">
                <div className="flex justify-between">
                  <span>当前处于：{ledger.offpeak.currentPhase}</span>
                  <span>建议排产：{ledger.offpeak.suggestedTasks} 任务</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  夜间预设队列：{ledger.offpeak.queuedBatches} 批已就绪
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-sky-400 font-bold text-background hover:bg-sky-500"
              onClick={() =>
                // TODO：错峰排期端点缺位
                toast({
                  title: "错峰排期端点待接入",
                  description: "夜间自动排期将随任务调度域批次落地",
                  variant: "warning",
                })
              }
            >
              一键应用夜间自动错峰排期
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
