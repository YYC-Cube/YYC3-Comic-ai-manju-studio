"use client";

/**
 * 运营数据看板页（M5-P2 · 迁移自 MiniMax-3 原型 management/AnalyticsPage，替换 M3 前简版）
 * 真链路：洞察端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/management.ts）；
 *         时间窗切换（7/30/90 天）为视图状态（演示数据不随窗格变化，端点落地后按窗格重取）；
 *         爆款镜头「查看分镜」→ /storyboard 真路由；「一键转为新剧本选题」→ /script 真路由（G5 闭环入口）
 * 布局：头部（G5 徽章 + 时间窗）→ 4 KPI → 左 2 列（完播漏斗 + 爆款镜头 TOP3）→ 右 1 列 Agent 反哺卡
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Share2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { withFallback } from "@/api/client";
import { getAnalyticsInsights, type AnalyticsInsights } from "@/api/management";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";

/** 演示数据（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_INSIGHTS: AnalyticsInsights = {
  kpis: { totalViews: "174.7 万次", avgCompletion: "42.8%", interactionRate: "8.9%", estRevenue: "¥ 38,400" },
  funnel: [
    { label: "视频曝光（Impression）", value: 1747000, percent: 100, color: "bg-primary" },
    { label: "3 秒黄金驻留（Retention 3s）", value: 1220000, percent: 69.8, color: "bg-sky-400" },
    { label: "50% 剧情推进", value: 910000, percent: 52.1, color: "bg-[#9d7cd8]" },
    { label: "100% 完整完播", value: 748000, percent: 42.8, color: "bg-emerald-500" },
  ],
  topShots: [
    { rank: 1, shot: "S01-01", name: "叶凌霄金瞳特写", views: "284.2万", completion: "78.4%" },
    { rank: 2, shot: "S01-03", name: "冰魄飞剑凝结", views: "210.5万", completion: "74.2%" },
    { rank: 3, shot: "S01-05", name: "大厅全景爆碎", views: "189.0万", completion: "69.1%" },
  ],
  reflex: {
    agents: "语枢·万物与预见·先知基于本周 174 万次全网播放回流分析：",
    suggestion:
      "「冷面剑尊在豪门晚宴当众破界」的冲突前置手法完播率达 78.4%，显著优于传统铺垫。建议下一季在 S01 增加「女主苏清月与反派家族的股权对赌」剧情。",
  },
};

type TimeRange = "7" | "30" | "90";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7");
  const { data } = useApiData(() => withFallback(getAnalyticsInsights, () => DEMO_INSIGHTS), {
    snapshotKey: "analytics-insights:v1",
  });
  const insights = data?.data ?? DEMO_INSIGHTS;
  const isMock = data?.isMock ?? true;

  return (
    <div>
      <PageHeader
        title="运营数据看板（Analytics & Reflex）"
        description="全网多端播放漏斗 · 爆款分镜溯源 · AI 洞察一键反哺下季剧本选题"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            G5 运营反哺生产闭环
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 洞察端点待接入
            </Badge>
          )}
        </div>
        {/* 时间窗切换 */}
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5 font-mono text-xs">
          {(["7", "30", "90"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`cursor-pointer rounded px-3 py-1 ${
                timeRange === r
                  ? "bg-sky-400 font-bold text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              近 {r} 天
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="全网总播放量" value={insights.kpis.totalViews} delta="+32.4% 较上周期" trend="up" icon={<Eye className="h-4 w-4" />} />
        <StatCard title="平均完播率" value={insights.kpis.avgCompletion} delta="行业均值 28.5%" trend="up" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="互动转化率" value={insights.kpis.interactionRate} delta="+1.4% 较上周期" trend="up" icon={<Share2 className="h-4 w-4" />} />
        <StatCard title="预估总商业收益" value={insights.kpis.estRevenue} delta="+18.9% 较上周期" trend="up" icon={<Zap className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 左 2 列：漏斗 + TOP3 */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">短剧完播转化漏斗（Retention Funnel）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-xs">
              {insights.funnel.map((stage) => (
                <div key={stage.label} className="space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {stage.label}：{stage.value.toLocaleString()}
                    </span>
                    <span className="text-foreground">{stage.percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-background">
                    <div className={`h-full rounded ${stage.color}`} style={{ width: `${stage.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">爆款镜头 TOP 3（溯源反向跳转）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {insights.topShots.map((ts) => (
                <Link
                  key={ts.rank}
                  href="/storyboard"
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 transition-colors hover:border-primary"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold text-primary">
                      {ts.rank}
                    </span>
                    <span className="font-mono font-bold">{ts.shot}</span>
                    <span className="text-muted-foreground">{ts.name}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[11px]">
                    <span>播放：{ts.views}</span>
                    <span className="text-emerald-500">完播：{ts.completion}</span>
                    <span className="text-primary">查看分镜 →</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 右 1 列：Agent 反哺卡 */}
        <Card className="flex flex-col justify-between border-sky-400/25">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Agent 洞察与选题反哺建议
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between space-y-4">
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-muted-foreground">{insights.reflex.agents}</p>
              <div className="space-y-2 rounded-lg border border-primary/20 bg-background p-3 text-xs">
                <div className="font-bold text-primary">建议选题方向：</div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {insights.reflex.suggestion}
                </p>
              </div>
            </div>
            <Link
              href="/script"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
            >
              <span>一键转为新剧本选题（闭环回流）</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
