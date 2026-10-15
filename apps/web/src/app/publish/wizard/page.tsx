"use client";

/**
 * 一键多平台分发向导页（M4 · 迁移自 MiniMax-3 原型 publishing/PublishWizardPage）
 * 真链路：提交真调 POST /api/v1/publishing/jobs——M1 骨架 501，显式报错提示（不伪造入队成功）；
 *         原型预填假标题文案改为空初始值 + 占位示例；敏感词预检假结果卡改为「端点待接入」诚实提示；
 *         「换一批爆款标题」→ toast TODO(M5)（AI 标题生成端点）
 * 布局：步骤条（① 选片 ② 平台适配与文案 ③ 定时排期，本地步骤态）→ 左表单（平台多选/标题/预检）→ 右摘要（派生计数 + 知遇·伯乐时段卡）
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Send, Sparkles } from "lucide-react";
import { enqueuePublishJob, type PlatformKey } from "@/api/publish";
import { ApiError } from "@/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const PLATFORMS: { id: PlatformKey; name: string; ratio: string; iconColor: string }[] = [
  { id: "douyin", name: "抖音", ratio: "9:16 (1080p)", iconColor: "#00e0b8" },
  { id: "channels", name: "微信视频号", ratio: "9:16 (1080p)", iconColor: "#22C55E" },
  { id: "bilibili", name: "B站", ratio: "16:9 (4K)", iconColor: "#00B4D8" },
  { id: "kuaishou", name: "快手", ratio: "9:16 (1080p)", iconColor: "#ff7a45" },
  { id: "xiaohongshu", name: "小红书", ratio: "3:4 (竖屏)", iconColor: "#ff4422" },
];

const STEPS = ["① 选片", "② 平台适配与文案", "③ 定时排期"] as const;

export default function PublishWizardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(2);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>([
    "douyin",
    "channels",
    "bilibili",
  ]);
  const [titleText, setTitleText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePlatform = (id: PlatformKey) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const handleSubmit = async () => {
    if (isSubmitting || selectedPlatforms.length === 0) return;
    setIsSubmitting(true);
    try {
      await enqueuePublishJob({ platforms: selectedPlatforms, title: titleText.trim() });
      toast({
        title: "已加入发布队列",
        description: `${selectedPlatforms.length} 个平台分发任务已入队`,
        variant: "success",
      });
      router.push("/publish");
    } catch (err) {
      if (err instanceof ApiError && err.status === 501) {
        toast({
          title: "推送队列端点未落地（M1 骨架 501）",
          description: "分发任务入队随 H3 产出回流与 M5 批次落地，当前仅向导 UI 联通",
          variant: "warning",
        });
      } else {
        toast({
          title: "提交失败",
          description: err instanceof Error ? err.message : "请稍后重试",
          variant: "warning",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="一键多平台分发向导 (Publish Wizard)"
        description="格式自适应 · 敏感词预检 · 知遇·伯乐 最佳时间智能排期"
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Badge variant="secondary" className="w-fit font-mono">
          蚁小二 / 融媒体级
        </Badge>
        {/* 步骤条 */}
        <div className="flex items-center gap-3 font-mono text-xs">
          {STEPS.map((label, i) => (
            <span key={label} className="flex items-center gap-3">
              {i > 0 && <span className="text-muted-foreground/50">→</span>}
              <button
                type="button"
                onClick={() => setStep(i + 1)}
                className={cn(
                  "cursor-pointer",
                  step >= i + 1 ? "font-bold text-primary" : "text-muted-foreground/60"
                )}
              >
                {label}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* 左 · 配置表单 */}
        <Card className="min-w-0 flex-1">
          <CardContent className="space-y-5 p-5">
            {/* 平台多选 */}
            <div>
              <span className="mb-2 block text-xs font-bold">选择目标推送矩阵平台 (多选)</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const isSelected = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        isSelected
                          ? "border-2 border-primary bg-primary/10 shadow-md"
                          : "border border-border bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.iconColor }}
                      />
                      <span>{p.name}</span>
                      <span className="font-mono text-[10px] opacity-70">({p.ratio})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 标题文案 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">全网标题与爆款话题 (AI 创想·灵韵 生成)</span>
                <button
                  type="button"
                  onClick={() =>
                    toast({
                      title: "AI 爆款标题（TODO M5）",
                      description: "创想·灵韵 标题生成端点随 M5 批次落地",
                      variant: "warning",
                    })
                  }
                  className="flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  换一批爆款标题
                </button>
              </div>
              <textarea
                rows={3}
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                placeholder="输入分发标题与话题，如：剧集高光一句钩 + #短剧 #题材 #爽点"
                className="w-full rounded-lg border bg-muted/40 p-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              {/* 敏感词预检：端点未接入，诚实提示 */}
              <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 p-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>敏感词批量预检端点待接入（TODO M5），提交前请人工复核广告法禁用词</span>
                </div>
                <span className="font-mono text-[11px]">合规预检 N/A</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右 · 摘要与时段建议 */}
        <Card className="w-full shrink-0 lg:w-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">分发任务预估摘要</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>推送目标账号:</span>
                  <span className="text-foreground">{selectedPlatforms.length} 个</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>格式自适应变体:</span>
                  <span className="text-primary">{selectedPlatforms.length} 套规格</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>当前步骤:</span>
                  <span className="text-amber-500">{STEPS[step - 1]}</span>
                </div>
              </div>

              {/* 知遇·伯乐 最佳时段（演示建议，推荐端点 TODO M5） */}
              <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-muted/40 p-3 text-xs">
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  知遇·伯乐 最佳时段建议:
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  演示建议：晚间 20:00–21:30 为短剧黄金吸粉窗口。个性化推荐端点随 M5 批次落地（TODO M5）。
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <Button
                className="w-full font-bold"
                disabled={isSubmitting || selectedPlatforms.length === 0}
                onClick={handleSubmit}
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? "正在提交…" : "立即加入定时发布队列"}
              </Button>
              {selectedPlatforms.length === 0 && (
                <p className="text-center text-[11px] text-muted-foreground">
                  请至少选择一个目标平台
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
