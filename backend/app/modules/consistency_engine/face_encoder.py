"""
@file: backend/app/modules/consistency_engine/face_encoder.py
@description: 512 维人脸特征编码器 — 优先真实模型（insightface/face_recognition），
              缺失时降级为确定性哈希伪特征（保证同一角色向量稳定，可比对）。
@version: v1.0.0
@status: active
@align: P1-C face_encoder 512 维特征库建库
@redline: 特征维度必须为 512；降级模式必须确定性（同图同向量），不得随机
"""
import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

FEATURE_DIM = 512

# 特征库根目录（NAS 标准路径；本地兜底为 backend/face_library）
DEFAULT_LIBRARY_ROOT = os.environ.get(
    "FACE_LIBRARY_ROOT", "/mnt/nas/assets/characters"
)
LOCAL_FALLBACK_ROOT = str(Path(__file__).resolve().parents[3] / "face_library")


def _library_root() -> str:
    return DEFAULT_LIBRARY_ROOT if os.path.isdir(DEFAULT_LIBRARY_ROOT) else LOCAL_FALLBACK_ROOT


class FaceEncoder:
    """512 维人脸特征编码器

    优先级：insightface（512d）> face_recognition（128d→零填充至 512d）> 哈希降级（512d）
    降级模式（mode=degraded）：基于图片字节的 SHA-512 派生确定性向量，
    保证同一图片两次编码余弦相似度=1.0，可用于建库冒烟与一致性比对。
    """

    def __init__(self, library_root: Optional[str] = None):
        self.library_root = library_root or _library_root()
        self.mode = "degraded"  # 默认降级，真实模型加载成功后切换
        self.last_mode = None  # 最近一次 extract_feature 的实际来源（G3-002 透明留证）
        self._real_encoder = None
        self._real_dim = None
        self._try_load_real_model()

    # ── 真实模型加载（尽力而为，失败即降级）──
    def _try_load_real_model(self):
        # 1) insightface（原生 512 维）
        try:
            from insightface.app import FaceAnalysis  # type: ignore

            app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            app.prepare(ctx_id=0, det_size=(640, 640))
            self._real_encoder = ("insightface", app)
            self._real_dim = 512
            self.mode = "insightface"
            logger.info("[face_encoder] 已加载 insightface 真实模型（512d）")
            return
        except Exception as e:  # noqa: BLE001
            logger.info(f"[face_encoder] insightface 不可用，降级：{e.__class__.__name__}")

        # 2) face_recognition（128 维 → 零填充至 512 维，前 128 维为真实特征）
        try:
            import face_recognition  # type: ignore

            self._real_encoder = ("face_recognition", face_recognition)
            self._real_dim = 128
            self.mode = "face_recognition"
            logger.info("[face_encoder] 已加载 face_recognition（128d→pad512）")
            return
        except Exception as e:  # noqa: BLE001
            logger.info(f"[face_encoder] face_recognition 不可用，最终降级哈希模式：{e.__class__.__name__}")

        self.mode = "degraded"

    # ── 特征提取 ──
    def extract_feature(self, image_path: str) -> np.ndarray:
        """提取 512 维人脸特征向量。失败时返回降级确定性向量。"""
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"图片不存在：{image_path}")

        raw_bytes = path.read_bytes()

        # 真实模型路径
        if self._real_encoder is not None:
            try:
                vec = self._extract_real(raw_bytes)
                if vec is not None:
                    self.last_mode = self.mode
                    return self._normalize(vec)
                logger.warning(
                    f"[face_encoder] {path.name} 未检出人脸，该帧降级哈希模式"
                    "（降级留证：跨镜头相似度将不可信，须更换素材或调参）")
            except Exception as e:  # noqa: BLE001
                logger.warning(f"[face_encoder] 真实提取失败，降级：{e}")

        # 降级：确定性哈希 512 维向量
        self.last_mode = "degraded"
        return self._degraded_feature(raw_bytes)

    def _extract_real(self, raw_bytes: bytes) -> Optional[np.ndarray]:
        import io
        from PIL import Image

        img = np.array(Image.open(io.BytesIO(raw_bytes)).convert("RGB"))
        kind, enc = self._real_encoder

        if kind == "insightface":
            faces = enc.get(img)
            if not faces:
                return None
            vec = faces[0].embedding.astype(np.float32)  # 512d
        else:  # face_recognition
            import face_recognition as fr  # type: ignore

            encodings = fr.face_encodings(img)
            if not encodings:
                return None
            vec = np.zeros(FEATURE_DIM, dtype=np.float32)
            vec[:128] = encodings[0].astype(np.float32)  # 128d → pad 512d
        return vec

    @staticmethod
    def _degraded_feature(raw_bytes: bytes) -> np.ndarray:
        """确定性哈希派生 512 维浮点向量（同图同向量，L2 归一化）。

        算法：SHA-512 派生 64 字节种子 → SHAKE256 派生 512 字节 →
        每字节转 float32 映射到 [-1,1] → L2 归一化。
        """
        seed = hashlib.sha512(raw_bytes).digest()
        raw = hashlib.shake_256(seed).digest(FEATURE_DIM)
        vec = np.frombuffer(raw, dtype=np.uint8).astype(np.float32)
        vec = (vec / 255.0 - 0.5) * 2.0  # 映射到 [-1, 1]
        return FaceEncoder._normalize(vec)

    @staticmethod
    def _normalize(vec: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(vec)
        if norm < 1e-8:
            return vec
        return (vec / norm).astype(np.float32)

    # ── 特征库落盘 ──
    def save_character(self, char_id: str, name: str, image_path: str) -> dict:
        """为单个角色构建特征并落盘：<root>/<char_id>/feature.npy + manifest.json"""
        vec = self.extract_feature(image_path)
        char_dir = Path(self.library_root) / char_id
        char_dir.mkdir(parents=True, exist_ok=True)

        np.save(char_dir / "feature.npy", vec)

        manifest = {
            "char_id": char_id,
            "name": name,
            "source_image": str(image_path),
            "dim": int(vec.shape[0]),
            "mode": self.mode,
            "created_at": __import__("datetime").datetime.now().isoformat(),
        }
        (char_dir / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        logger.info(f"[face_encoder] 角色 {char_id}({name}) 特征已落盘（mode={self.mode}）")
        return manifest

    def load_feature(self, char_id: str) -> Optional[np.ndarray]:
        fpath = Path(self.library_root) / char_id / "feature.npy"
        if not fpath.exists():
            return None
        return np.load(fpath)


__all__ = ["FaceEncoder", "FEATURE_DIM"]
