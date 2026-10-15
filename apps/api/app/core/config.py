# ==============================================================
# YYC³ 漫剧生产系统 · core/config —— 集中配置（env 驱动，十二要素）
# M1：薄层所需全部配置项；未设置的持久化/网关项给出显式默认与阶段标注
# ==============================================================
import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    # 服务
    api_prefix: str = "/api/v1"
    env: str = os.getenv("MANJU_ENV", "dev")
    service_stage: str = "M1"
    # 队列
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    # 持久化（M2 启用；M1 路由层不依赖数据库）
    database_url: str | None = os.getenv("DATABASE_URL") or None
    # 网关（M4 鉴权收口；M1 仅记录）
    gateway_url: str = os.getenv("GATEWAY_URL", "http://localhost:30001")
    # 存储（NAS 产出物根；默认仓内 storage/）
    nas_path: str = os.getenv("NAS_PATH", "")
    # CORS（本地 web dev :20300）
    allowed_origins: tuple = (
        "http://localhost:20300",
        "http://127.0.0.1:20300",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
