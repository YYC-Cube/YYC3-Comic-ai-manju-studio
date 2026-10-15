"use client";

/**
 * 指标卡（M3 · 原型 MetricCard 的 shadcn 化重写）
 * 域色顶条：production=teal / editing=purple / publishing=orange / management=sky / cognition=紫
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MetricDomain = "production" | "editing" | "publishing" | "management" | "cognition";

const DOMAIN_BAR: Record<MetricDomain, string> = {
  production: "border-t-teal-500",
  editing: "border-t-purple-500",
  publishing: "border-t-orange-500",
  management: "border-t-sky-500",
  cognition: "border-t-violet-400",
};

const DOMAIN_ICON: Record<MetricDomain, string> = {
  production: "text-teal-500",
  editing: "text-purple-500",
  publishing: "text-orange-500",
  management: "text-sky-500",
  cognition: "text-violet-400",
};

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  /** 环比变化（+18.4% / -4 镜），正数绿、负数红语义 */
  change?: string;
  domain?: MetricDomain;
  icon?: ReactNode;
  subtext?: string;
  className?: string;
}

export function MetricCard({ label, value, unit, change, domain = "production", icon, subtext, className }: MetricCardProps) {
  const changeTone = change?.startsWith("+")
    ? "text-emerald-600"
    : change?.startsWith("-")
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-xl border border-t-[3px] bg-card p-3.5 transition-all hover:shadow-md",
        DOMAIN_BAR[domain],
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={cn("opacity-80", DOMAIN_ICON[domain])}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-bold tabular-nums">{value}</span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
        {change && <span className={cn("ml-auto font-mono text-[11px] font-semibold", changeTone)}>{change}</span>}
      </div>
      {subtext && <p className="mt-1.5 border-t pt-1.5 text-[10px] text-muted-foreground">{subtext}</p>}
    </div>
  );
}
