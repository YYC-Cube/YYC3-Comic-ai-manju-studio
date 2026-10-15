# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/task —— 任务队列薄路由（M1）
# 职责：接收入队请求 → Celery 分发四队列；状态查询经结果后端（redis）
# 端点（挂载于 /api/v1/factory）：
#   POST /tasks            入队（task_type: image|audio|video|render）
#   GET  /tasks            近期入队登记（开发态，进程内存）
#   GET  /tasks/{task_id}  任务状态/结果
# TODO(M2): 任务登记持久化（core/database）+ ReAct-C 九步链路追踪字段
# ==============================================================
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from celery_worker import celery_app

router = APIRouter(dependencies=[Depends(get_current_user)])

TASK_NAME = {
    "image": "image.generate",
    "audio": "audio.synthesize",
    "video": "video.render",
    "render": "render.export",
}

# 开发态入队登记（重启即失，M2 持久化）
REGISTRY: list[dict] = []


class EnqueueRequest(BaseModel):
    task_type: str = Field(pattern="^(image|audio|video|render)$")
    payload: dict = Field(default_factory=dict)


@router.post("/tasks", status_code=202)
def enqueue(req: EnqueueRequest) -> dict:
    result = celery_app.send_task(
        TASK_NAME[req.task_type], args=[req.payload], queue=req.task_type
    )
    record = {"task_id": result.id, "task_type": req.task_type, "status": "QUEUED"}
    REGISTRY.append(record)
    return record


@router.get("/tasks")
def list_recent() -> dict:
    return {"items": REGISTRY[-50:], "note": "开发态登记（进程内存），M2 持久化"}


@router.get("/tasks/{task_id}")
def status(task_id: str) -> dict:
    res = celery_app.AsyncResult(task_id)
    body: dict = {"task_id": task_id, "state": res.state}
    if res.successful():
        body["result"] = res.result
    elif res.failed():
        body["error"] = str(res.result)
    return body
