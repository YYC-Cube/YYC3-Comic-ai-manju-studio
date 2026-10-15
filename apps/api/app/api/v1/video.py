# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/video —— 视频域便捷路由（M1 / M5 exports 落地）
# 端点（挂载于 /api/v1/factory）：
#   POST /videos:render        单镜渲染入队（Celery video 队列）
#   GET  /videos/exports       导出任务队列（export_tasks 表，{items} 信封）
#   POST /videos/exports       新建批量导出任务（EXP-NNN 序号，queued 态——
#                              转码 worker 未接，状态不伪造推进，FFmpeg 管线接入后消费）
# ==============================================================
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.database import insert_export_task, list_export_tasks, next_export_seq
from app.core.security import get_current_user
from celery_worker import celery_app

router = APIRouter(dependencies=[Depends(get_current_user)])


class RenderRequest(BaseModel):
    shot_id: str
    image_path: str = ""
    motion_strength: float = 0.5


class ExportCreateRequest(BaseModel):
    """新建导出预设（对齐前端 ExportTask 形状；进度/耗时/体积随转码 worker 回写）"""

    title: str = Field(min_length=1)
    resolution: str = "1080p"
    format: str = "MP4"


@router.post("/videos:render", status_code=202)
def render(req: RenderRequest) -> dict:
    result = celery_app.send_task(
        "video.render", args=[req.model_dump()], queue="video"
    )
    return {"task_id": result.id, "status": "QUEUED", "queue": "video"}


@router.get("/videos/exports")
def list_exports() -> dict:
    return {"items": list_export_tasks()}


@router.post("/videos/exports", status_code=201)
def create_export(req: ExportCreateRequest) -> dict:
    export_id = f"EXP-{next_export_seq()}"
    doc = {
        "id": export_id,
        "title": req.title,
        "resolution": req.resolution,
        "bitrate": "待转码 worker 评估",
        "progress": 0,
        "status": "queued",
        "duration": "—",
        "hwTag": "FFmpeg 管线待接入",
        "size": "—",
        "format": req.format,
    }
    insert_export_task(export_id, doc)
    return doc
