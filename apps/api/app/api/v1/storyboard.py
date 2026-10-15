# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/storyboard —— 分镜域薄路由（M1）
# 直调引擎：app.modules.script_engine.storyboard_schema（引擎零改动）
# 端点（挂载于 /api/v1/factory）：
#   GET  /storyboards/schema    契约自省（storyboard.v1.json）
#   POST /storyboards:validate  StoryboardV1 校验（同前端 validateStoryboard 规则）
#   POST /storyboards:draft     规则基线草稿生成（80-120 镜节奏窗口）
# ==============================================================
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.modules.script_engine.storyboard_schema import (
    draft_storyboard,
    load_schema,
    validate_with_jsonschema,
)

router = APIRouter(dependencies=[Depends(get_current_user)])


class DraftRequest(BaseModel):
    project_id: str
    episode: dict[str, Any] = Field(description="{episode_id, content, hook_line?}")
    elements: dict[str, Any] = Field(default_factory=dict, description="{characters[], scenes[]}")
    style_ref: str = "古风悬疑 水墨厚涂 高对比"
    trace_id: str = "trace-draft-000001"


@router.get("/storyboards/schema")
def get_schema() -> dict:
    return load_schema()


@router.post("/storyboards:validate")
def validate(storyboard: dict[str, Any]) -> dict:
    return validate_with_jsonschema(storyboard)


@router.post("/storyboards:draft")
def draft(req: DraftRequest) -> dict:
    sb = draft_storyboard(
        project_id=req.project_id,
        episode=req.episode,
        elements=req.elements,
        style_ref=req.style_ref,
        trace_id=req.trace_id,
    )
    return {"storyboard": sb, "validation": validate_with_jsonschema(sb)}
