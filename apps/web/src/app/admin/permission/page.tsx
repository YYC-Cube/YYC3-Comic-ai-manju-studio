"use client";

/**
 * 权限与安全审计页（M5-P2 · 迁移自 MiniMax-3 原型 management/AdminPermissionPage）
 * 真链路：RBAC 矩阵端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/management.ts）；
 *         原型四 Tab 中成员/审计/L0 授权三视图无内容实现（仅占位切换器）——
 *         迁入为显式空态「随 RBAC 域批次落地」，不伪造视图内容
 * 布局：头部（徽章 + 四 Tab）→ 四角色权限矩阵表（管理/编导/剪辑/运营四域色）
 */
import { useState } from "react";
import { withFallback } from "@/api/client";
import { getRbacMatrix, type RbacMatrixRow } from "@/api/management";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";

/** 演示数据（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_MATRIX: RbacMatrixRow[] = [
  { module: "剧本立项与编辑", admin: "读/写/审", director: "读/写/审", editor: "只读", ops: "只读" },
  { module: "分镜设计与提示词", admin: "读/写/审", director: "读/写/审", editor: "读/写", ops: "只读" },
  { module: "LoRA 训练与权重调优", admin: "读/写/审", director: "读/写/审", editor: "不可见", ops: "不可见" },
  { module: "多轨道剪辑与特效", admin: "读/写/审", director: "读/写/审", editor: "读/写/审", ops: "只读" },
  { module: "全网分发与账号凭证", admin: "读/写/审", director: "读/写/审", editor: "不可见", ops: "读/写/审" },
  { module: "L0 全自动模式启停", admin: "全权", director: "授权", editor: "禁止", ops: "禁止" },
  { module: "System Prompt 修改发布", admin: "全权", director: "审批", editor: "禁止", ops: "禁止" },
];

const ROLE_COLUMNS = [
  { key: "admin", label: "管理员（Admin）", cls: "text-primary", bg: "bg-primary/15" },
  { key: "director", label: "编导总监（Director）", cls: "text-sky-400", bg: "bg-sky-400/15" },
  { key: "editor", label: "剪辑师（Editor）", cls: "text-[#9d7cd8]", bg: "bg-[#9d7cd8]/15" },
  { key: "ops", label: "运营审计（Ops）", cls: "text-[#FF7A5C]", bg: "bg-[#FF7A5C]/15" },
] as const;

type TabId = "roles" | "members" | "audit" | "l0_auth";
const TABS: { id: TabId; label: string }[] = [
  { id: "roles", label: "四角色权限矩阵" },
  { id: "members", label: "团队成员" },
  { id: "audit", label: "审计日志" },
  { id: "l0_auth", label: "L0 驾驶授权" },
];

export default function AdminPermissionPage() {
  const [activeTab, setActiveTab] = useState<TabId>("roles");
  const { data } = useApiData(() => withFallback(getRbacMatrix, () => DEMO_MATRIX), {
    snapshotKey: "rbac-matrix:v1",
  });
  const matrix = data?.data ?? DEMO_MATRIX;
  const isMock = data?.isMock ?? true;

  return (
    <div>
      <PageHeader
        title="权限与安全审计（RBAC & Audit）"
        description="管理员 / 编导 / 剪辑 / 运营审计 四维隔离 · L0 全自动模式独立授权审批"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            四角色矩阵 · 90 天审计留痕
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · RBAC 端点待接入
            </Badge>
          )}
        </div>
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer rounded px-3 py-1 ${
                activeTab === tab.id
                  ? "bg-sky-400 font-bold text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "roles" ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="p-3 font-semibold text-muted-foreground">功能模块</th>
                  {ROLE_COLUMNS.map((c) => (
                    <th key={c.key} className={`p-3 font-semibold ${c.cls}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {matrix.map((m) => (
                  <tr key={m.module} className="transition-colors hover:bg-secondary/50">
                    <td className="p-3 font-medium">{m.module}</td>
                    {ROLE_COLUMNS.map((c) => (
                      <td key={c.key} className="p-3">
                        <span className={`rounded px-2 py-0.5 font-mono text-[11px] ${c.bg} ${c.cls}`}>
                          {m[c.key]}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        /* 成员/审计/L0 授权三视图：原型无内容实现，显式空态不伪造 */
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-sm font-bold">「{TABS.find((t) => t.id === activeTab)?.label}」视图待接入</span>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              该视图随 RBAC 域端点批次落地（成员目录 / 90 天审计流 / L0 授权审批链）。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
