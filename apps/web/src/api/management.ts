/**
 * 管理域 API（M5-P2 · 幻影端点层）
 * 后端端点未落地：全部经 withFallback 降级演示数据 + 页面 Badge 留痕；
 * 端点形状对齐 MiniMax-3 原型 DEV_META 口径，落地时按此契约实现后端。
 */
import { request } from "@/api/client";

// ── 运营数据看板（Analytics & Reflex）──────────────────────────

export interface AnalyticsFunnelStage {
  label: string;
  value: number;
  percent: number;
  color: string;
}

export interface AnalyticsTopShot {
  rank: number;
  shot: string;
  name: string;
  views: string;
  completion: string;
}

export interface AnalyticsInsights {
  kpis: { totalViews: string; avgCompletion: string; interactionRate: string; estRevenue: string };
  funnel: AnalyticsFunnelStage[];
  topShots: AnalyticsTopShot[];
  reflex: { agents: string; suggestion: string };
}

/** 运营洞察（原型口径 /api/v2/management/analytics/reflex-insights） */
export function getAnalyticsInsights(): Promise<AnalyticsInsights> {
  return request<AnalyticsInsights>("/api/v1/management/analytics/insights");
}

// ── 成本中心（Cost Center）────────────────────────────────────

export interface AgentCostItem {
  agentId: string;
  name: string;
  token: string;
  gpuHours: string;
  cost: number;
}

export interface CostLedger {
  perEpisode: string;
  monthlySpend: string;
  monthlySpendDelta: string;
  nightlyCapacity: string;
  totalTokens: string;
  agentCosts: AgentCostItem[];
  agentCostTotal: number;
  offpeak: { window: string; currentPhase: string; suggestedTasks: number; queuedBatches: number };
}

/** 成本台账（原型口径 /api/v2/management/cost/ledger） */
export function getCostLedger(): Promise<CostLedger> {
  return request<CostLedger>("/api/v1/management/cost/ledger");
}

// ── 智能体训练中心（Agent Lab）─────────────────────────────────

export interface LearningSample {
  id: string;
  type: string;
  sourceProject: string;
  sourceShot: string;
  timestamp: string;
  agentName: string;
  recommendation: string;
  confidenceBefore: number;
  confidenceExpected: number;
  reviewNote: string;
  status: "pending" | "approved" | "rejected";
}

export interface MemoryEntry {
  id: string;
  scope: "SESSION" | "PROJECT" | "GLOBAL";
  category: string;
  usageCount: number;
  content: string;
  source: string;
  traceShots: string[];
}

/** 待审学习样本（原型口径 ENDPOINTS.learningSamples） */
export function listLearningSamples(): Promise<LearningSample[]> {
  return request<LearningSample[]>("/api/v1/management/agents/learning-samples");
}

/** 三层记忆条目 */
export function listAgentMemories(): Promise<MemoryEntry[]> {
  return request<MemoryEntry[]>("/api/v1/management/agents/memories");
}

// ── 权限与安全审计（RBAC & Audit）──────────────────────────────

export interface RbacMatrixRow {
  module: string;
  admin: string;
  director: string;
  editor: string;
  ops: string;
}

/** RBAC 四维矩阵（原型口径 /api/v2/management/rbac/matrix） */
export function getRbacMatrix(): Promise<RbacMatrixRow[]> {
  return request<RbacMatrixRow[]>("/api/v1/management/rbac/matrix");
}

// ── 合规审计（Compliance）──────────────────────────────────────

export interface ComplianceEvent {
  id: string;
  level: "pass" | "warn" | "block";
  title: string;
  detail: string;
  timestamp: string;
}

/** 合规事件流 */
export function listComplianceEvents(): Promise<ComplianceEvent[]> {
  return request<ComplianceEvent[]>("/api/v1/management/compliance/events");
}

// ── RAG 语料管理 ──────────────────────────────────────────────

export interface RagCorpus {
  name: string;
  docs: number;
  chunks: number;
  vectors: number;
  hitRate: string;
}

/** RAG 语料库清单 */
export function listRagCorpora(): Promise<RagCorpus[]> {
  return request<RagCorpus[]>("/api/v1/management/rag/corpora");
}

// ── 协同批注（Collab Comments）─────────────────────────────────

export interface CollabReply {
  author: string;
  content: string;
  createdAt: string;
}

export interface CollabComment {
  id: string;
  author: string;
  role: string;
  createdAt: string;
  content: string;
  status: "pending" | "resolved";
  /** 锚点目标路由（如 /storyboard）与锚点名 */
  targetRoute: string;
  targetAnchor: string;
  replies: CollabReply[];
}

/** 协同批注流 */
export function listCollabComments(): Promise<CollabComment[]> {
  return request<CollabComment[]>("/api/v1/management/collab/comments");
}

// ── 项目设定集（Lore）与系列剧集（Series）──────────────────────

export interface LoreEntry {
  id: string;
  category: string;
  title: string;
  summary: string;
  linkedShots: number;
}

export function listLoreEntries(): Promise<LoreEntry[]> {
  return request<LoreEntry[]>("/api/v1/management/lore/entries");
}

export interface SeriesItem {
  id: string;
  name: string;
  episodes: number;
  status: string;
  completion: number;
}

export function listSeries(): Promise<SeriesItem[]> {
  return request<SeriesItem[]>("/api/v1/management/series");
}
