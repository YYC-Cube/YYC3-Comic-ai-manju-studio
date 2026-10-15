"use client";

/**
 * 门禁徽章（M3 · 原型 GateBadge 的 shadcn 化重写）
 * G0-G5 语义源自 lib/gates（单一事实源）
 */
import { GATE_LEVELS, type GateLevel } from "@/lib/gates";
import { cn } from "@/lib/utils";

interface GateBadgeProps {
  level: GateLevel;
  /** 当前主检门禁高亮（脉冲点） */
  active?: boolean;
  /** 已通过（绿色 + ✓） */
  passed?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function GateBadge({ level, active = false, passed = false, size = "md", className }: GateBadgeProps) {
  const gateInfo = GATE_LEVELS.find((g) => g.id === level) ?? {
    id: level,
    name: "门禁",
    threshold: "质检校验",
  };

  const tone = passed
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
    : active
      ? "border-primary/40 bg-primary/10 text-primary"
      : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-mono transition-colors",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-xs",
        tone,
        className
      )}
      title={`${gateInfo.id} 门禁 (${gateInfo.name}) · 准入标准：${gateInfo.threshold}`}
    >
      <span className="font-bold">{gateInfo.id}</span>
      <span className="text-[11px] opacity-80">{gateInfo.name}</span>
      {passed && <span className="text-[10px]">✓</span>}
      {active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
    </span>
  );
}
