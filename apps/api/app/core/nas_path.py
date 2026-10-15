# ==============================================================
# YYC³ 漫剧生产系统 · core/nas_path —— 存储路径解析
# 规则：NAS_PATH 环境变量优先；默认仓内 storage/（apps/api 上两级）。
#       解析结果确保不逃逸存储根（防穿越）。
# ==============================================================
from pathlib import Path

from app.core.config import get_settings

_REPO_ROOT = Path(__file__).resolve().parents[3]


def storage_root() -> Path:
    configured = get_settings().nas_path
    root = Path(configured) if configured else _REPO_ROOT / "storage"
    root.mkdir(parents=True, exist_ok=True)
    return root


def resolve_storage(*parts: str) -> Path:
    """在存储根内解析相对路径；拒绝逃逸（.. 穿越）。"""
    root = storage_root().resolve()
    target = root.joinpath(*parts).resolve()
    if root not in target.parents and target != root:
        raise ValueError(f"路径逃逸存储根：{target}")
    return target
