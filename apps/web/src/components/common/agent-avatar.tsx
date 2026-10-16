"use client";

/**
 * Agent 认知圆头像（M5-R6 · 八 Agent 浮层共用）
 * 视觉平等红线：尺寸/亮度一致，专属色为唯一区分维度（色环 + 首字，同 admin/agents 名录渲染口径）
 */
import { AGENTS_MAP } from "@/lib/agents";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  agentId: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
} as const;

export function AgentAvatar({ agentId, size = "md", className }: AgentAvatarProps) {
  const agent = AGENTS_MAP[agentId];
  const color = agent?.color ?? "#00e0b8";
  const initial = agent?.name.charAt(0) ?? "智";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: `${color}26`, color, boxShadow: `inset 0 0 0 1px ${color}55` }}
      title={agent ? `${agent.name}（${agent.role}）` : agentId}
    >
      {initial}
    </span>
  );
}
