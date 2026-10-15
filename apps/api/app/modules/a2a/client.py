# ==============================================================
# YYC³ 漫剧生产系统 · modules/a2a/client —— 0379-world A2A 薄客户端（M5）
# 端点契约（0379-world core/api/api/a2a.py，已实证）：
#   GET  /v1/a2a/agents?capability=    能力发现（90s 心跳在线窗口）
#   POST /v1/agent/a2a/tasks           异步投递（202 即返，消费者组认领）
#   POST /v1/agent/a2a/tasks/sync      同步闭环（投递 + 超时窗内等回执；
#                                      超时 status=timeout 任务不撤回照常消费）
# 实现：stdlib urllib（零新增依赖），同步调用经 asyncio.to_thread 包裹不阻塞事件循环。
# ==============================================================
import asyncio
import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Optional

from app.core.config import get_settings

_DEFAULT_TIMEOUT_SECONDS = 10.0


class A2AGatewayError(Exception):
    """A2A 网关调用失败（不可达 / 非 2xx / 未配置服务身份）。"""


@dataclass(frozen=True)
class _Gateway:
    base_url: str
    api_key: str


def _gateway() -> _Gateway:
    settings = get_settings()
    if not settings.gateway_api_key:
        raise A2AGatewayError("GATEWAY_API_KEY 未配置（manju 服务身份缺失，A2A 编排面不可用）")
    return _Gateway(base_url=settings.gateway_url.rstrip("/"), api_key=settings.gateway_api_key)


def _request(
    method: str,
    path: str,
    *,
    body: Optional[dict] = None,
    timeout: float = _DEFAULT_TIMEOUT_SECONDS,
) -> dict:
    gw = _gateway()
    req = urllib.request.Request(
        url=f"{gw.base_url}{path}",
        method=method,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={
            "X-API-Key": gw.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310（内网服务间调用）
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:300]
        raise A2AGatewayError(f"网关 {method} {path} 返回 {exc.code}：{detail}") from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise A2AGatewayError(f"网关不可达 {method} {path}：{exc}") from exc


async def discover_agents(capability: Optional[str] = None) -> list[dict]:
    """能力发现：在线 Agent Card 列表（0379-world 内置编队 8 张 + 外置注册）。"""
    path = "/v1/a2a/agents"
    if capability:
        path += f"?capability={urllib.parse.quote(capability)}"
    data = await asyncio.to_thread(_request, "GET", path)
    return list(data.get("agents", []))


async def submit_task(
    task_type: str,
    payload: dict,
    *,
    capability: Optional[str] = None,
    receiver_agent_id: Optional[str] = None,
    priority: int = 5,
) -> dict:
    """异步投递：202 即返 {msg_id, trace_id, receiver, stream, status=queued}。"""
    body = {
        "task_type": task_type,
        "payload": payload,
        "receiver_agent_id": receiver_agent_id,
        "capability": capability,
        "priority": priority,
    }
    return await asyncio.to_thread(_request, "POST", "/v1/agent/a2a/tasks", body=body)


async def submit_task_sync(
    task_type: str,
    payload: dict,
    *,
    capability: Optional[str] = None,
    receiver_agent_id: Optional[str] = None,
    priority: int = 5,
    timeout_seconds: int = 30,
) -> dict:
    """同步闭环：{trace_id, receiver, status: succeeded|failed|timeout, result}。"""
    body = {
        "task_type": task_type,
        "payload": payload,
        "receiver_agent_id": receiver_agent_id,
        "capability": capability,
        "priority": priority,
        "timeout_seconds": timeout_seconds,
    }
    # 客户端超时须覆盖网关等待窗（网关最长等 timeout_seconds 才回 timeout 响应）
    wait = float(timeout_seconds) + _DEFAULT_TIMEOUT_SECONDS
    return await asyncio.to_thread(
        _request, "POST", "/v1/agent/a2a/tasks/sync", body=body, timeout=wait
    )
