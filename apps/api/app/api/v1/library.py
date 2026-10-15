# ==============================================================
# YYC³ 漫剧生产系统 · api/v1/library —— 产线库域薄路由（M5 端点落地）
# 数据：library_docs 表（kind=script/asset/batch）；空表由 app/seeds 灌演示种子，
#       业务流（剧本登记/资产入库/批量产出回写）落地后数据自然更替
# 端点（挂载于 /api/v1/factory）：
#   GET /library/scripts    剧本库列表（ScriptItem[]，{items} 信封）
#   GET /library/assets     资产库列表（AssetItem[]）
#   GET /production/batch   批量生产条目（BatchItem[]）
# ==============================================================
from fastapi import APIRouter, Depends

from app.core.database import list_library_docs
from app.core.security import get_current_user
from app.seeds import ensure_library_seed

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/library/scripts")
def list_scripts() -> dict:
    ensure_library_seed()
    return {"items": list_library_docs("script")}


@router.get("/library/assets")
def list_assets() -> dict:
    ensure_library_seed()
    return {"items": list_library_docs("asset")}


@router.get("/production/batch")
def list_batch_items() -> dict:
    ensure_library_seed()
    return {"items": list_library_docs("batch")}
