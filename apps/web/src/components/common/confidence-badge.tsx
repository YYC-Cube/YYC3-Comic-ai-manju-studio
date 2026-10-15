"use client";

/**
 * 置信度徽章（M3 · 原型 ConfidenceBadge 的 shadcn 化重写）
 * 三档语义：≥0.9 PASS（emerald）/ ≥0.6 REVIEW（amber）/ 低 INTERVENE（red）
 */
import { getConfidenceMeta } from "@/lib/drive-modes";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TONE_CLASSES = {
  emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  red: "border-red-500/40 bg-red-500/10 text-red-600",
} as const;

const DOT_CLASSES = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
} as const;

export function ConfidenceBadge({ confidence, showValue = true, size = "md", className }: ConfidenceBadgeProps) {
  const meta = getConfidenceMeta(confidence);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-mono backdrop-blur-sm transition-colors",
        size === "sm" && "gap-1 px-1.5 py-0.5 text-xs",
        size === "md" && "gap-1.5 px-2 py-1 text-xs",
        size === "lg" && "gap-2 px-2.5 py-1.5 text-sm font-medium",
        TONE_CLASSES[meta.tone],
        className
      )}
      title={`置信度 ${confidence.toFixed(2)} · ${meta.label}（${meta.desc}）`}
    >
      <span className={cn("inline-block h-1.5 w-1.5 animate-pulse rounded-full", DOT_CLASSES[meta.tone])} />
      <span>{meta.tag}</span>
      {showValue && (
        <span className="font-semibold tabular-nums opacity-90">{(confidence * 100).toFixed(0)}%</span>
      )}
    </span>
  );
}
