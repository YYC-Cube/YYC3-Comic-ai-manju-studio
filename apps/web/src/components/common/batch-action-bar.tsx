"use client";

/**
 * 批量操作浮动条（M3 · 原型 BatchActionBar 的 shadcn 化重写）
 * 选中数 > 0 时浮现于视口底部居中
 */
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BatchAction {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick: () => void;
}

interface BatchActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClear: () => void;
  actions: BatchAction[];
  className?: string;
}

export function BatchActionBar({ selectedCount, totalCount, onClear, actions, className }: BatchActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl border bg-card/95 px-5 py-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4",
        className
      )}
    >
      <div className="flex items-center gap-2 border-r pr-3">
        <span className="text-xs text-muted-foreground">已选择</span>
        <span className="font-mono text-sm font-bold tabular-nums text-primary">{selectedCount}</span>
        {totalCount !== undefined && (
          <span className="text-xs text-muted-foreground">/ {totalCount}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions.map((act) => (
          <Button
            key={act.label}
            size="sm"
            variant={act.variant === "danger" ? "destructive" : act.variant === "primary" ? "default" : "outline"}
            onClick={act.onClick}
          >
            {act.icon}
            {act.label}
          </Button>
        ))}
      </div>

      <Button variant="ghost" size="icon" onClick={onClear} title="取消全部选择" className="h-7 w-7">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
