"use client";

/**
 * 广告与商业化工作台页（M5-P2 · 迁移自 MiniMax-3 原型 editing/VideoAdPage）
 * 真链路：商业化配置端点缺位——赞助商/收益预估为演示数据 + Badge 留痕；
 *         未成年人保护模式切换为演示态本地翻转 + toast 明示未持久化
 *         （红线语义：端点落地后须服务端强制熔断，前端状态不构成真实熔断）；
 *         植入模式切换为视图状态；「挂载至时间线轨道」→ /video 真路由
 * 布局：头部（徽章 + 未保熔断开关）→ 熔断告警条 → 左植入配置 → 右收益预估
 */
import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const AD_MODES = ["品牌角标", "贴片", "植入", "口播"] as const;
type AdMode = (typeof AD_MODES)[number];

export default function VideoAdPage() {
  const { toast } = useToast();
  const [minorProtectionActive, setMinorProtectionActive] = useState(false);
  const [adMode, setAdMode] = useState<AdMode>("品牌角标");

  return (
    <div>
      <PageHeader
        title="广告与商业化工作台（Monetization）"
        description="品牌贴片 · 剧情道具植入 · 平台收益分流 · 广告法自动合规拦截"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            CPM/CPC 动态变现
          </Badge>
          <Badge variant="warning" className="font-mono">
            演示数据 · 商业化端点待接入
          </Badge>
        </div>
        {/* 红线：未成年人保护模式 */}
        <button
          type="button"
          onClick={() => {
            setMinorProtectionActive(!minorProtectionActive);
            // 红线语义：演示态切换不构成真实熔断，端点落地后须服务端强制
            toast({
              title: "演示态：熔断切换未持久化",
              description: "未成年人保护模式须服务端强制熔断，随商业化域端点落地",
              variant: "warning",
            });
          }}
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            minorProtectionActive
              ? "bg-red-600 text-white shadow-lg"
              : "border border-red-600/30 bg-secondary text-muted-foreground hover:text-red-600"
          }`}
          title="一键开启未成年人保护模式（强制熔断禁用全部广告位）"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>未成年人保护模式：{minorProtectionActive ? "已开启（全位熔断）" : "未开启"}</span>
        </button>
      </div>

      {minorProtectionActive && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-600 bg-red-950/40 p-3 text-xs text-red-600 animate-in fade-in">
          <span>红线触发：已全面禁用本剧所有剧集商业化广告贴片、口播与角标，确保未成年人内容绿色合规。</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 左 2 列 · 植入配置 */}
        <Card className="md:col-span-2">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold">商业化植入模式切换</span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {AD_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAdMode(m)}
                    className={`cursor-pointer rounded px-2.5 py-1 ${
                      adMode === m
                        ? "bg-[#FF7A5C] font-bold text-white"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold">当前赞助商：极客修真能量饮品</span>
                  <span className="font-mono text-[11px] text-emerald-500">合规审查通过（0 违规词）</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  植入策略：在 S01-01 叶凌霄端杯镜头右上角挂载透明动态呼吸角标（持续 3 秒）。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右 1 列 · 收益预估 */}
        <Card className="border-primary/15">
          <CardContent className="space-y-4 p-4">
            <span className="block text-xs font-bold">单集商业化收益预估</span>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1 rounded-lg bg-background p-3">
                <span className="block text-[11px] text-muted-foreground">预计 CPM 单价</span>
                <span className="text-xl font-bold text-primary">¥ 45.00 / 千次</span>
              </div>
              <div className="space-y-1 rounded-lg bg-background p-3">
                <span className="block text-[11px] text-muted-foreground">全网预计分成收益</span>
                <span className="text-xl font-bold text-emerald-500">¥ 12,400.00</span>
              </div>
            </div>

            <Link
              href="/video"
              className="block w-full rounded-lg bg-[#FF7A5C] py-2 text-center text-xs font-bold text-white transition-colors hover:bg-[#e06548]"
            >
              挂载至时间线轨道
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
