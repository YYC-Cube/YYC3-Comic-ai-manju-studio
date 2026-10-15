/**
 * G0-G5 门禁等级定义（M3 · 迁移自 MiniMax-3 原型 src/tokens，单一事实源）
 * 与引擎 YYC3-74 护栏同语义：G1=12 字段 Schema 校验 / G3=音画合规
 */

/** 角色一致性 Ref 评分及格线（%） */
export const REF_CONSISTENCY_PASS = 80;
/** SyncNet 音画同步及格线 */
export const SYNCNET_PASS = 0.75;
/** 待定复核下界：0.60 – SYNCNET_PASS 进入 review 泳道 */
export const SYNCNET_REVIEW_MIN = 0.6;
/** 宗师综合质检及格分 */
export const QA_SCORE_PASS = 85;

export type SyncNetVerdict = "passed" | "review" | "failed";

/**
 * 按 SyncNet 评分判定泳道归属（批量生成三泳道的唯一判定函数）：
 * score ≥ SYNCNET_PASS → passed；SYNCNET_REVIEW_MIN ≤ score < SYNCNET_PASS → review；其余 → failed
 */
export function classifySyncNet(score: number): SyncNetVerdict {
  if (score >= SYNCNET_PASS) return "passed";
  if (score >= SYNCNET_REVIEW_MIN) return "review";
  return "failed";
}

export const GATE_LEVELS = [
  { id: "G0", name: "立项准入", threshold: "版权确权 100%" },
  { id: "G1", name: "分镜就绪", threshold: "12 字段完整 & Schema 校验通过" },
  { id: "G2", name: "资产一致", threshold: `角色一致性 Ref 评分 ≥ ${REF_CONSISTENCY_PASS}%` },
  { id: "G3", name: "音画合规", threshold: `SyncNet ≥ ${SYNCNET_PASS} & PII 0 泄露` },
  { id: "G4", name: "成片质检", threshold: `宗师综合质检分 ≥ ${QA_SCORE_PASS} 分` },
  { id: "G5", name: "发布就绪", threshold: "格式自适应 & 敏感词通过" },
] as const;

/** 当前产线主检门禁（音画合规）— 页面高亮判定的唯一字面量锚点 */
export const GATE_CURRENT_ID = "G3";

export type GateLevel = (typeof GATE_LEVELS)[number]["id"];
