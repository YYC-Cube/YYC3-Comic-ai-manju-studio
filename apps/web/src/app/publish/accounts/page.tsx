"use client";

/**
 * 账号矩阵管理页（M4 · 迁移自 MiniMax-3 原型 publishing/PublishAccountsPage）
 * 真链路：GET /api/v1/publishing/accounts 直连——M1 骨架返回空集，渲染诚实空态；
 *         「扫码添加 / 一键轮换」无授权端点 → toast TODO(M5)
 * 保留：零明文安全横幅（架构红线承诺文案）；原型死状态 selectedPlatform 不迁
 */
import { KeyRound, Lock, QrCode } from "lucide-react";
import { listPublishAccounts } from "@/api/publish";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApiData } from "@/hooks/use-api-data";
import { cn } from "@/lib/utils";

export default function PublishAccountsPage() {
  const { toast } = useToast();
  const { data: accounts, loading } = useApiData(listPublishAccounts, {
    snapshotKey: "publish-accounts:v1",
  });
  const items = accounts ?? [];

  const todo = (title: string, description: string) =>
    toast({ title: `${title}（TODO M5）`, description, variant: "warning" });

  return (
    <div>
      <PageHeader
        title="账号矩阵管理 (Account Matrix)"
        description="多账号统一授权池 · 预见·先知 7 天掉线预测 · 到期自动轮换"
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <Badge variant="secondary" className="font-mono">
          蚁小二对标 · 零明文存储
        </Badge>
        <Button
          size="sm"
          onClick={() =>
            todo("扫码添加平台账号", "OAuth 扫码授权流随推送域 M5 批次落地")
          }
        >
          <QrCode className="h-3.5 w-3.5" />
          扫码添加平台账号
        </Button>
      </div>

      {/* 零明文安全横幅（架构红线） */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-primary/30 bg-card p-3 text-xs">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <span>
            安全红线：所有开放平台 Cookie 与 AppSecret 均在 HSM 硬件加密机内脱敏，永不出明文。
          </span>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-primary">AES-256 GCM 隔离</span>
      </div>

      {/* 账号卡网格 / 空态 */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <KeyRound className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              {loading ? "正在巡检矩阵账号授权状态…" : "暂无绑定账号"}
            </p>
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              推送域后端当前为 M1 骨架阶段（GET accounts 返回空集）；五平台 OAuth 授权流入池后，此处呈现账号健康心跳与掉线预测。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((acc) => {
            const isExpiring = acc.authStatus === "expiring";
            return (
              <Card
                key={acc.id}
                className={cn(
                  "transition-all",
                  isExpiring
                    ? "border-amber-500/40 shadow-md"
                    : "hover:border-primary/50"
                )}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-primary">
                        {acc.platformName}
                      </span>
                      <h4 className="text-xs font-bold">{acc.accountName}</h4>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {acc.group}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="rounded bg-muted/40 p-2">
                      <span className="block text-[10px] text-muted-foreground">粉丝数</span>
                      <span className="text-sm font-bold">{acc.followers}</span>
                    </div>
                    <div className="rounded bg-muted/40 p-2">
                      <span className="block text-[10px] text-muted-foreground">发布成功率</span>
                      <span className="text-sm font-bold text-emerald-500">
                        {acc.successRate}%
                      </span>
                    </div>
                  </div>

                  {/* 预见·先知 掉线预测 */}
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      预见·先知 掉线预测:
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[11px] font-bold",
                        acc.predictOfflineRisk > 10 ? "text-red-500" : "text-emerald-500"
                      )}
                    >
                      {acc.predictOfflineRisk > 10
                        ? `较高风险 (${acc.predictOfflineRisk}%)`
                        : `极低风险 (<${Math.max(acc.predictOfflineRisk, 5)}%)`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 text-xs">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      凭证有效期：{acc.expireDays} 天
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        todo("凭证一键轮换", "凭证轮换端点随推送域 M5 批次落地")
                      }
                      className="cursor-pointer rounded bg-muted px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-muted/70"
                    >
                      一键轮换
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
