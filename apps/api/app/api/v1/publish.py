# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/publish —— 一键推送域薄路由（M1，publishing）
# M1：查询端点返回空集 + 阶段标注；推送任务随 H3 产出回流（M4/P1 推送域）落地
# ==============================================================
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

_STAGE_NOTE = "M1 骨架：账号矩阵/发布看板随 P1 推送域页面迁移落地（H3 产出回流后）"


@router.get("/accounts")
def accounts() -> dict:
    return {"items": [], "note": _STAGE_NOTE}


@router.get("/matrix")
def matrix() -> dict:
    return {"items": [], "note": _STAGE_NOTE}


@router.post("/jobs")
def enqueue_job() -> dict:
    raise HTTPException(status_code=501, detail=_STAGE_NOTE)
