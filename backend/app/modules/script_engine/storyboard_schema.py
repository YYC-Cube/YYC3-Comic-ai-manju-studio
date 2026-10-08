# ==============================================================
# YYC³ 漫剧生产系统 · 剧本语义结构化引擎 —— 分镜 Schema 加载/校验/规则草稿
# 对齐：前端契约 yyc3-ai-manju-studio/frontend/src/types/storyboard.ts（严格同构）
#       TC-G2-007 / 技能 skills/03-格物宗师/storyboard-schema-check + 06/storyboard-gen
# 结构：StoryboardV1 顶层 12 字段 ｜ Shot 子结构 12 字段 ｜ 单集 80-120 镜头
# 降级基线：stdlib 手写校验（与前端 validateStoryboard 同规则）；装了 jsonschema
#           时叠加正式 Schema 校验；draft_storyboard 为规则版草稿生成器
# ==============================================================
import json
import re
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent / "schema" / "storyboard.v1.json"

SHOT_TYPES = ("远", "全", "中", "近", "特")
CAMERA_MOVES = ("推", "拉", "摇", "移", "跟", "固定")

SHOT_FIELDS = (
    "shot_id", "scene_id", "description", "shot_type", "camera_move",
    "dialogue", "duration_sec", "image_prompt", "sfx", "bgm",
    "hook_flag", "consistency_anchor",
)
TOP_FIELDS = (
    "version", "project_id", "episode_id", "episode_title", "style_ref",
    "character_refs", "total_shots", "hook_shots", "shots",
    "created_at", "updated_at", "trace_id",
)
TOP_REQUIRED_STRINGS = ("version", "project_id", "episode_id", "episode_title",
                        "style_ref", "trace_id")
SHOT_COUNT_RANGE = (80, 120)  # 单集节奏窗口（前端同款规则）

_SENT_RE = re.compile(r"[^。！？!?…\n]+[。！？!?…]*")
_CLAUSE_RE = re.compile(r"[^，,；;。！？!?…]+[，,；;]?")

# YYC3-74 G4：按景别注入构图词（对齐出图模型的空间先验，
# 防止「portrait 前缀主导 → 全部塌缩成半身像」的景别塌缩）。
# 英文构图词供 SDXL 生效（中文会被 CLIP tokenizer 弱化）；景别由
# 构图词硬约束，而非旧 REF_STYLE 的「portrait of…」前缀
SHOT_TYPE_COMPOSITION = {
    "远": "extreme wide establishing shot, tiny distant figure, full environment vista",
    "全": "full shot, head-to-toe figure, complete surrounding environment",
    "中": "medium shot, knees-up framing, partial environment",
    "近": "close-up shot, chest-up framing, clear facial expression",
    "特": "extreme close-up, facial detail, shallow depth of field",
}

# YYC3-74 G3：补拍空镜/反应镜模板池（占位不再同文复制；
# 描述互异使 plan_integrity 占位复制拦截可校验）
BROLL_POOL = ("檐角风铃轻晃，烛影摇动",
              "药柜抽屉层层错落，标签斑驳",
              "青石巷面雨光反光，人影稀疏",
              "灯笼长影掠过墙面，尘埃浮沉",
              "窗纸透进月光，桌上一盏冷茶",
              "铜炉青烟笔直上升，火光明灭")
REACTION_POOL = ("眉头微蹙，指尖收紧",
                 "指尖停在半空，呼吸一滞",
                 "瞳孔微缩，握紧了袖口",
                 "侧身避光，目光扫过角落")
# 补拍镜多样性封顶：池内不重复（54 镜同文复制的产线级教训）；
# 超出封顶后宁缺勿滥——完成度由 gate_completeness 显式告警
FILLER_CAP = len(BROLL_POOL) + len(REACTION_POOL)

# 补拍占位标记（与 scripts/run_quality_review.py gate_plan_integrity 同源同值）
PLACEHOLDER_MARK = "补拍"


def load_schema() -> dict:
    """加载 storyboard.v1.json（jsonschema 不可用时也可读取供人工比对）"""
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_storyboard(sb: dict) -> dict:
    """校验分镜剧本（与前端 validateStoryboard 同规则的 Python 实现）。

    :return: {"valid": bool, "errors": [硬错误], "warnings": [[警告] 级行]}
    """
    errors, warnings = [], []

    for key in TOP_REQUIRED_STRINGS:
        if not isinstance(sb.get(key), str) or not sb.get(key, "").strip():
            errors.append(f"缺少必填字段：{key}")

    shots = sb.get("shots")
    if not isinstance(shots, list) or not shots:
        errors.append("镜头列表（shots）不能为空")
    else:
        if not isinstance(sb.get("total_shots"), int):
            errors.append("total_shots 必须为整数")
        elif sb["total_shots"] != len(shots):
            errors.append(f"total_shots（{sb['total_shots']}）与 shots.length（{len(shots)}）不一致")
        if not (SHOT_COUNT_RANGE[0] <= len(shots) <= SHOT_COUNT_RANGE[1]):
            warnings.append(f"[警告] 单集镜头数 {len(shots)} 超出 {SHOT_COUNT_RANGE[0]}-"
                            f"{SHOT_COUNT_RANGE[1]} 节奏窗口")
        shot_ids = set()
        for s in shots:
            missing = [f for f in SHOT_FIELDS if f not in s]
            if missing:
                errors.append(f"镜头缺字段 {missing}（{s.get('shot_id', '?')}）")
                continue
            if s["shot_type"] not in SHOT_TYPES:
                errors.append(f"镜头 {s['shot_id']} 景别非法：{s['shot_type']}")
            if s["camera_move"] not in CAMERA_MOVES:
                errors.append(f"镜头 {s['camera_move']} 运镜非法：{s['camera_move']}（{s['shot_id']}）")
            if not isinstance(s["duration_sec"], (int, float)) or s["duration_sec"] <= 0:
                errors.append(f"镜头 {s['shot_id']} duration_sec 非法")
            shot_ids.add(s["shot_id"])

    hook_ids = sb.get("hook_shots")
    if not isinstance(hook_ids, list) or not hook_ids:
        errors.append("hook_shots 不能为空：每集至少需要 1 个钩子镜头")
    else:
        flag_map = {s.get("shot_id"): s.get("hook_flag") for s in shots or []}
        for hid in hook_ids:
            if hid not in flag_map:
                errors.append(f"hook_shots 中的 {hid} 不存在于 shots 列表")
            elif flag_map[hid] is not True:
                errors.append(f"镜头 {hid} 的 hook_flag 为 false，与 hook_shots 声明矛盾")
            elif PLACEHOLDER_MARK in next(
                    (s.get("description", "") for s in shots or []
                     if s.get("shot_id") == hid), ""):
                errors.append(f"钩子镜头 {hid} 不得为补拍占位（YYC3-74 G3）")

    # YYC3-74 G3：占位复制硬拦截（54 镜同文「檐角风铃」的产线级教训——
    # 同描述即节奏与画面双重同质，规则草稿期就该打回）
    desc_cnt: dict = {}
    for s in shots or []:
        desc_cnt[s.get("description", "")] = desc_cnt.get(s.get("description", ""), 0) + 1
    for dsc, cnt in desc_cnt.items():
        if cnt > 1:
            errors.append(f"占位复制：{cnt} 镜同描述「{dsc[:20]}…」（YYC3-74 G3）")

    return {"valid": not errors, "errors": errors, "warnings": warnings}


def validate_with_jsonschema(sb: dict) -> dict:
    """jsonschema 可用时走正式 Schema 校验；未安装时透明回落内部校验。"""
    try:
        import jsonschema  # noqa: PLC0415
    except ImportError:
        return validate_storyboard(sb)
    schema = load_schema()
    errors = []
    for e in jsonschema.Draft7Validator(schema).iter_errors(sb):
        errors.append(f"{list(e.absolute_path) or ['顶层']}: {e.message}")
    return {"valid": not errors, "errors": errors, "warnings": []}


# ---------------- 规则版草稿生成器（storyboard-gen 基线） ----------------

def draft_storyboard(project_id: str, episode: dict, elements: dict,
                     style_ref: str = "古风悬疑 水墨厚涂 高对比",
                     trace_id: str = "trace-draft-000001") -> dict:
    """规则基线：把单集正文拆成 80-120 个镜头的 StoryboardV1 草稿。

    节奏策略：句→镜；长句按子句二拆；不足 80 镜时插入反应镜头/空镜补足（描述
    显式标注「补拍」）；钩子句 + 首镜 + 末镜置 hook_flag。
    """
    ep_id = episode.get("episode_id", "ep01")
    content = episode.get("content", "")
    hook_line = episode.get("hook_line", "")
    characters = [c["name"] for c in (elements.get("characters") or [])]
    scenes = [s["name"] for s in (elements.get("scenes") or [])]
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    units: list = []
    for m in _SENT_RE.finditer(content):
        sent = m.group(0).strip()
        if not sent:
            continue
        # 长句按子句拆（保证 80-120 窗口有足够粒度）
        clauses = [c for c in _CLAUSE_RE.findall(sent) if c.strip()]
        units.extend(clauses if len(sent) > 30 and len(clauses) > 1 else [sent])

    # YYC3-74 G4：子句切分会把「……」郎中头也不抬，」这类孤儿尾段（闭引号
    # 被切进下一单元）独立成镜——并回前一个单元，保证 dialogue 引号完整
    cleaned: list = []
    for u in units:
        if u.startswith("」") and cleaned:
            cleaned[-1] += u
        else:
            cleaned.append(u)
    units = cleaned

    shots, i = [], 0
    scene_of = lambda k: scenes[k % len(scenes)] if scenes else "室内"  # noqa: E731

    def _mk(text: str, k: int) -> dict:
        is_dialogue = ("「" in text or '"' in text)
        speaker = next((c for c in characters if text.startswith(c)), None)
        shot_type = ("近" if is_dialogue else ("特" if len(text) <= 8 else "中")
                     if k % 3 else "全")
        if k % 7 == 0:
            shot_type = "远"
        camera = ("推" if k % 5 == 0 else "固定" if is_dialogue
                  else ("摇" if k % 4 == 0 else "移"))
        # YYC3-74 G4：image_prompt 结构 = 场景前置 + 景别构图词 + 内容 + 风格后置。
        # 旧模板「{style_ref}，{场景}，{内容}」中风格前缀主导出图（全部塌缩成
        # 同一女性半身像）；构图词承接 shot_type，使远/中/近景真正拉开景别
        image_prompt = (f"{scene_of(k)}，{SHOT_TYPE_COMPOSITION[shot_type]}，"
                        f"{text[:40]}，{style_ref}")
        return {
            "shot_id": f"shot-{ep_id}-{k + 1:03d}",
            "scene_id": f"sc-{ep_id}-{k // 10 + 1:02d}",
            "description": text,
            "shot_type": shot_type,
            "camera_move": camera,
            "dialogue": text if is_dialogue else "",
            "duration_sec": 1.5 if is_dialogue else (1.0 if len(text) <= 8 else 2.0),
            "image_prompt": image_prompt,
            "sfx": "环境音" if not is_dialogue else "",
            "bgm": "紧张弦乐" if episode.get("hook_type") in ("悬念", "反转") else "古风轻配乐",
            "hook_flag": False,
            "consistency_anchor": speaker or "narrator",
        }

    content_shots = [_mk(u, i) for i, u in enumerate(units)]

    # YYC3-74 G3 补拍镜治理：①池交错切片（空镜 6 条 × 反应 4 条交错取用，
    # 截 need 个天然互异——轮转回绕会撞文触发占位复制拦截）；②FILLER_CAP
    # 封顶宁缺勿滥——不再硬凑 80 镜制造 54 镜同文占位，完成度缺口由
    # gate_completeness 显式告警；③Bresenham 均匀交错 + 尾镜保底正片
    need = min(max(SHOT_COUNT_RANGE[0] - len(content_shots), 0), FILLER_CAP)
    filler_pool = []
    for bi in range(max(len(BROLL_POOL), len(REACTION_POOL))):
        if bi < len(BROLL_POOL):
            filler_pool.append(("远", "narrator", scene_of(bi), BROLL_POOL[bi],
                                f"（补拍·空镜）{scene_of(bi)}，{BROLL_POOL[bi]}"))
        if bi < len(REACTION_POOL) and characters:
            who = characters[bi % len(characters)]
            filler_pool.append(("近", who, scene_of(bi),
                                f"{who}，{REACTION_POOL[bi]}",
                                f"（补拍·反应）{who}，{REACTION_POOL[bi]}"))
    fillers = []
    for j, (st, anchor, scene, core, text) in enumerate(filler_pool[:need]):
        shot = _mk(text, len(content_shots) + j)
        # image_prompt 与补拍镜实际景别/场景同步重写（_mk 默认按内容镜逻辑生成）
        shot.update(
            shot_type=st, consistency_anchor=anchor, dialogue="", duration_sec=1.0,
            image_prompt=(f"{scene}，{SHOT_TYPE_COMPOSITION[st]}，"
                          f"{core}，{style_ref}"))
        fillers.append(shot)

    if content_shots:
        body, tail = content_shots[:-1], content_shots[-1]
    else:
        body, tail = [], None
    nc_b, nf = len(body), len(fillers)
    merged, ci, fi = [], 0, 0
    while ci < nc_b or fi < nf:
        # 比例落后者先行（交叉相乘避浮点）；平局优先内容镜
        if ci < nc_b and (fi >= nf or ci * nf <= fi * nc_b):
            merged.append(body[ci])
            ci += 1
        else:
            merged.append(fillers[fi])
            fi += 1
    if tail is not None:
        merged.append(tail)  # 尾镜保底正片（下集悬念钩的载体）
    shots = merged[: SHOT_COUNT_RANGE[1]]

    # 插入后统一重编号，保证 shot_id/scene_id 与最终顺序一致
    for idx, s in enumerate(shots):
        s["shot_id"] = f"shot-{ep_id}-{idx + 1:03d}"
        s["scene_id"] = f"sc-{ep_id}-{idx // 10 + 1:02d}"

    # 钩子标记：首个/最后一个正片镜（前 3 秒留人 + 下集悬念）+ 钩子句所在镜。
    # YYC3-74 G3：补拍镜不设钩（钩子占位拦截的生成侧自洽——钩子必须是正片）
    # TC-G3-008：钩子镜头 image_prompt 追加「【钩子镜头】」标记，与普通镜头可区分
    non_ph = [s for s in shots if PLACEHOLDER_MARK not in s["description"]]
    hook_ids = ({non_ph[0]["shot_id"], non_ph[-1]["shot_id"]}
                if non_ph else set())
    for s in shots:
        if hook_line and hook_line[:10] in s["description"]:
            hook_ids.add(s["shot_id"])
    for s in shots:
        if s["shot_id"] in hook_ids:
            s["hook_flag"] = True
            if "【钩子镜头】" not in s["image_prompt"]:
                s["image_prompt"] += "，【钩子镜头】情绪强化构图"
    hooked = [s["shot_id"] for s in shots if s["hook_flag"]]
    hook_shots = hooked or ([non_ph[0]["shot_id"]] if non_ph else [])

    return {
        "version": "1.0",
        "project_id": project_id,
        "episode_id": ep_id,
        "episode_title": episode.get("episode_title", ep_id),
        "style_ref": style_ref,
        "character_refs": characters or ["narrator"],
        "total_shots": len(shots),
        "hook_shots": hook_shots,
        "shots": shots,
        "created_at": now,
        "updated_at": now,
        "trace_id": trace_id if trace_id.startswith("trace-") else f"trace-{trace_id}",
    }
