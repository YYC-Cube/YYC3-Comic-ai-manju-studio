# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/script —— 剧本域薄路由（M1）
# 直调引擎：splitter / extractor / episode_planner / hook_detector（零改动）
# 端点（挂载于 /api/v1/factory）：
#   POST /scripts:split        章节切分（min_chars 可调）
#   POST /scripts:scenes       场景切分
#   POST /scripts:extract      要素抽取（角色/场景 Top-N）
#   POST /scripts:plan         集数规划（episode_seconds 节奏）
#   POST /scripts/hooks:detect 钩子句检测（含首镜钩子裁决）
# ==============================================================
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from app.modules.script_engine.episode_planner import plan_episodes
from app.modules.script_engine.extractor import extract_elements
from app.modules.script_engine.hook_detector import detect_hooks, episode_hook, top_hooks
from app.modules.script_engine.splitter import split_chapters, split_scenes

router = APIRouter(dependencies=[Depends(get_current_user)])


class TextRequest(BaseModel):
    text: str
    min_chars: int = 300
    top_n: int = 10


class SceneRequest(BaseModel):
    chapter_text: str


class PlanRequest(BaseModel):
    chapters: list[Any]
    episode_seconds: int = 105


@router.post("/scripts:split")
def split(req: TextRequest) -> dict:
    chapters = split_chapters(req.text, min_chars=req.min_chars)
    return {"count": len(chapters), "chapters": chapters}


@router.post("/scripts:scenes")
def scenes(req: SceneRequest) -> dict:
    return {"scenes": split_scenes(req.chapter_text)}


@router.post("/scripts:extract")
def extract(req: TextRequest) -> dict:
    return extract_elements(req.text, top_n=req.top_n)


@router.post("/scripts:plan")
def plan(req: PlanRequest) -> dict:
    return {"episodes": plan_episodes(req.chapters, episode_seconds=req.episode_seconds)}


@router.post("/scripts/hooks:detect")
def hooks(req: TextRequest) -> dict:
    found = detect_hooks(req.text)
    return {"hooks": found, "top": top_hooks(found), "episode_hook": episode_hook(req.text)}
