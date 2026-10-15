# ==============================================================
# YYC³ 漫剧生产系统 · app/seeds —— 库域演示种子（M5 端点落地）
# 来源：原型 mock 演示数据（apps/web/src/lib/mock/production.ts 三组）一次性灌库；
#       空表触发（每 kind 独立判定），业务流（剧本登记/资产入库/批量产出回写）
#       落地后数据自然更替——种子即种子，不作生产数据语义
# ==============================================================
from app.core.database import library_kind_count, upsert_library_doc

SEED_SCRIPTS = [
    {
        "id": "sc-101",
        "title": "凌霄剑仙之都市重修",
        "genre": "都市",
        "wordCount": 145000,
        "characterCount": 6,
        "sceneCount": 14,
        "loreCompleteness": 94,
        "stage": "批量生成中",
        "gateLevel": "G3",
        "lastEdited": "10 分钟前",
        "synopsis": "万古剑尊重生为现代家族赘婿，借都市灵气复苏之际重铸本命飞剑，横扫世家。",
        "characters": [
            {"name": "叶凌霄", "avatar": "/demo/photo-1534528741775-53994a69daeb.jpg", "roleDesc": "男主，前世剑尊，行事冷峻果断", "refTrained": True},
            {"name": "苏清月", "avatar": "/demo/photo-1517841905240-472988babdf9.jpg", "roleDesc": "女主，苏氏集团执行总裁，面冷心热", "refTrained": True},
            {"name": "陈浩天", "avatar": "/demo/photo-1507003211169-0a1dd7228f2d.jpg", "roleDesc": "反派，世家纨绔，屡屡受挫", "refTrained": True},
        ],
        "scenes": [
            {"name": "苏家顶层酒会大厅", "type": "室内奢华", "lighting": "冷光暖射灯"},
            {"name": "滨海废弃造船厂", "type": "工业废墟", "lighting": "雨夜月光"},
            {"name": "云雾山顶修真洞府", "type": "玄幻自然", "lighting": "晨曦青霭"},
        ],
    },
    {
        "id": "sc-102",
        "title": "落魄千金的大唐机甲营",
        "genre": "古风",
        "wordCount": 182000,
        "characterCount": 8,
        "sceneCount": 22,
        "loreCompleteness": 88,
        "stage": "分镜设计中",
        "gateLevel": "G2",
        "lastEdited": "32 分钟前",
        "synopsis": "唐朝天宝年间，流放千金机缘巧合启动机关木鸢核心，以蒸汽朋克机关术守卫边疆。",
        "characters": [
            {"name": "李若微", "avatar": "/demo/photo-1544005313-94ddf0286df2.jpg", "roleDesc": "机关术天才，女扮男装", "refTrained": True},
            {"name": "裴景深", "avatar": "/demo/photo-1500648767791-00dcc994a43e.jpg", "roleDesc": "边防千总，性格坚毅", "refTrained": False},
        ],
        "scenes": [
            {"name": "长安朱雀门外坊市", "type": "盛唐街市", "lighting": "暮色灯笼"},
            {"name": "玉门关地下机械工坊", "type": "蒸汽齿轮", "lighting": "炉火昏黄"},
        ],
    },
    {
        "id": "sc-103",
        "title": "赛博红娘：心率匹配 99.8%",
        "genre": "科幻",
        "wordCount": 92000,
        "characterCount": 4,
        "sceneCount": 9,
        "loreCompleteness": 91,
        "stage": "剪辑交付",
        "gateLevel": "G4",
        "lastEdited": "2 小时前",
        "synopsis": "2088年神经算法婚配所首席红娘，发现自己与最危险的通缉黑客产生了无法解释的基因共振。",
        "characters": [
            {"name": "艾莉亚", "avatar": "/demo/photo-1524504388940-b1c1722653e1.jpg", "roleDesc": "高级算法红娘，半义体化", "refTrained": True},
        ],
        "scenes": [
            {"name": "新霓虹区全息穹顶", "type": "赛博街道", "lighting": "蓝紫霓虹"},
        ],
    },
]

SEED_ASSETS = [
    {
        "id": "asset-c01",
        "name": "叶凌霄 (都市修真装)",
        "type": "character",
        "tags": ["主角", "修真", "冷峻", "西装"],
        "version": "v3.2",
        "usageCount": 148,
        "consistencyTrained": True,
        "consistencyScore": 94,
        "previewUrl": "/demo/photo-1534528741775-53994a69daeb.jpg",
        "refCard": True,
        "dualFormContract": {"mainForm": "现代深蓝定制西装", "altForm": "白衣玄袍本命剑修真身"},
        "evolutionStage": "LoRA资产包",
        "loraRank": 64,
        "referenceImages": [
            "/demo/photo-1534528741775-53994a69daeb.jpg",
            "/demo/photo-1506794778202-cad84cf45f1d.jpg",
            "/demo/photo-1519085360753-af0119f7cbe7.jpg",
            "/demo/photo-1500648767791-00dcc994a43e.jpg",
        ],
    },
    {
        "id": "asset-c02",
        "name": "苏清月 (总裁晚宴装)",
        "type": "character",
        "tags": ["女主", "总裁", "银色礼服", "高贵"],
        "version": "v2.8",
        "usageCount": 112,
        "consistencyTrained": True,
        "consistencyScore": 88,
        "previewUrl": "/demo/photo-1517841905240-472988babdf9.jpg",
        "refCard": True,
        "evolutionStage": "多视图",
        "referenceImages": [
            "/demo/photo-1517841905240-472988babdf9.jpg",
            "/demo/photo-1524504388940-b1c1722653e1.jpg",
        ],
    },
    {
        "id": "asset-s01",
        "name": "苏家顶层酒会大厅",
        "type": "scene",
        "tags": ["室内", "现代", "奢华", "落地窗"],
        "version": "v1.4",
        "usageCount": 46,
        "consistencyTrained": True,
        "consistencyScore": 92,
        "previewUrl": "/demo/photo-1511578314322-379afb476865.jpg",
        "refCard": False,
        "evolutionStage": "定妆照",
        "referenceImages": ["/demo/photo-1511578314322-379afb476865.jpg"],
    },
    {
        "id": "asset-p01",
        "name": "本命冰魄飞剑 (剑胚状态)",
        "type": "prop",
        "tags": ["法宝", "寒冰", "飞剑", "高光"],
        "version": "v1.0",
        "usageCount": 38,
        "consistencyTrained": True,
        "consistencyScore": 96,
        "previewUrl": "/demo/photo-1589829085413-56de8ae18c73.jpg",
        "refCard": True,
        "evolutionStage": "角色板",
        "referenceImages": [],
    },
]

SEED_BATCH_ITEMS = [
    {"shotId": "b-01", "shotNumber": "S01-01", "thumbnail": "/demo/photo-1534528741775-53994a69daeb.jpg", "syncNetScore": 0.84, "duration": 3.2, "confidence": 0.96, "status": "passed", "sampleFlagged": False, "costEstimated": 0.0016, "renderTime": 12},
    {"shotId": "b-02", "shotNumber": "S01-02", "thumbnail": "/demo/photo-1507003211169-0a1dd7228f2d.jpg", "syncNetScore": 0.79, "duration": 4.0, "confidence": 0.91, "status": "passed", "sampleFlagged": False, "costEstimated": 0.0020, "renderTime": 15},
    {"shotId": "b-03", "shotNumber": "S01-03", "thumbnail": "/demo/photo-1519085360753-af0119f7cbe7.jpg", "syncNetScore": 0.77, "duration": 3.5, "confidence": 0.88, "status": "passed", "sampleFlagged": True, "costEstimated": 0.0018, "renderTime": 13},
    {"shotId": "b-04", "shotNumber": "S01-04", "thumbnail": "/demo/photo-1534528741775-53994a69daeb.jpg", "syncNetScore": 0.68, "duration": 2.8, "confidence": 0.54, "status": "failed", "sampleFlagged": True, "costEstimated": 0.0014, "renderTime": 10},
    {"shotId": "b-05", "shotNumber": "S01-05", "thumbnail": "/demo/photo-1511578314322-379afb476865.jpg", "syncNetScore": 0.72, "duration": 4.5, "confidence": 0.71, "status": "review", "sampleFlagged": False, "costEstimated": 0.0022, "renderTime": 18},
]

_SEED_GROUPS = {
    "script": (SEED_SCRIPTS, "id"),
    "asset": (SEED_ASSETS, "id"),
    "batch": (SEED_BATCH_ITEMS, "shotId"),
}


def ensure_library_seed() -> int:
    """空 kind 分组灌种子（幂等）；返回灌入条目数（0 = 已有数据跳过）。"""
    inserted = 0
    for kind, (items, key) in _SEED_GROUPS.items():
        if library_kind_count(kind) > 0:
            continue
        for item in items:
            upsert_library_doc(kind, str(item[key]), item)
            inserted += 1
    return inserted
