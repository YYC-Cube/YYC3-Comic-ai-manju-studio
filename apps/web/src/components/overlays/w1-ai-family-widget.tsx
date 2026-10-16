"use client";

/**
 * W1 AI Family 协同中枢浮窗（M5-R6 · 迁移自 MiniMax-3 原型 widgets/W1AIFamilyWidget）
 * 真链路裁决：
 *   - 指令发送 = 真 A2A 异步投递（POST /factory/a2a/tasks，202 回执真实呈现 trace_id）；
 *     原型 setTimeout 模拟 Agent 回复为伪造，已剔除——执行回执经任务域回流（见 /tasks）
 *   - 头部在线状态 = 真 A2A 诊断（GET /factory/a2a/status，gateway_ok 诚实语义，不降级）
 *   - 原型种子消息（《凌霄剑仙》虚构生产上下文）与「知遇·伯乐主动提示」（虚构完播率洞察）
 *     不迁——初始消息流为真实空态
 *   - 快捷指令均为真路由；「发起协商」= 真 openCounsel 链路
 * 布局：收起态悬浮球 → 展开右下角 400x600 浮窗（Agent 切换条 / 消息流 / 快捷指令 / 输入框）
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Maximize2, Send, Sparkles, X } from "lucide-react";
import { getA2AStatus, submitA2ATask, type A2AStatus } from "@/api/a2a";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { Badge } from "@/components/ui/badge";
import { AGENTS_LIST, AGENTS_MAP, DEFAULT_AGENT_ID } from "@/lib/agents";
import { useOverlaysStore } from "@/lib/overlays-store";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  agentId?: string;
  text: string;
  /** 真 A2A 回执留痕（仅 agent 回执消息携带） */
  traceId?: string;
  tone?: "normal" | "error";
  timestamp: string;
}

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function W1AIFamilyWidget() {
  const router = useRouter();
  const { w1Open, toggleW1, openW2, openCounsel } = useOverlaysStore();

  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_AGENT_ID);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [a2aStatus, setA2aStatus] = useState<A2AStatus | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeAgent = AGENTS_MAP[selectedAgentId] ?? AGENTS_MAP[DEFAULT_AGENT_ID];

  // 展开时拉取真实 A2A 编队诊断（失败如实呈现离线，不降级伪造）
  useEffect(() => {
    if (!w1Open) return;
    let cancelled = false;
    getA2AStatus()
      .then((s) => !cancelled && setA2aStatus(s))
      .catch(() =>
        !cancelled &&
        setA2aStatus({ gateway_ok: false, gateway_url: "", agents: [], count: 0, error: "诊断请求失败" }),
      );
    return () => {
      cancelled = true;
    };
  }, [w1Open]);

  // 新消息滚到底部
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const navigate = (href: string) => {
    toggleW1();
    router.push(href);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: "user", text, timestamp: nowTime() },
    ]);
    setInputText("");
    setSending(true);

    try {
      const receipt = await submitA2ATask({
        task_type: "console.command",
        payload: { text, source: "w1-console" },
        receiver_agent_id: selectedAgentId,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "agent",
          agentId: selectedAgentId,
          text: `指令已真实投递至编排面（状态：${receipt.status ?? "queued"}）。执行回执经任务域回流，可在「任务监控」查看进展。`,
          traceId: receipt.trace_id,
          timestamp: nowTime(),
        },
      ]);
    } catch (err) {
      // 下游失败如实呈现（502 网关不可达 / 401 未认证 / 超时），不伪造成功
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "agent",
          agentId: selectedAgentId,
          text: `投递失败：${err instanceof Error ? err.message : String(err)}`,
          tone: "error",
          timestamp: nowTime(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // 收起态：右下角悬浮球
  if (!w1Open) {
    return (
      <button
        type="button"
        onClick={toggleW1}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-[#00e0b8] bg-zinc-950 shadow-2xl transition-all duration-200 hover:scale-105"
        style={{ boxShadow: "0 0 20px rgba(0, 224, 184, 0.35)" }}
        title="展开 AI Family 协同中枢"
        aria-label="展开 AI Family 协同中枢"
      >
        <Sparkles className="h-6 w-6 text-[#00e0b8]" />
      </button>
    );
  }

  const quickChips: { label: string; action: () => void }[] = [
    { label: "查看质检", action: () => navigate("/qa") },
    { label: "发起协商", action: openCounsel },
    { label: "继续生产", action: () => navigate("/production") },
    { label: "成本报告", action: () => navigate("/cost") },
    { label: "查看记忆", action: () => navigate("/admin/agents") },
  ];

  const online = a2aStatus?.gateway_ok ?? false;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl border border-[#00e0b8]/30 bg-zinc-950 shadow-2xl"
      style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 24px rgba(0,224,184,0.15)" }}
      role="dialog"
      aria-label="AI Family 协同中枢"
    >
      {/* 头部：品牌 + 真实 A2A 在线状态 */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#00e0b8]" />
          <span className="text-xs font-bold tracking-wide">YYC³ · 协同中枢</span>
          <Badge variant="secondary" className="font-mono text-[10px]">
            ReAct-C
          </Badge>
          <span
            className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground"
            title={online ? `编队 ${a2aStatus?.count ?? 0} 卡在线` : (a2aStatus?.error ?? "诊断中")}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`}
            />
            {a2aStatus === null ? "诊断中" : online ? `${a2aStatus.count} 卡在线` : "编排面离线"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openW2(selectedAgentId)}
            className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-[#00e0b8]"
            title="打开 W2 认知浮窗（九步轨迹与深度复盘）"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleW1}
            className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground"
            aria-label="收起"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 8 Agent 横向切换条 */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-2 py-2">
        {AGENTS_LIST.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgentId(agent.id)}
              className={`shrink-0 cursor-pointer rounded-lg p-1 transition-all ${
                isSelected
                  ? "bg-zinc-800 ring-1 ring-[#00e0b8]"
                  : "opacity-75 hover:bg-zinc-900 hover:opacity-100"
              }`}
              title={`${agent.name}（${agent.role}）`}
            >
              <AgentAvatar agentId={agent.id} size="sm" />
            </button>
          );
        })}
      </div>

      {/* 消息流（初始真实空态；回执为真 A2A 投递结果） */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Sparkles className="h-6 w-6 text-[#00e0b8]/40" />
            <p className="text-xs text-muted-foreground">
              暂无会话——输入指令真实投递至 {activeAgent.name}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/60">
              指令经 A2A 编排面异步执行 · 回执见任务监控
            </p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.sender === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-tr-none border border-[#00e0b8]/20 bg-zinc-800 p-2.5 text-xs shadow-sm">
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className="mt-1 block text-right font-mono text-[9px] text-muted-foreground">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }
          const agent = AGENTS_MAP[msg.agentId ?? DEFAULT_AGENT_ID] ?? AGENTS_MAP[DEFAULT_AGENT_ID];
          return (
            <div key={msg.id} className="flex max-w-[95%] items-start gap-2">
              <AgentAvatar agentId={agent.id} size="sm" />
              <div
                className={`flex-1 rounded-xl rounded-tl-none border p-3 text-xs shadow-md ${
                  msg.tone === "error" ? "border-red-500/40 bg-red-500/5" : "border-zinc-800 bg-zinc-900"
                }`}
                style={{ borderLeft: `3px solid ${msg.tone === "error" ? "#ef4444" : agent.color}` }}
              >
                <span className="mb-1.5 block text-[11px] font-bold" style={{ color: agent.color }}>
                  {agent.name}
                </span>
                <p className="leading-relaxed">{msg.text}</p>
                {msg.traceId && (
                  <span className="mt-1 block truncate font-mono text-[9px] text-muted-foreground/70">
                    trace: {msg.traceId}
                  </span>
                )}
                <span className="mt-1 block text-right font-mono text-[9px] text-muted-foreground/60">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 快捷指令（真路由 + 真议事厅入口） */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-zinc-800 bg-zinc-950/80 px-3 py-1.5">
        {quickChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={chip.action}
            className="shrink-0 cursor-pointer rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-[#00e0b8]"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 输入框（真 A2A 投递） */}
      <div className="border-t border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-[#00e0b8]/20 bg-zinc-950 px-3 py-1.5 transition-colors focus-within:border-[#00e0b8]">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`指令真实投递至 ${activeAgent.name}…`}
            className="flex-1 bg-transparent text-xs placeholder-zinc-600 focus:outline-none"
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
            className="cursor-pointer rounded-lg bg-[#00e0b8] p-1.5 font-bold text-zinc-950 transition-colors hover:bg-[#00c9a5] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="发送"
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/70">
          <span>当前由 {activeAgent.name} 响应 · ReAct-C 九步模式</span>
          <span className="font-mono">Enter 发送</span>
        </div>
      </div>
    </div>
  );
}
