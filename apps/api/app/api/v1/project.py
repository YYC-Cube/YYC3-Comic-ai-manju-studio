# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/project —— 项目剧集域薄路由（M2 契约对齐版 / M5 切库）
# M2：入参/出参对齐前端 types/project.ts（Project / CreateProjectInput），列表返回 {items} 信封
# M5：进程内存承载切数据库（core/database projects 表，proj-NNNN 序号源自表计数）
# ==============================================================
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.database import insert_project, list_projects as db_list_projects, load_project, next_project_seq
from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


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
        "note": "数据库持久化（M5 切库，projects 表）",
    }


@router.get("/projects")
def list_projects() -> dict:
    return {"items": db_list_projects()}


@router.post("/projects", status_code=201)
def create_project(req: ProjectIn) -> dict:
    pid = f"proj-{next_project_seq():04d}"
    item = _to_project(pid, req)
    insert_project(pid, item)
    return item


@router.get("/projects/{project_id}")
def get_project(project_id: str) -> dict:
    item = load_project(project_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"项目不存在：{project_id}")
    return item
