"use client";

/**
 * 简化版品牌时钟环：八 Agent 点位环布 + 旋转扫描针
 * Auth 域（login / register）共用；完整 347 行 AuthBrandClock 随视觉深化批次迁移（TODO）
 */
import { AGENTS_LIST } from "@/lib/agents";
import { cn } from "@/lib/utils";

interface AgentChronoRingProps {
  diameter?: number;
  /** 当前高亮的 Agent id（默认 语枢·万物） */
  activeAgentId?: string;
}

export function AgentChronoRing({
  diameter = 320,
  activeAgentId = "yushu-wanwu",
}: AgentChronoRingProps) {
  return (
    <div className="relative" style={{ width: diameter, height: diameter }}>
      <div className="absolute inset-0 rounded-full border border-border/60" />
      <div className="absolute inset-8 rounded-full border border-border/40" />
      <div className="absolute inset-16 rounded-full border border-border/25" />
      {/* 旋转扫描针 */}
      <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
        <div className="absolute left-1/2 top-1/2 h-px w-[calc(50%-16px)] origin-left bg-gradient-to-r from-primary/80 to-transparent" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-xs tracking-widest text-primary">AI FAMILY</span>
      </div>
      {AGENTS_LIST.map((a, i) => {
        const angle = ((i * 45 - 90) * Math.PI) / 180;
        const r = diameter / 2 - 8;
        const x = diameter / 2 + r * Math.cos(angle);
        const y = diameter / 2 + r * Math.sin(angle);
        const isActive = a.id === activeAgentId;
        return (
          <div
            key={a.id}
            className="absolute flex w-12 flex-col items-center"
            style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
          >
            <span
              className={cn("rounded-full", isActive ? "h-2.5 w-2.5 animate-pulse" : "h-2 w-2 opacity-70")}
              style={{ backgroundColor: a.color }}
            />
            <span className="mt-1 font-mono text-[9px] text-muted-foreground">
              {a.name.split("·")[1]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
