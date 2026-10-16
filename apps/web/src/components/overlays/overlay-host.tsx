"use client";

/**
 * 全局浮层宿主机（M5-R6 · Portal 挂载三件套）
 * createPortal 挂 document.body：脱离 Sidebar（z-40）层叠上下文，浮层 z-50 / 议事厅 z-60 恒在顶层；
 * 仅受控壳挂载（Auth 公开路由不渲染悬浮球）；mounted 门防 SSR 水合差异
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AgentCounselModal } from "@/components/overlays/agent-counsel-modal";
import { W1AIFamilyWidget } from "@/components/overlays/w1-ai-family-widget";
import { W2CognitionWidget } from "@/components/overlays/w2-cognition-widget";

export function OverlayHost() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <>
      <W1AIFamilyWidget />
      <W2CognitionWidget />
      <AgentCounselModal />
    </>,
    document.body,
  );
}
