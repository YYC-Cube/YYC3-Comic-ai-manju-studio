# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/image —— 图像域便捷路由（M1）
# 薄封装：校验页面侧入参后转任务队列（image 队列）；真实生成随 A2A（D6）
# ==============================================================
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from celery_worker import celery_app

router = APIRouter(dependencies=[Depends(get_current_user)])


class GenerateRequest(BaseModel):
    image_prompt: str
    negative_prompt: str = ""
    consistency_anchor: str = ""
    seed: int | None = None


@router.post("/images:generate", status_code=202)
def generate(req: GenerateRequest) -> dict:
    result = celery_app.send_task(
        "image.generate", args=[req.model_dump()], queue="image"
    )
    return {"task_id": result.id, "status": "QUEUED", "queue": "image"}
