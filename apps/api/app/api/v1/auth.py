# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/auth —— 会话鉴权（M4 最小面 · B5 断点落地）
# 双模式（config.auth_mode）：
#   mock（默认）：演示直通——任意非空账号口令接受，uuid 会话存内存注册表（重启即失，与 M1/M3 登记同模式）
#   gateway    ：login 代理 0379-world /v1/auth/login；session 经 /v1/auth/verify 校验
# 密钥零入库红线：前端与 manju api 均不持 JWT 密钥，校验动作全部外呼网关
# Cookie：yyc3_session（HttpOnly + SameSite=Lax；本地 http 开发期不加 Secure，部署前置项登记）
# ==============================================================
import json
import logging
import uuid
from typing import Optional
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

SESSION_COOKIE = "yyc3_session"
SESSION_MAX_AGE = 24 * 3600

# 会话注册表（token → 用户信息；内存承载，重启即失，M5 切数据库/Redis）
_SESSION_REGISTRY: dict[str, dict] = {}


class LoginIn(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    user_id: str
    username: str
    role: str


class LoginOut(BaseModel):
    user: UserOut
    mode: str


class SessionOut(BaseModel):
    authenticated: bool
    user: Optional[UserOut] = None
    mode: str


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE, token, httponly=True, samesite="lax", path="/", max_age=SESSION_MAX_AGE
    )


def _gateway_post(path: str, payload: dict) -> tuple[int, dict]:
    req = urlrequest.Request(
        get_settings().gateway_url + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=8) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        return e.code, {}
    except URLError as e:
        logger.warning("网关不可达：%s", e)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "网关不可达（AUTH_MODE=gateway）")


def _gateway_verify_user_id(token: str) -> Optional[str]:
    """带 Bearer 外呼网关 verify；返回 user_id（无效/不可达 → None）"""
    req = urlrequest.Request(
        get_settings().gateway_url + "/v1/auth/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urlrequest.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("valid"):
                return data.get("user_id")
            return None
    except (HTTPError, URLError):
        return None


@router.post("/auth/login", response_model=LoginOut)
def login(payload: LoginIn, response: Response) -> LoginOut:
    if not payload.username.strip() or not payload.password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "账号与口令不能为空")

    settings = get_settings()
    if settings.auth_mode == "gateway":
        code, data = _gateway_post(
            "/v1/auth/login", {"username": payload.username, "password": payload.password}
        )
        if code != 200:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "账号或口令错误")
        user = UserOut(
            user_id=str(data["user_id"]),
            username=str(data.get("username", payload.username)),
            role=str(data.get("role", "Director")),
        )
        _SESSION_REGISTRY[data["token"]] = user.model_dump()
        _set_session_cookie(response, data["token"])
        return LoginOut(user=user, mode="gateway")

    # mock 模式：演示直通（无凭据字面量；任意非空账号口令）
    token = uuid.uuid4().hex
    user = UserOut(user_id=f"mock-{payload.username}", username=payload.username, role="Director")
    _SESSION_REGISTRY[token] = user.model_dump()
    _set_session_cookie(response, token)
    return LoginOut(user=user, mode="mock")


@router.get("/auth/session", response_model=SessionOut)
def session(request: Request) -> SessionOut:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "未登录")

    settings = get_settings()
    if settings.auth_mode == "gateway":
        user_id = _gateway_verify_user_id(token)
        if not user_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "会话无效或已过期")
        cached = _SESSION_REGISTRY.get(token)
        # 注册表未命中（manju 重启后 cookie 仍有效）：以 verify 回执构造兜底身份
        user = UserOut(**cached) if cached else UserOut(user_id=user_id, username=user_id, role="Director")
        return SessionOut(authenticated=True, user=user, mode="gateway")

    cached = _SESSION_REGISTRY.get(token)
    if not cached:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "会话无效或已过期")
    return SessionOut(authenticated=True, user=UserOut(**cached), mode="mock")


@router.post("/auth/logout")
def logout(request: Request, response: Response) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        _SESSION_REGISTRY.pop(token, None)
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}
