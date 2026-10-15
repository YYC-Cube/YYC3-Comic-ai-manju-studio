# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/a2a —— A2A 编排面联通端点（M5）
# 定位：manju → 0379-world 编排面的诊断与投递代理（薄层，业务零侵入）
#   GET  /factory/a2a/status  编排面健康 + 在线编队（网关不可达如实 gateway_ok=false）
#   POST /factory/a2a/tasks   异步投递代理（202 语义透传：queued 即返）
#   POST /factory/a2a/tasks/sync  同步闭环代理（等回执；timeout 任务不撤回）
# 不伪造：下游失败一律 502 + 统一错误形态（YYC3-78），不返回任何本地编造 Agent/结果。
# ==============================================================
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.modules.a2a import (
    A2AGatewayError,
    discover_agents,
    submit_task,
    submit_task_sync,
)

router = APIRouter()


class A2ATaskSubmit(BaseModel):
    """manju 侧 A2A 任务投递请求（与 world 契约对齐，字段透传）"""

    task_type: str = Field(..., max_length=64)
    payload: dict
    capability: Optional[str] = Field(None, max_length=64)
    receiver_agent_id: Optional[str] = Field(None, max_length=128)
    priority: int = Field(5, ge=1, le=9)


class A2ATaskSubmitSync(A2ATaskSubmit):
    timeout_seconds: int = Field(30, ge=1, le=120)


def _bad_gateway(exc: A2AGatewayError) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail={"error": {"code": "A2A_GATEWAY", "message": str(exc)}},
    )


@router.get("/a2a/status")
async def a2a_status() -> dict:
    """编排面健康：在线编队清单；不可达时 gateway_ok=false + error（诊断语义，HTTP 200）。"""
    settings = get_settings()
    try:
        agents = await discover_agents()
    except A2AGatewayError as exc:
        return {
            "gateway_ok": False,
            "gateway_url": settings.gateway_url,
            "agents": [],
            "count": 0,
            "error": str(exc),
        }
    return {
        "gateway_ok": True,
        "gateway_url": settings.gateway_url,
        "agents": agents,
        "count": len(agents),
    }


@router.post("/a2a/tasks", status_code=202)
async def a2a_submit(req: A2ATaskSubmit) -> dict:
    """异步投递代理：透传 world 202 响应（queued 即返，回执经 world 结果流聚合）。"""
    try:
        return await submit_task(
            req.task_type,
            req.payload,
            capability=req.capability,
            receiver_agent_id=req.receiver_agent_id,
            priority=req.priority,
        )
    except A2AGatewayError as exc:
        raise _bad_gateway(exc) from exc


@router.post("/a2a/tasks/sync")
async def a2a_submit_sync(req: A2ATaskSubmitSync) -> dict:
    """同步闭环代理：透传 world 同步响应（succeeded/failed/timeout 均为真实状态）。"""
    try:
        return await submit_task_sync(
            req.task_type,
            req.payload,
            capability=req.capability,
            receiver_agent_id=req.receiver_agent_id,
            priority=req.priority,
            timeout_seconds=req.timeout_seconds,
        )
    except A2AGatewayError as exc:
        raise _bad_gateway(exc) from exc
