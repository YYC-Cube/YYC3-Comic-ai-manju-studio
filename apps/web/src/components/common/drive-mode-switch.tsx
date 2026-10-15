"use client";

/**
 * 驾驶模式切换（M3 · 原型 DriveModeSwitch 的 shadcn 化重写）
 * L0 全自动 / L1 半自动（默认） / L2 人工主导
 */
import { DRIVE_MODES } from "@/lib/drive-modes";
import { cn } from "@/lib/utils";
import type { DriveModeId } from "@/types/domain";

interface DriveModeSwitchProps {
  currentMode: DriveModeId;
  onChange: (mode: DriveModeId) => void;
  size?: "sm" | "md";
  variant?: "compact" | "full";
  className?: string;
}

const ACTIVE_TONE_CLASSES = {
  teal: "border-teal-500/60 bg-teal-500/15 text-teal-600",
  sky: "border-sky-500/60 bg-sky-500/15 text-sky-600",
  amber: "border-amber-500/60 bg-amber-500/15 text-amber-600",
} as const;

const DOT_TONE_CLASSES = {
  teal: "bg-teal-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
} as const;

const MODES: DriveModeId[] = ["L0", "L1", "L2"];

export function DriveModeSwitch({
  currentMode,
  onChange,
  size = "md",
  variant = "compact",
  className,
}: DriveModeSwitchProps) {
  return (
    <div
      className={cn("inline-flex items-center rounded-lg border bg-muted/50 p-0.5", className)}
      title={`当前驾驶模式：${DRIVE_MODES[currentMode].name} - ${DRIVE_MODES[currentMode].desc}`}
    >
      {MODES.map((mode) => {
        const info = DRIVE_MODES[mode];
        const isActive = currentMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md border font-mono transition-all",
              size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
              isActive
                ? cn("font-medium shadow-sm", ACTIVE_TONE_CLASSES[info.tone])
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                DOT_TONE_CLASSES[info.tone],
                isActive ? "animate-pulse" : "opacity-40"
              )}
            />
            <span className="font-bold">{mode}</span>
            {variant === "full" && <span className="text-[11px] opacity-90">{info.name}</span>}
          </button>
        );
      })}
    </div>
  );
}
