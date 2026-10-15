/**
 * AI Family 八 Agent 名录（M3 · 迁移自 MiniMax-3 原型 src/tokens AGENTS_LIST）
 * 视觉平等红线：头像尺寸/亮度一致，仅靠专属色区分角色；
 * 专属色只允许以「认知圆点 / 名录文字」形式出现（同原型 COGNITION 约束）
 */

export interface AgentSpec {
  id: string;
  name: string;
  /** 专属色（视觉平等红线下的唯一区分维度） */
  color: string;
  role: string;
  desc: string;
}

export const AGENTS_LIST: AgentSpec[] = [
  { id: "yanqi-qianxing", name: "言启·千行", color: "#FFD700", role: "意图识别", desc: "意图识别、语音转写、语义解析、分发路由" },
  { id: "yushu-wanwu", name: "语枢·万物", color: "#FF69B4", role: "数据分析", desc: "数据分析、内容提炼、信息聚合、反哺洞察" },
  { id: "yujian-xianzhi", name: "预见·先知", color: "#00BFFF", role: "趋势预测", desc: "趋势预测、异常预警、调度规划、掉线预测" },
  { id: "zhiyu-bole", name: "知遇·伯乐", color: "#FFFFFF", role: "推荐优化", desc: "种子推荐、参数优化、平台推荐、效果匹配" },
  { id: "yuanqi-tianshu", name: "元启·天枢", color: "#00e0b8", role: "全局调度", desc: "全局调度、六阶段流水编排、任务分发、仲裁主持" },
  { id: "zhiyun-shouhu", name: "智云·守护", color: "#9d7cd8", role: "安全防护", desc: "异常检测、风险防护、输入过滤、审计脱敏" },
  { id: "gewu-zongshi", name: "格物·宗师", color: "#C0C0C0", role: "质量校验", desc: "质量评分、标准校验、缺陷识别、复检门禁" },
  { id: "chuangxiang-lingyun", name: "创想·灵韵", color: "#FF7A5C", role: "创意生成", desc: "提示词生成、创意优化、分镜创作、剧本改写" },
];

export const AGENTS_MAP: Record<string, AgentSpec> = AGENTS_LIST.reduce(
  (acc, agent) => {
    acc[agent.id] = agent;
    return acc;
  },
  {} as Record<string, AgentSpec>
);

export const DEFAULT_AGENT_ID = "yuanqi-tianshu";

/** 议事厅常驻三角角色锚定（仲裁主持 / 质检方 / 创作方） */
export const COUNSEL_ROLE_AGENT_IDS = {
  arbiter: DEFAULT_AGENT_ID,
  quality: "gewu-zongshi",
  creator: "chuangxiang-lingyun",
} as const;

/**
 * ReAct-C 九步闭环管线（步序 → 执行 Agent 的唯一事实源）
 * 与 mock/production.ts MOCK_TASKS 的 stepsTrace 步序一致
 */
export const NINE_STEP_PIPELINE = [
  { step: 1, name: "安全过滤", agentId: "zhiyun-shouhu" },
  { step: 2, name: "意图路由", agentId: "yanqi-qianxing" },
  { step: 3, name: "RAG注入", agentId: "yushu-wanwu" },
  { step: 4, name: "分析预测", agentId: "yujian-xianzhi" },
  { step: 5, name: "报告润色", agentId: "chuangxiang-lingyun" },
  { step: 6, name: "全局决策", agentId: "yuanqi-tianshu" },
  { step: 7, name: "质量校验", agentId: "gewu-zongshi" },
  { step: 8, name: "审计脱敏", agentId: "zhiyun-shouhu" },
  { step: 9, name: "画像更新", agentId: "zhiyu-bole" },
] as const;
