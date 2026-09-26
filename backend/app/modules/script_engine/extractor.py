# ==============================================================
# YYC³ 漫剧生产系统 · 剧本语义结构化引擎 —— 剧情/角色/场景/对话要素抽取
# 对齐：YYC3-02 §2.2.1（剧情要素抽取）｜ 技能：skills/06-语枢万物/novel-split（要素子任务）
# 降级基线：纯规则实现（stdlib）；LLM 精抽为后续增强（输出契约不变）
# 输出契约：extract_elements(text) -> {characters, scenes, dialogues, plot_points}
# ==============================================================
import re

try:  # 同包优先（FastAPI 形态），扁平导入兜底（冒烟/脚本形态）
    from . import hook_detector
except ImportError:  # noqa: F401
    import hook_detector  # type: ignore

# 对话引号：中文直角/弯引号 + 英文双引号
_DIALOGUE_RE = re.compile(r"[「\"“]([^「」\"“”]{1,120})[」\"”]")
# 说话人：引号前 12 字内的「XX说/道/问/答/喊/怒道/冷笑」
_SPEAKER_RE = re.compile(
    r"([\u4e00-\u9fa5·A-Za-z]{1,6})(?:说道|说|道|问道|问|答道|答|喊道|喊|怒道|冷笑道|笑道|低声道)"
)
# 场景标记：「在XX里/上/中/内」「来到/走进/回到/到了 XX」
_SCENE_RE = re.compile(
    r"(?:在([\u4e00-\u9fa5A-Za-z0-9]{2,8})(?:里|中|内|上|下))"
    r"|(?:来到|走进|回到|到了|踏入)([\u4e00-\u9fa5A-Za-z0-9]{2,8})"
)
_STOPWORDS = {"他们", "她们", "自己", "我们", "众人", "此时", "突然", "只是", "所有", "一声", "什么", "这个", "那个"}
# 候选清洗：姓名/场景不得含动词助词与宾语特征字（规则基线的假阳性护栏）
_NAME_BAD = set("的了着过起来眼头手脸声张句把条位名话说")
_SCENE_BAD_LEAD = ("这张", "那张", "一张", "这个", "那个", "这座", "那座", "此")


def _clean_candidate(name: str, bad_chars: set, lo: int, hi: int) -> str:
    """剥前导虚词 → 长度窗校验 → 特征字拒绝；不合规返回空串。"""
    name = re.sub(r"^(?:的|了|着|在|便|就|才|又|和|与|这|那|一|此|，|。|！|？|、)+", "", name)
    if not (lo <= len(name) <= hi) or any(ch in bad_chars for ch in name):
        return ""
    return name


def _top(counter: dict, n: int) -> list:
    return sorted(counter.items(), key=lambda kv: -kv[1])[:n]


def extract_elements(text: str, top_n: int = 10) -> dict:
    """规则基线要素抽取。

    :return: {
      "characters": [{"name","mentions"}],   # 角色及出现次数（说话人优先）
      "scenes":     [{"name","mentions"}],   # 场景及命中次数
      "dialogues":  [{"speaker","line"}],    # 台词（speaker 未知记 "unknown"）
      "plot_points":[{"type","sentence","score"}]  # 剧情要点 = hook_detector 全量命中
    }
    """
    if not text or not text.strip():
        return {"characters": [], "scenes": [], "dialogues": [], "plot_points": []}

    dialogues = []
    speaker_counter: dict = {}

    # 对话抽取 + 说话人回溯（取引号起点前 12 字窗口）
    for m in _DIALOGUE_RE.finditer(text):
        line = m.group(1).strip()
        window = text[max(0, m.start() - 12): m.start()]
        sm = _SPEAKER_RE.search(window)
        speaker = _clean_candidate(sm.group(1), _NAME_BAD, 2, 4) if sm else ""
        if speaker:
            speaker_counter[speaker] = speaker_counter.get(speaker, 0) + 1
        dialogues.append({"speaker": speaker or "unknown", "line": line})

    # 角色补充：高频 2-3 字称谓（「XX」标记形态）
    for name in re.findall(r"[「\"“]([\u4e00-\u9fa5·A-Za-z]{2,4})[」\"”]", text):
        name = _clean_candidate(name, _NAME_BAD, 2, 4)
        if name:
            speaker_counter.setdefault(name, 0)

    scenes: dict = {}
    for m in _SCENE_RE.finditer(text):
        place = _clean_candidate((m.group(1) or m.group(2) or "").strip(),
                                 _NAME_BAD | set("封灯棺尸"), 2, 6)
        if place and not place.startswith(_SCENE_BAD_LEAD):
            scenes[place] = scenes.get(place, 0) + 1

    plot_points = [
        {"type": h["type"], "sentence": h["sentence"], "score": h["score"]}
        for h in hook_detector.detect_hooks(text)
    ]

    return {
        "characters": [{"name": n, "mentions": c} for n, c in _top(speaker_counter, top_n)],
        "scenes": [{"name": n, "mentions": c} for n, c in _top(scenes, top_n)],
        "dialogues": dialogues,
        "plot_points": plot_points,
    }
