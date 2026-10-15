# ==============================================================
# YYC³ 漫剧生产系统 · core/redis —— Redis 客户端工厂（惰性单例）
# M1：供健康检查与轻量缓存使用；Celery broker/backend 由 celery_worker 自持
# ==============================================================
from functools import lru_cache

import redis

from app.core.config import get_settings


@lru_cache
def get_redis() -> redis.Redis:
    return redis.Redis.from_url(get_settings().redis_url, decode_responses=True)


def ping() -> bool:
    """健康探针：异常一律归 False，不向上抛（健康检查语义）。"""
    try:
        return bool(get_redis().ping())
    except Exception:
        return False
