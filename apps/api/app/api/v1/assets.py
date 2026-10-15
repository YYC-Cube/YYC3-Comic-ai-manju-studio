# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/assets —— 资产/一致性域薄路由（M1）
# 直调引擎：consistency_engine（AnchorGuard / StyleKeeper / FaceEncoder，零改动）
# 端点（挂载于 /api/v1/factory）：
#   POST /assets/anchor:pre        锚定前置检查
#   POST /assets/anchor:constraint 生成中约束声明
#   POST /assets/anchor:post       候选图事后校验（三态：accept/redraw/escalate）
#   POST /assets/style:profile     项目风格档案（确定性派生/持久化）
#   POST /assets/style:apply       风格注入提示词
#   POST /assets/face:enroll       角色人脸特征入库
#   GET  /assets/face:feature      角色特征元信息（dim，不回传向量）
# ==============================================================
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user
from app.modules.consistency_engine.anchor_guard import AnchorGuard
from app.modules.consistency_engine.face_encoder import FaceEncoder
from app.modules.consistency_engine.style_keeper import StyleKeeper

router = APIRouter(dependencies=[Depends(get_current_user)])


class AnchorPreRequest(BaseModel):
    char_id: str
    prompt: str = ""


class CharRequest(BaseModel):
    char_id: str


class AnchorPostRequest(BaseModel):
    char_id: str
    candidate_image: str


class StyleProfileRequest(BaseModel):
    project_id: str
    persist: bool = True


class StyleApplyRequest(BaseModel):
    project_id: str
    prompt: str


class FaceEnrollRequest(BaseModel):
    char_id: str
    name: str
    image_path: str


@router.post("/assets/anchor:pre")
def anchor_pre(req: AnchorPreRequest) -> dict:
    return AnchorGuard().pre_anchor(req.char_id, req.prompt)


@router.post("/assets/anchor:constraint")
def anchor_constraint(req: CharRequest) -> dict:
    return AnchorGuard().during_constraint(req.char_id)


@router.post("/assets/anchor:post")
def anchor_post(req: AnchorPostRequest) -> dict:
    return AnchorGuard().post_check(req.char_id, req.candidate_image)


@router.post("/assets/style:profile")
def style_profile(req: StyleProfileRequest) -> dict:
    return StyleKeeper().get_profile(req.project_id, persist=req.persist)


@router.post("/assets/style:apply")
def style_apply(req: StyleApplyRequest) -> dict:
    return StyleKeeper().apply_prompt(req.project_id, req.prompt)


@router.post("/assets/face:enroll")
def face_enroll(req: FaceEnrollRequest) -> dict:
    return FaceEncoder().save_character(req.char_id, req.name, req.image_path)


@router.get("/assets/face:feature")
def face_feature(char_id: str) -> dict:
    feat = FaceEncoder().load_feature(char_id)
    if feat is None:
        raise HTTPException(status_code=404, detail=f"角色特征不存在：{char_id}")
    return {"char_id": char_id, "dim": int(feat.shape[0])}
