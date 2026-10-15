# ==============================================================
# YYC³ 漫剧生产系统 · core/security —— 鉴权依赖（M1 开发态存根）
# M1：0379-world 网关未落地（B5），提供 dev 存根——经请求头注入身份，
#     保证路由层从第一天起就依赖 get_current_user，M4 切换签发方时
#     路由零改动（仅改本模块）。
# TODO(M4): 校验网关签发的 JWT（GATEWAY_URL 互信），注入 RBAC 角色。
# ==============================================================
from dataclasses import dataclass

from fastapi import Header

from app.core.config import get_settings


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    role: str  # admin | producer | viewer（M4 起由网关 JWT 声明）


def get_current_user(
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
) -> CurrentUser:
    """开发态身份存根：默认 admin；生产（env=prod）下缺省拒绝由 M4 实现。"""
    settings = get_settings()
    if settings.env == "dev":
        return CurrentUser(user_id=x_user_id or "dev-user", role=x_user_role or "admin")
    # M4 前 prod 无签发方：保守拒绝
    from fastapi import HTTPException  # noqa: PLC0415

    raise HTTPException(status_code=401, detail="网关鉴权未落地（M4）")
