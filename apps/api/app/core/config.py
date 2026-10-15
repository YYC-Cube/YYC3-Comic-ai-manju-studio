# ==============================================================
# YYC³ 漫剧生产系统 · core/config —— 集中配置（env 驱动，十二要素）
# M1：薄层所需全部配置项；未设置的持久化/网关项给出显式默认与阶段标注
# ==============================================================
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

# 仓根推导（config.py 位于 apps/api/app/core/ 下）：本地默认 SQLite 落仓内 .tmp/
_REPO_ROOT = Path(__file__).resolve().parents[4]
_DEFAULT_DB_URL = f"sqlite:///{_REPO_ROOT / '.tmp' / 'manju.db'}"


@dataclass(frozen=True)
class Settings:
    # 服务
    api_prefix: str = "/api/v1"
    env: str = os.getenv("MANJU_ENV", "dev")
    service_stage: str = "M5"
    # 队列
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    # 持久化（M5 切库启用）：默认仓内 SQLite 文件（零配置本地可跑）；
    # 部署态以 env DATABASE_URL 覆盖为 PG（psycopg 驱动随部署 requirements 解除注释）
    database_url: str = os.getenv("DATABASE_URL") or _DEFAULT_DB_URL
    # 网关（M4 鉴权收口；0379-world 实证端口 8000）
    gateway_url: str = os.getenv("GATEWAY_URL", "http://localhost:8000")
    # M5 A2A：manju → 0379-world 编排面的服务身份（静态 X-API-Key；部署前置项：换发正式服务密钥）
    gateway_api_key: str = os.getenv("GATEWAY_API_KEY", "")
    # 会话鉴权（M4 最小面）：mock=演示直通（内存注册表）/ gateway=代理 0379-world 签发与校验
    auth_mode: str = os.getenv("AUTH_MODE", "mock")
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
