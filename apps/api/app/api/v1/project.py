# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/project —— 项目剧集域薄路由（M1，management）
# 开发态：进程内存 CRUD 骨架；M2 持久化（core/database）+ 剧集状态机
# ==============================================================
from itertools import count

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

_PROJECTS: dict[str, dict] = {}
_SEQ = count(1)


class ProjectIn(BaseModel):
    name: str
    genre: str = "都市"
    synopsis: str = ""


@router.get("/projects")
def list_projects() -> dict:
    return {"items": list(_PROJECTS.values())}


@router.post("/projects", status_code=201)
def create_project(req: ProjectIn) -> dict:
    pid = f"proj-{next(_SEQ):04d}"
    item = {"project_id": pid, **req.model_dump(), "note": "开发态内存存储（M2 持久化）"}
    _PROJECTS[pid] = item
    return item


@router.get("/projects/{project_id}")
def get_project(project_id: str) -> dict:
    item = _PROJECTS.get(project_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"项目不存在：{project_id}")
    return item
