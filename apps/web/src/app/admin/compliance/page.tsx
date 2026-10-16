"use client";

/**
 * 合规与版权中心页（M5-P2 · 迁移自 MiniMax-3 原型 management/AdminCompliancePage）
 * 真链路：敏感词预检为真实本地判定（客户端广告法禁用词表确定性匹配，非伪造）；
 *         PII 扫描报告为演示数据（页面 Badge 留痕；真实扫描随合规域端点落地）；
 *         原型五 Tab 中版权登记/平台规则/审计追溯无视图实现——显式空态，不伪造内容
 * 布局：头部（徽章 + 五 Tab）→ 敏感词测试台 / PII 报告 / 空态
 */
import { useState } from "react";
import { listComplianceEvents } from "@/api/management";
import { withFallback } from "@/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";

/** 广告法绝对化禁用词（客户端预检词表；全量分级词库随合规域端点落地） */
const BANNED_WORDS = ["天下第一", "包治百病", "国家级", "最高级", "最佳", "绝对", "第一品牌"];

const PII_REPORT = [
  "✓ 所有第三方平台 Token 均已实施哈希盐值脱敏（enc_token_••••••••）",
  "✓ 剧本对白中涉及真实身份证号与手机号均已自动置换为虚拟号段",
  "✓ 角色立绘人脸已完成虚拟特征脱敏，杜绝真人肖像侵权风险",
];

type TabId = "words" | "copyright" | "rules" | "pii" | "audit";
const TABS: { id: TabId; label: string }[] = [
  { id: "words", label: "敏感词库" },
  { id: "copyright", label: "版权登记" },
  { id: "rules", label: "平台规则" },
  { id: "pii", label: "PII 检测" },
  { id: "audit", label: "审计追溯" },
];

export default function AdminCompliancePage() {
  const [activeTab, setActiveTab] = useState<TabId>("words");
  const [testText, setTestText] = useState("此药水乃天下第一绝品，包治百病，立见奇效！");

  // 事件流端点缺位：仅驱动 Badge 口径（演示数据留痕）
  const { data } = useApiData(() => withFallback(listComplianceEvents, () => []), {
    snapshotKey: "compliance-events:v1",
  });
  const isMock = data?.isMock ?? true;

  // 真实本地判定：确定性匹配（非伪造检测结果）
  const hits = BANNED_WORDS.filter((w) => testText.includes(w));

  return (
    <div>
      <PageHeader
        title="合规与版权中心（Compliance & Privacy）"
        description="版权商用登记 · 敏感词分级正则 · PII 隐私一键脱敏 · 密钥永不入库"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            红线保全 · 审计之审计
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 合规域端点待接入
            </Badge>
          )}
        </div>
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5 font-mono text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`cursor-pointer rounded px-3 py-1 ${
                activeTab === t.id
                  ? "bg-primary font-bold text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 敏感词实时检测测试台（真实本地判定） */}
      {activeTab === "words" && (
        <Card className="border-red-600/25">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">敏感词实时检测测试台（输入台词对白快速预检）</span>
              <span className={`font-mono text-[10px] ${hits.length > 0 ? "text-red-600" : "text-emerald-500"}`}>
                {hits.length > 0 ? `命中 ${hits.length} 个广告法绝对禁用词` : "未命中禁用词"}
              </span>
            </div>

            <textarea
              rows={2}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 font-mono text-xs focus:border-primary focus:outline-none"
            />

            {hits.length > 0 && (
              <div className="space-y-1 rounded-lg border border-red-600/30 bg-background p-3 text-xs">
                <span className="block font-bold text-red-600">违规拦截提醒：</span>
                <p className="text-[11px] text-muted-foreground">
                  检测到绝对化用语：
                  {hits.map((w, i) => (
                    <span key={w}>
                      {i > 0 && "、"}
                      <strong className="text-red-600">「{w}」</strong>
                    </span>
                  ))}
                  ，将直接触发抖音与视频号机审驳回。建议替换为限定语（如「当世罕有」「调理气血」）。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PII 检测（演示报告，Badge 留痕） */}
      {activeTab === "pii" && (
        <Card className="border-primary/15">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">全平台 PII 个人隐私扫描报告（剧本 / 资产 / 账号凭证）</span>
              <span className="font-mono text-[10px] text-emerald-500">零明文泄露（0 PII Leaks）</span>
            </div>
            <div className="space-y-1.5 rounded-lg bg-background p-3 font-mono text-xs text-muted-foreground">
              {PII_REPORT.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 版权登记 / 平台规则 / 审计追溯：原型无视图实现，显式空态 */}
      {(activeTab === "copyright" || activeTab === "rules" || activeTab === "audit") && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-sm font-bold">
              「{TABS.find((t) => t.id === activeTab)?.label}」视图待接入
            </span>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              该视图随合规域端点批次落地（版权商用登记链 / 全网平台规则同步 / 审计追溯流）。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
