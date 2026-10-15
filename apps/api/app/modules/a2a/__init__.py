# ==============================================================
# YYC³ 漫剧生产系统 · modules/a2a —— 0379-world A2A 编排面对接（M5）
# 契约来源：0379-world core/api/api/a2a.py（能力发现/单 Agent 投递/同步闭环/扇出编排）
# 身份：静态 X-API-Key（GATEWAY_API_KEY；world AuthMiddleware 静态键路径，不经 vk 计费）
# 原则：不伪造——网关不可达/鉴权失败/无在线 Agent 一律抛 A2AGatewayError 如实上抛，
#       路由层转译统一错误形态；不做任何本地降级假数据。
# ==============================================================
from app.modules.a2a.client import (
    A2AGatewayError,
    discover_agents,
    submit_task,
    submit_task_sync,
)

__all__ = [
    "A2AGatewayError",
    "discover_agents",
    "submit_task",
    "submit_task_sync",
]
