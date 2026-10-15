"use client";

/**
 * 缩略图统一组件（M3 · 原型 Thumb 原样语义移植）
 * 加载失败自动降级为确定性渐变占位（同标签同色，纯函数可测），保持版面密度
 */
import { useState } from "react";
import { cn } from "@/lib/utils";

/** 从标签派生确定性占位渐变（同标签同色） */
export function placeholderTone(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 35% 18%), hsl(${(h + 40) % 360} 45% 10%))`;
}

interface ThumbProps {
  /** 图片地址；空值直接渲染占位 */
  src?: string;
  alt?: string;
  /** 占位标签（镜头号/标题等），用于派生色调与显示字符 */
  label: string;
  className?: string;
}

export function Thumb({ src, alt = "", label, className }: ThumbProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={label}
        data-degraded="true"
        className={cn("flex items-center justify-center font-mono text-[10px] text-muted-foreground", className)}
        style={{ background: placeholderTone(label) }}
      >
        <span>{label.slice(0, 4)}</span>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />;
}
