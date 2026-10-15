# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/audio —— 音频域便捷路由（M1）
# ==============================================================
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from celery_worker import celery_app

router = APIRouter(dependencies=[Depends(get_current_user)])


class SynthesizeRequest(BaseModel):
    text: str
    voice: str = "default"
    shot_id: str = ""


@router.post("/audios:synthesize", status_code=202)
def synthesize(req: SynthesizeRequest) -> dict:
    result = celery_app.send_task(
        "audio.synthesize", args=[req.model_dump()], queue="audio"
    )
    return {"task_id": result.id, "status": "QUEUED", "queue": "audio"}
