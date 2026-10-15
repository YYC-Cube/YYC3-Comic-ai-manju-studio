# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/project —— 项目剧集域薄路由（M2 契约对齐版）
# M2：入参/出参对齐前端 types/project.ts（Project / CreateProjectInput），
#     列表返回 {items} 信封；开发态进程内存承载，M3 持久化（core/database）
# ==============================================================
from datetime import datetime, timezone
from itertools import count

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

_PROJECTS: dict[str, dict] = {}
_SEQ = count(1)


class ProjectIn(BaseModel):
    """对齐前端 CreateProjectInput（apps/web/src/types/project.ts）"""

    title: str
    novice_source: str = ""
    episode_target: int = 0


def _to_project(project_id: str, req: ProjectIn) -> dict:
    return {
        "project_id": project_id,
        "title": req.title,
        "novice_source": req.novice_source,
        "episode_target": req.episode_target,
        "status": "draft",
        "cost": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": "开发态内存存储（M3 持久化）",
    }


@router.get("/projects")
def list_projects() -> dict:
    return {"items": list(_PROJECTS.values())}


@router.post("/projects", status_code=201)
def create_project(req: ProjectIn) -> dict:
    pid = f"proj-{next(_SEQ):04d}"
    item = _to_project(pid, req)
    _PROJECTS[pid] = item
    return item


@router.get("/projects/{project_id}")
def get_project(project_id: str) -> dict:
    item = _PROJECTS.get(project_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"项目不存在：{project_id}")
    return item
