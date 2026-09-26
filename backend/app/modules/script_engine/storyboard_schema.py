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
        return {
            "shot_id": f"shot-{ep_id}-{k + 1:03d}",
            "scene_id": f"sc-{ep_id}-{k // 10 + 1:02d}",
            "description": text,
            "shot_type": shot_type,
            "camera_move": camera,
            "dialogue": text if is_dialogue else "",
            "duration_sec": 1.5 if is_dialogue else (1.0 if len(text) <= 8 else 2.0),
            "image_prompt": f"{style_ref}，{scene_of(k)}，{text[:40]}",
            "sfx": "环境音" if not is_dialogue else "",
            "bgm": "紧张弦乐" if episode.get("hook_type") in ("悬念", "反转") else "古风轻配乐",
            "hook_flag": False,
            "consistency_anchor": speaker or "narrator",
        }

    for u in units:
        shots.append(_mk(u, i))
        i += 1

    # 补足到 80 镜：交替插入反应镜头（近）与场景空镜（远），描述显式标注补拍
    fillers = 0
    while len(shots) < SHOT_COUNT_RANGE[0]:
        k = len(shots)
        if fillers % 2 == 0 and characters:
            who = characters[fillers % len(characters)]
            text = f"（补拍·反应镜头）{who} 眉头微蹙，指尖收紧"
            shot_type, anchor = "近", who
        else:
            text = f"（补拍·空镜）{scene_of(k)} 檐角风铃轻晃，烛影摇动"
            shot_type, anchor = "远", "narrator"
        shot = _mk(text, k)
        shot.update(shot_type=shot_type, consistency_anchor=anchor, dialogue="",
                    duration_sec=1.0)
        shots.append(shot)
        fillers += 1

    shots = shots[: SHOT_COUNT_RANGE[1]]

    # 钩子标记：首镜（前 3 秒留人）+ 末镜（下集悬念）+ 钩子句所在镜
    if shots:
        shots[0]["hook_flag"] = True
        shots[-1]["hook_flag"] = True
    for s in shots:
        if hook_line and hook_line[:10] in s["description"]:
            s["hook_flag"] = True
    hook_shots = [s["shot_id"] for s in shots if s["hook_flag"]] or [shots[0]["shot_id"]]

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
