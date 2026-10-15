# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/task —— 任务队列薄路由（M1 / M5 切库 + SSE 遥测）
# 职责：接收入队请求 → Celery 分发四队列；状态查询经结果后端（redis）
# 端点（挂载于 /api/v1/factory）：
#   POST /tasks            入队（task_type: image|audio|video|render；payload.project_id 归属）
#   GET  /tasks            近期入队登记（task_registry 表）
#   GET  /tasks/{task_id}  任务状态/结果
#   GET  /tasks/board      业务形状列表（ProductionTask[]，M5 真遥测）
#   GET  /tasks/stream     SSE 实时推送（2s 快照比对，变化即推，M5 真遥测）
# 形状映射：registry + AsyncResult → ProductionTask；进度按 Celery 状态阶粗粒度映射
# （worker 未回报细粒度 meta，不伪造）；九步步迹仍由前端确定性推导（引擎未产出）
# ==============================================================
import json
import time
from collections.abc import Iterator
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.database import insert_task_record, list_recent_tasks as db_list_recent
from app.core.security import get_current_user
from celery_worker import celery_app

router = APIRouter(dependencies=[Depends(get_current_user)])

TASK_NAME = {
    "image": "image.generate",
    "audio": "audio.synthesize",
    "video": "video.render",
    "render": "render.export",
}

# task_type → 六阶段（ProductionStage）
TYPE_STAGE = {"image": "visual", "audio": "audio", "video": "visual", "render": "compose"}
# task_type → 执行 Agent（生成域=创想·灵韵；合成导出=元启·天枢 调度域）
TYPE_AGENT = {"image": "创想·灵韵", "audio": "创想·灵韵", "video": "创想·灵韵", "render": "元启·天枢"}
# Celery state → (TaskStatus, progress)——粗粒度状态阶映射，worker 细粒度 meta 接入前不伪造
STATE_MAP = {
    "PENDING": ("pending", 5),
    "RECEIVED": ("pending", 5),
    "STARTED": ("running", 55),
    "PROGRESS": ("running", 55),
    "SUCCESS": ("success", 100),
    "FAILURE": ("failed", 100),
    "RETRY": ("rework", 30),
    "REVOKED": ("rework", 0),
}


class EnqueueRequest(BaseModel):
    task_type: str = Field(pattern="^(image|audio|video|render)$")
    payload: dict = Field(default_factory=dict)


@router.post("/tasks", status_code=202)
def enqueue(req: EnqueueRequest) -> dict:
    result = celery_app.send_task(
        TASK_NAME[req.task_type], args=[req.payload], queue=req.task_type
    )
    project_id = str(req.payload.get("project_id", ""))
    insert_task_record(result.id, req.task_type, "QUEUED", project_id)
    return {"task_id": result.id, "task_type": req.task_type, "status": "QUEUED"}


@router.get("/tasks")
def list_recent() -> dict:
    return {"items": db_list_recent(50), "note": "数据库持久化登记（M5 切库，task_registry 表）"}


@router.get("/tasks/board")
def board(project_id: str = "") -> dict:
    """业务形状列表（ProductionTask[]）——tasks 页真遥测数据源"""
    return {"items": _build_production_tasks(project_id or None)}


@router.get("/tasks/stream")
def stream(project_id: str = "") -> StreamingResponse:
    """SSE 实时推送：2s 快照比对，变化时逐条推 ProductionTask（text/event-stream）"""

    def gen() -> Iterator[str]:
        last_snapshot: str | None = None
        while True:
            items = _build_production_tasks(project_id or None)
            snapshot = json.dumps(items, ensure_ascii=False, sort_keys=True)
            if snapshot != last_snapshot:
                last_snapshot = snapshot
                for task in items:
                    yield f"data: {json.dumps(task, ensure_ascii=False)}\n\n"
            time.sleep(2)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _build_production_tasks(project_id: str | None) -> list[dict]:
    """registry 登记 + Celery AsyncResult 即时状态 → ProductionTask 形状
    容错：结果后端（redis）不可达时按登记态 PENDING 映射，不阻断遥测（对齐 0379-world 退避模式）"""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    items = []
    for rec in db_list_recent(50, project_id):
        try:
            res = celery_app.AsyncResult(rec["task_id"])
            state = res.state
            error = str(res.result) if res.failed() else None
        except Exception:  # noqa: BLE001
            state, error = "PENDING", None
        status, progress = STATE_MAP.get(state, ("pending", 0))
        items.append(
            {
                "task_id": rec["task_id"],
                "project_id": rec.get("project_id") or "",
                "stage": TYPE_STAGE.get(rec["task_type"], "visual"),
                "status": status,
                "progress": progress,
                "agent": TYPE_AGENT.get(rec["task_type"], "元启·天枢"),
                "trace_id": f"trace-{rec['task_id'][:8]}",
                "created_at": rec.get("created_at", now),
                "updated_at": now,
                "error": error,
            }
        )
    return items


@router.get("/tasks/{task_id}")
def status(task_id: str) -> dict:
    res = celery_app.AsyncResult(task_id)
    body: dict = {"task_id": task_id, "state": res.state}
    if res.successful():
        body["result"] = res.result
    elif res.failed():
        body["error"] = str(res.result)
    return body
