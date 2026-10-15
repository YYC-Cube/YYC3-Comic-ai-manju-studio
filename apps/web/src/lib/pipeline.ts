/**
 * 六阶段流水线定义（M3 · 迁移自 MiniMax-3 原型 src/tokens PIPELINE_STAGES）
 * route 已对齐 manju App Router 路径
 */
export interface PipelineStage {
  id: string;
  stage: number;
  name: string;
  agent: string;
  route: string;
}

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  { id: "S1", stage: 1, name: "小说立项", agent: "言启·千行 / 元启·天枢", route: "/script" },
  { id: "S2", stage: 2, name: "剧本分镜", agent: "创想·灵韵 / 语枢·万物", route: "/storyboard" },
  { id: "S3", stage: 3, name: "图像生成", agent: "创想·灵韵 / 格物·宗师", route: "/production" },
  { id: "S4", stage: 4, name: "视频合成", agent: "语枢·万物 / 预见·先知", route: "/production" },
  { id: "S5", stage: 5, name: "成片交付", agent: "格物·宗师 / 智云·守护", route: "/video" },
  { id: "S6", stage: 6, name: "运营反哺", agent: "知遇·伯乐 / 预见·先知", route: "/analytics" },
] as const;
