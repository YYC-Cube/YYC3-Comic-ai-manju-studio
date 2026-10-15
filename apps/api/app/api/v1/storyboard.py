# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/storyboard —— 分镜域薄路由（M1 + M3 持久化）
# 直调引擎：app.modules.script_engine.storyboard_schema（引擎零改动）
# 端点（挂载于 /api/v1/factory）：
#   GET  /storyboards/schema    契约自省（storyboard.v1.json）
#   POST /storyboards:validate  StoryboardV1 校验（同前端 validateStoryboard 规则）
#   POST /storyboards:draft     规则基线草稿生成（80-120 镜节奏窗口）
#   GET  /storyboards/{project_id}/{episode_id}              分镜持久化读取（M3，内存注册表）
#   PATCH /storyboards/{project_id}/{episode_id}/shots/{shot_id} 镜头局部更新（M3）
# ==============================================================
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.modules.script_engine.storyboard_schema import (
    draft_storyboard,
    load_schema,
    validate_with_jsonschema,
)

router = APIRouter(dependencies=[Depends(get_current_user)])

# --------------------------------------------------------------
# 开发态分镜持久化注册表（M3）
# 内存承载、重启即失——与 M1 project 登记同模式；M4 切数据库（DATABASE_URL 惰性工厂已备）
# 首次 GET 以引擎 draft 播种：返回真实引擎产出（非 mock），保证 PATCH 有真实作用对象
# --------------------------------------------------------------
_STORYBOARD_REGISTRY: dict[str, dict] = {}

_SEED_EPISODE_CONTENT = (
    "夜幕降临，林晚来到天台，手里攥着那封泛黄的信。"
    "林晚低声道：「你终于来了。」她没有回头。男人撑着黑伞，缓缓走近。"
    "男人问道：「信，你看过了？」他的声音沙哑。林晚转身，泪水混着雨水滑落。"
    "林晚怒道：「为什么不告诉我真相？」男人沉默片刻，从怀中取出一张照片。"
    "男人答道：「因为有些真相，说出来就是一生。」远处警笛声由远及近。"
    "林晚喊道：「这一次，我不会再让你逃了！」众人站在天台上，雨越下越大。"
)
_SEED_HOOK_LINE = "这一次，我不会再让你逃了！"


class DraftRequest(BaseModel):
    project_id: str
    episode: dict[str, Any] = Field(description="{episode_id, content, hook_line?}")
    elements: dict[str, Any] = Field(default_factory=dict, description="{characters[], scenes[]}")
    style_ref: str = "古风悬疑 水墨厚涂 高对比"
    trace_id: str = "trace-draft-000001"


class ShotPatch(BaseModel):
    """镜头局部补丁（StoryboardV1 协议 12 字段子集；None 字段不应用）"""

    scene_id: str | None = None
    description: str | None = None
    shot_type: str | None = None
    camera_move: str | None = None
    dialogue: str | None = None
    duration_sec: float | None = None
    image_prompt: str | None = None
    sfx: str | None = None
    bgm: str | None = None
    hook_flag: bool | None = None
    consistency_anchor: str | None = None


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


@router.get("/storyboards/{project_id}/{episode_id}")
def get_storyboard(project_id: str, episode_id: str) -> dict:
    """分镜读取：注册表命中即返回；未命中以引擎 draft 播种后返回（开发态语义）"""
    key = f"{project_id}:{episode_id}"
    sb = _STORYBOARD_REGISTRY.get(key)
    if sb is None:
        sb = draft_storyboard(
            project_id=project_id,
            episode={
                "episode_id": episode_id,
                "content": _SEED_EPISODE_CONTENT,
                "hook_line": _SEED_HOOK_LINE,
            },
            elements={},
            trace_id=f"trace-seed-{project_id}-{episode_id}",
        )
        _STORYBOARD_REGISTRY[key] = sb
    return sb


@router.patch("/storyboards/{project_id}/{episode_id}/shots/{shot_id}")
def update_shot(project_id: str, episode_id: str, shot_id: str, patch: ShotPatch) -> dict:
    """镜头局部更新：注册表未播种返回 404（前端先 GET 播种）；镜头不存在返回 404"""
    key = f"{project_id}:{episode_id}"
    sb = _STORYBOARD_REGISTRY.get(key)
    if sb is None:
        raise HTTPException(status_code=404, detail=f"分镜未播种：{key}（先 GET 触发播种）")
    updates = patch.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="补丁为空：至少携带一个待更新字段")
    for shot in sb.get("shots", []):
        if shot.get("shot_id") == shot_id:
            shot.update(updates)
            sb["updated_at"] = datetime.now(timezone.utc).isoformat()
            return shot
    raise HTTPException(status_code=404, detail=f"镜头不存在：{shot_id}")
