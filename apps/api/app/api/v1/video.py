# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/video —— 视频域便捷路由（M1）
# ==============================================================
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from celery_worker import celery_app

router = APIRouter(dependencies=[Depends(get_current_user)])


class RenderRequest(BaseModel):
    shot_id: str
    image_path: str = ""
    motion_strength: float = 0.5


@router.post("/videos:render", status_code=202)
def render(req: RenderRequest) -> dict:
    result = celery_app.send_task(
        "video.render", args=[req.model_dump()], queue="video"
    )
    return {"task_id": result.id, "status": "QUEUED", "queue": "video"}
