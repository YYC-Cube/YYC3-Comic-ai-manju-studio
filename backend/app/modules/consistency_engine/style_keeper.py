# ==============================================================
# YYC³ 漫剧生产系统 · 风格保持器 style_keeper v1.0（M3 主体 · TC-G3-009）
# 对齐：YYC3-08 §6.1（风格种子 + LUT + 笔触参数持久化）
#      skills/04-创想灵韵/style-keeping SKILL.md（输入 project_id → 输出 style_profile）
# 三段（复用 anchor_guard 模式）：
#   get_profile     生成前：加载/确定性派生项目风格档案（种子/LUT/笔触），持久化防漂移
#   apply_prompt    生成中：风格参数注入 image_prompt（风格前缀锚定，补齐提示词三要素）
#   post_check      生成后：候选帧色彩风格比对（PIL 色彩矩 + 直方图），低于阈值打回（≤2 次）
# 红线（镜像 anchor_guard）：
#   1) 风格档案必须确定性派生——同 project_id 跨进程/跨镜头参数完全一致（TC-G3-009）
#   2) 图像级判定必须基于真实图像分析（last_mode != pil_hist 的帧不得进入生产判定）
#   3) 档案一经持久化不得原地改写（只读锚定，防风格漂移）
# ==============================================================
import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

STYLE_SIM_THRESHOLD = 0.85   # 候选帧风格相似度门禁（对齐 G3 一致性阈值口径）
MAX_ATTEMPTS = 2             # 打回重绘上限（超限转人工，防死循环）

# 风格档案库根目录（NAS 标准路径；本地兜底为 backend/style_profiles）
DEFAULT_PROFILES_ROOT = os.environ.get(
    "STYLE_PROFILES_ROOT", "/mnt/nas/assets/style_profiles"
)
LOCAL_FALLBACK_ROOT = str(
    Path(__file__).resolve().parents[3] / "style_profiles"
)

# 可选：真实图像分析依赖（PIL 存在性延迟探测，缺失即降级并显式留证）
try:  # noqa: SIM105 — 显式探测依赖可用性
    from PIL import Image  # type: ignore

    _PIL_OK = True
except ImportError:  # pragma: no cover — 环境探测分支
    Image = None  # type: ignore[assignment]
    _PIL_OK = False


def _profiles_root() -> str:
    return DEFAULT_PROFILES_ROOT if os.path.isdir(DEFAULT_PROFILES_ROOT) else LOCAL_FALLBACK_ROOT


class StyleKeeper:
    """风格保持器：项目风格档案的派生/持久化/注入/比对闭环

    档案结构 style_profile：
      seed            32bit 确定性风格种子（喂给生成引擎）
      lut             色彩配置（色温/色调/对比/饱和/阴影/高光）
      brush           笔触参数（线宽/上色法/纹理强度/描边风格）
      derived         派生方式标识（sha256-deterministic）
    """

    def __init__(self, profiles_root: Optional[str] = None,
                 threshold: float = STYLE_SIM_THRESHOLD,
                 max_attempts: int = MAX_ATTEMPTS):
        self.profiles_root = profiles_root or _profiles_root()
        self.threshold = threshold
        self.max_attempts = max_attempts
        self.last_mode = None  # 最近一次 post_check 的图像分析来源（透明留证）

    # ── 生成前：档案派生与持久化 ──
    def _derive_profile(self, project_id: str) -> dict:
        """由 project_id 确定性派生风格档案（同 ID 同档案，跨进程稳定）"""
        h = hashlib.sha256(project_id.encode("utf-8")).digest()
        return {
            "project_id": project_id,
            "version": "v1",
            "derived": "sha256-deterministic",
            "seed": int.from_bytes(h[0:4], "big"),
            "lut": {
                "color_temp_k": round(3000 + (h[4] / 255) * 4000, 1),
                "tint": round((h[5] / 255 - 0.5) * 20, 2),
                "contrast": round(0.90 + (h[6] / 255) * 0.40, 3),
                "saturation": round(0.80 + (h[7] / 255) * 0.60, 3),
                "shadow_lift": round((h[8] / 255) * 0.20, 3),
                "highlight_gain": round(0.90 + (h[9] / 255) * 0.30, 3),
            },
            "brush": {
                "line_weight": round(0.80 + (h[10] / 255) * 0.80, 3),
                "coloring": ["cel", "soft", "crosshatch"][h[11] % 3],
                "texture_intensity": round(h[12] / 255, 3),
                "edge_style": ["sharp", "soft"][h[13] % 2],
            },
        }

    def get_profile(self, project_id: str, persist: bool = True) -> dict:
        """加载项目风格档案；不存在则派生并持久化（只读锚定，防漂移）"""
        root = Path(self.profiles_root) / project_id
        manifest = root / "profile.json"
        if manifest.is_file():
            with open(manifest, "r", encoding="utf-8") as f:
                return json.load(f)
        profile = self._derive_profile(project_id)
        if persist:
            root.mkdir(parents=True, exist_ok=True)
            with open(manifest, "w", encoding="utf-8") as f:
                json.dump(profile, f, ensure_ascii=False, indent=2)
            logger.info(f"[style_keeper] 项目 {project_id} 风格档案已派生并持久化：{manifest}")
        return profile

    # ── 生成中：风格注入 ──
    def apply_prompt(self, project_id: str, prompt: str) -> dict:
        """产出携带风格锚定前缀的 image_prompt（补齐提示词三要素之风格前缀）"""
        p = self.get_profile(project_id)
        prefix = (
            f"【风格锚定】seed={p['seed']}；"
            f"LUT 色温 {p['lut']['color_temp_k']}K / 对比 {p['lut']['contrast']} / "
            f"饱和 {p['lut']['saturation']}；"
            f"笔触 {p['brush']['coloring']} / 描边 {p['brush']['edge_style']} / "
            f"线宽 {p['brush']['line_weight']}。"
        )
        return {"profile": p, "style_prefix": prefix,
                "image_prompt": prefix + prompt}

    # ── 参数级核验（TC-G3-009 主判定：跨镜头参数完全一致）──
    def verify_params_match(self, project_id: str,
                            params_snapshots: list[dict]) -> dict:
        """核验各镜头快照的风格参数与档案完全一致

        :param params_snapshots: 各镜头落库的风格参数（seed/lut/brush 三键）
        """
        profile = self.get_profile(project_id)
        keys = ("seed", "lut", "brush")
        mismatches = []
        for i, snap in enumerate(params_snapshots):
            for k in keys:
                if snap.get(k) != profile[k]:
                    mismatches.append({"shot_index": i, "field": k})
        return {"passed": not mismatches, "project_id": project_id,
                "snapshot_count": len(params_snapshots),
                "mismatches": mismatches,
                "reason": "各镜头风格参数与档案完全一致" if not mismatches
                else f"{len(mismatches)} 处参数漂移，详见 mismatches"}

    # ── 生成后：候选帧色彩风格比对 ──
    @staticmethod
    def _style_vector(image_path: str) -> np.ndarray:
        """图像风格向量：RGB 均值(3) + 标准差(3) + 量化直方图(24)，共 30 维"""
        img = Image.open(image_path).convert("RGB").resize((64, 64))
        arr = np.asarray(img, dtype=np.float32) / 255.0
        mean = arr.mean(axis=(0, 1))
        std = arr.std(axis=(0, 1))
        hist = np.stack([
            np.histogram(arr[..., c], bins=8, range=(0.0, 1.0))[0]
            for c in range(3)
        ]).flatten()
        hist = hist / max(hist.sum(), 1.0)
        return np.concatenate([mean, std, hist])

    def post_check(self, project_id: str, candidate_image: str,
                   reference_image: str, attempts: int = 0) -> dict:
        """候选帧风格判定：accept / redraw（≤2 次）/ escalate（超限或降级转人工）

        :param reference_image: 项目风格基准帧（角色设定图/首镜定妆帧）
        :param attempts: 已执行的生成次数（含本次），由调用方随重绘递增
        """
        if not _PIL_OK:
            # 红线：无真实图像分析能力时不得凭空判定
            self.last_mode = "degraded"
            return {"passed": False, "action": "escalate", "attempts": attempts,
                    "similarity": None,
                    "reason": "PIL 不可用，无法进行真实风格比对——转人工/素材检查"}
        if not (os.path.isfile(candidate_image) and os.path.isfile(reference_image)):
            self.last_mode = "degraded"
            return {"passed": False, "action": "blocked", "attempts": attempts,
                    "similarity": None, "reason": "候选帧或基准帧文件缺失"}

        self.last_mode = "pil_hist"
        ref_v = self._style_vector(reference_image)
        cand_v = self._style_vector(candidate_image)
        sim = float(ref_v @ cand_v /
                    (np.linalg.norm(ref_v) * np.linalg.norm(cand_v) + 1e-9))

        if sim >= self.threshold:
            return {"passed": True, "action": "accept",
                    "similarity": round(sim, 4), "attempts": attempts,
                    "threshold": self.threshold, "mode": self.last_mode}
        if attempts < self.max_attempts:
            logger.warning(
                f"[style_keeper] 项目 {project_id} 候选帧风格相似度 "
                f"{sim:.4f} < {self.threshold}，打回重绘（第 {attempts + 1}/{self.max_attempts} 次）")
            return {"passed": False, "action": "redraw",
                    "similarity": round(sim, 4), "attempts": attempts,
                    "threshold": self.threshold, "mode": self.last_mode,
                    "reason": "风格低于阈值，携带风格锚定前缀重绘"}
        logger.warning(
            f"[style_keeper] 项目 {project_id} 已达重绘上限 {self.max_attempts}，转人工")
        return {"passed": False, "action": "escalate",
                "similarity": round(sim, 4), "attempts": attempts,
                "threshold": self.threshold, "mode": self.last_mode,
                "reason": "重绘上限已满，转人工介入"}


__all__ = ["StyleKeeper", "STYLE_SIM_THRESHOLD", "MAX_ATTEMPTS"]
