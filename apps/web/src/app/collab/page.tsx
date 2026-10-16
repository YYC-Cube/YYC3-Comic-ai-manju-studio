"use client";

/**
 * 协作与评论中心页（M5-P2 · 迁移自 MiniMax-3 原型 management/CollabCommentsPage）
 * 真链路：批注流端点缺位——withFallback 降级演示数据 + Badge 留痕（端点形状见 api/management.ts）；
 *         锚点跳转 → 真实路由（targetRoute）；状态过滤为视图状态（计数由数据派生）
 * 布局：头部（徽章 + 状态过滤）→ 批注卡列表（作者/角色/锚点跳转/Agent 回复线程）
 */
import { useState } from "react";
import Link from "next/link";
import { Bot, ExternalLink } from "lucide-react";
import { withFallback } from "@/api/client";
import { listCollabComments, type CollabComment } from "@/api/management";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";

/** 演示数据（端点未落地时降级展示，页面挂徽章留痕） */
const DEMO_COMMENTS: CollabComment[] = [
  {
    id: "CM-101",
    author: "王编导",
    role: "编导总监",
    createdAt: "2026-10-15 21:32",
    content: "S01-07 的雨夜转场节奏太拖，建议砍掉 0.8 秒空镜，直接切到主角抬眼特写。黄金 3 秒原则不能破。",
    status: "pending",
    targetRoute: "/storyboard",
    targetAnchor: "S01-07",
    replies: [
      {
        author: "创想·灵韵",
        createdAt: "2026-10-15 21:33",
        content: "已生成两版紧凑化分镜备选：A 版保留霓虹反射 0.4s，B 版硬切特写。A 版预测完播率高 2.1%。",
      },
    ],
  },
  {
    id: "CM-100",
    author: "李剪辑",
    role: "专业剪辑",
    createdAt: "2026-10-15 16:08",
    content: "E03 成片 02:14 处 BGM 鼓点与挥剑动作错位半拍，已在时间线微调对齐，请复核。",
    status: "resolved",
    targetRoute: "/video",
    targetAnchor: "E03 02:14",
    replies: [],
  },
];

type FilterStatus = "all" | "pending" | "resolved";

export default function CollabCommentsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const { data } = useApiData(() => withFallback(listCollabComments, () => DEMO_COMMENTS), {
    snapshotKey: "collab-comments:v1",
  });
  const comments = data?.data ?? DEMO_COMMENTS;
  const isMock = data?.isMock ?? true;

  const pendingCount = comments.filter((c) => c.status === "pending").length;
  const resolvedCount = comments.filter((c) => c.status === "resolved").length;
  const filtered = comments.filter((c) => filterStatus === "all" || c.status === filterStatus);

  const FILTERS: { id: FilterStatus; label: string }[] = [
    { id: "all", label: `全部批注（${comments.length}）` },
    { id: "pending", label: `待裁决（${pendingCount}）` },
    { id: "resolved", label: `已解决（${resolvedCount}）` },
  ];

  return (
    <div>
      <PageHeader
        title="协作与评论中心（Collaboration）"
        description="导演组 / 剪辑师 / AI Agent 统一会话评审流 · 点击锚点秒级跳转高亮"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            Figma 评审对标 · 跨页时间锚点
          </Badge>
          {isMock && (
            <Badge variant="warning" className="font-mono">
              演示数据 · 批注端点待接入
            </Badge>
          )}
        </div>
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5 font-mono text-xs">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`cursor-pointer rounded px-3 py-1 ${
                filterStatus === f.id
                  ? "bg-sky-400 font-bold text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((comment) => (
          <Card key={comment.id} className="transition-all hover:border-sky-400/30">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-secondary text-xs font-bold">
                    {comment.author.charAt(0)}
                  </span>
                  <div>
                    <span className="block text-xs font-bold">{comment.author}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {comment.role} · {comment.createdAt}
                    </span>
                  </div>
                </div>

                <Link
                  href={comment.targetRoute}
                  className="flex items-center gap-1.5 rounded bg-secondary px-2.5 py-1 font-mono text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <span>锚点：{comment.targetAnchor}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              <p className="pl-10 text-xs leading-relaxed">{comment.content}</p>

              {comment.replies.map((reply, i) => (
                <div
                  key={i}
                  className="ml-10 space-y-1 rounded-lg border border-primary/20 bg-background p-3 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Bot className="h-3.5 w-3.5" />
                    <span>{reply.author}</span>
                    <span className="font-mono text-[10px] font-normal text-muted-foreground/70">
                      （{reply.createdAt}）
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{reply.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
