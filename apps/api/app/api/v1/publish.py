# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/publish —— 一键推送域薄路由（M1 / M5 jobs 落地）
# M5：POST /jobs 真入队（publish_jobs 表，JOB-NNN 序号，queued 态——
#      分发 worker 与五平台 OAuth 授权池未接，状态不伪造推进）；
#      GET /matrix 由 publish_jobs 派生看板行（queued → 各平台排队中）；
#      GET /accounts 保持空集（OAuth 扫码授权流超 M5 范围，随后续批次落地）
# ==============================================================
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.database import insert_publish_job, list_publish_jobs, next_publish_job_seq
from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

_STAGE_NOTE = "账号矩阵授权池随五平台 OAuth 批次落地（M5 范围外，jobs/matrix 已真入队派生）"


class EnqueueJobRequest(BaseModel):
    """对齐前端 enqueuePublishJob 入参"""

    platforms: list[str] = Field(min_length=1)
    title: str = ""


@router.get("/accounts")
def accounts() -> dict:
    return {"items": [], "note": _STAGE_NOTE}


@router.get("/matrix")
def matrix() -> dict:
    """看板矩阵：由 publish_jobs 派生——每个 job 一行，选中平台 queued、未选平台缺省（未排期）"""
    rows = []
    for job in list_publish_jobs():
        targets = {}
        for p in job["platforms"]:
            targets[p] = {"status": "queued" if job["status"] == "queued" else job["status"]}
        rows.append(
            {
                "filmId": job["job_id"],
                "filmTitle": job["title"] or f"分发任务 {job['job_id']}",
                "targets": targets,
            }
        )
    return {"items": rows}


@router.post("/jobs", status_code=201)
def enqueue_job(req: EnqueueJobRequest) -> dict:
    job_id = f"JOB-{next_publish_job_seq():04d}"
    insert_publish_job(job_id, req.title, req.platforms, "queued")
    return {"jobId": job_id, "status": "queued", "platforms": req.platforms}
