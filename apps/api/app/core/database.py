# ==============================================================
# YYC³ 漫剧生产系统 · core/database —— 持久化工厂（M2 启用）
# M1 决策：路由层不依赖数据库（业务数据暂以进程内存承载，见各路由 TODO），
#         本模块提供惰性引擎工厂与健康探测；DATABASE_URL 未配置时探测返回
#         "skipped"，不阻断服务。sqlalchemy/psycopg 依赖随 M2 解除注释。
# ==============================================================
from typing import Any

from app.core.config import get_settings

_engine: Any = None


def get_engine() -> Any:
    """惰性创建 SQLAlchemy 引擎。未配置 DATABASE_URL 或依赖未装时显式报错。"""
    global _engine
    if _engine is not None:
        return _engine
    url = get_settings().database_url
    if not url:
        raise RuntimeError("DATABASE_URL 未配置：持久化在 M2 启用（core/database.py）")
    try:
        from sqlalchemy import create_engine  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError("sqlalchemy 未安装：请在 requirements.txt 解除 M2 依赖注释") from exc
    _engine = create_engine(url, pool_pre_ping=True)
    return _engine


def health() -> str:
    """健康探测：ok / skipped（未配置）/ error。"""
    if not get_settings().database_url:
        return "skipped"
    try:
        with get_engine().connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return "ok"
    except Exception:
        return "error"
