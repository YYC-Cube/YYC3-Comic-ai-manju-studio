# ==============================================================
# YYC³ 漫剧生产系统 · 一致性锚定守卫 anchor_guard v1.0（M3 主体 · TC-G3-003）
# 对齐：YYC3-08 §6.1 三段锚定设计 ｜ 前置：face_encoder 真实 512 维特征库（G3-001）
# 三段：
#   pre_anchor        生成前：加载角色特征向量 + 生成锚定上下文（prompt 前缀）
#   during_constraint 生成中：ControlNet 姿态骨架约束描述（真实接入待 M3 视听，桩态可联调）
#   post_check        生成后：候选帧特征 vs 角色特征余弦比对，<阈值打回重绘（≤2 次），超限转人工
# 红线：比对必须基于真实模型特征（last_mode != insightface 的帧不得进入生产判定）
# ==============================================================
import logging

from app.modules.consistency_engine.face_encoder import FaceEncoder, FEATURE_DIM

logger = logging.getLogger(__name__)

DEFAULT_THRESHOLD = 0.85   # TC-G3-002 实证门禁阈值
MAX_ATTEMPTS = 2           # 打回重绘上限（超限转人工，防死循环）


class AnchorGuard:
    """一致性锚定守卫：生成前锚定 / 生成中约束 / 生成后打回闭环"""

    def __init__(self, library_root: str = None,
                 threshold: float = DEFAULT_THRESHOLD,
                 max_attempts: int = MAX_ATTEMPTS):
        self.encoder = FaceEncoder(library_root=library_root)
        self.threshold = threshold
        self.max_attempts = max_attempts

    # ── 生成前：特征锚定 ──
    def pre_anchor(self, char_id: str, prompt: str = "") -> dict:
        """加载角色特征并产出锚定上下文；角色未建库即 BLOCKED（不进生成）"""
        ref = self.encoder.load_feature(char_id)
        if ref is None:
            return {"ok": False, "action": "blocked",
                    "reason": f"角色 {char_id} 未建库（先跑 build_face_library）"}
        if ref.shape != (FEATURE_DIM,):
            return {"ok": False, "action": "blocked",
                    "reason": f"角色 {char_id} 特征维度异常：{ref.shape}"}
        return {
            "ok": True,
            "action": "anchored",
            "char_id": char_id,
            "reference_dim": int(ref.shape[0]),
            "anchor_prompt_prefix": (
                f"【一致性锚定】角色 {char_id}：严格遵循角色设定图的面部特征、"
                f"发型、服饰与配色；保持全剧统一风格种子。"),
            "user_prompt": prompt,
        }

    # ── 生成中：姿态/构图约束（桩态：真实 ControlNet 接入待 M3 视听产能）──
    def during_constraint(self, char_id: str) -> dict:
        return {
            "constraint": "controlnet_pose",
            "mode": "stub",
            "char_id": char_id,
            "note": "真实 ControlNet 姿态骨架约束待 DramaToolGateway 桩→实（M3 视听）",
        }

    # ── 生成后：比对与打回闭环 ──
    def post_check(self, char_id: str, candidate_image: str,
                   attempts: int = 0) -> dict:
        """候选帧一致性判定：accept / redraw（≤2 次）/ escalate（超限转人工）

        :param attempts: 已执行的生成次数（含本次），由调用方随重绘递增
        """
        ref = self.encoder.load_feature(char_id)
        if ref is None:
            return {"passed": False, "action": "blocked",
                    "reason": f"角色 {char_id} 无参考特征", "attempts": attempts}

        cand = self.encoder.extract_feature(candidate_image)
        real_mode = self.encoder.last_mode
        if real_mode != "insightface":
            # 红线：哈希降级帧不得进入生产一致性判定
            return {"passed": False, "action": "escalate", "attempts": attempts,
                    "similarity": None, "reason": f"候选帧为降级特征（{real_mode}），"
                    "无法进行真实一致性判定——转人工/素材检查"}

        sim = float(ref @ cand)
        if sim >= self.threshold:
            return {"passed": True, "action": "accept", "similarity": round(sim, 4),
                    "attempts": attempts, "threshold": self.threshold,
                    "mode": real_mode}
        if attempts < self.max_attempts:
            logger.warning(
                f"[anchor_guard] {char_id} 候选帧相似度 {sim:.4f} < {self.threshold}，"
                f"打回重绘（第 {attempts + 1}/{self.max_attempts} 次）")
            return {"passed": False, "action": "redraw",
                    "similarity": round(sim, 4), "attempts": attempts,
                    "threshold": self.threshold, "mode": real_mode,
                    "reason": "一致性低于阈值，携带锚定前缀重绘"}
        logger.warning(
            f"[anchor_guard] {char_id} 已达重绘上限 {self.max_attempts}，转人工")
        return {"passed": False, "action": "escalate",
                "similarity": round(sim, 4), "attempts": attempts,
                "threshold": self.threshold, "mode": real_mode,
                "reason": "重绘上限已满，转人工介入"}


__all__ = ["AnchorGuard", "DEFAULT_THRESHOLD", "MAX_ATTEMPTS"]
