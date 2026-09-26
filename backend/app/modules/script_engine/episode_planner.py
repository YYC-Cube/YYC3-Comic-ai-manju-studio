# ==============================================================
# YYC³ 漫剧生产系统 · 剧本语义结构化引擎 —— 分集规划
# 对齐：YYC3-02 §4.2.1（分集规划：单集 90-120 秒 + 悬念钩子）
#       落位：modules/script_engine/episode_planner.py（完整版文件树既定路径）
# 降级基线：纯规则实现（stdlib）；LLM 节奏优化为后续增强（输出契约不变）
# 输出契约：plan_episodes(chapters) -> [{"episode_id","episode_title","content",
#           "source_chapters","duration_seconds","hook_line","hook_type"}]
# ==============================================================
import re

try:  # 同包优先，扁平导入兜底
    from . import hook_detector
except ImportError:  # noqa: F401
    import hook_detector  # type: ignore

# 语速基线：短剧旁白+对白混合 ≈ 3.5 字/秒（105 秒 ≈ 370 字/集）
CHARS_PER_SECOND = 3.5
_SENT_RE = re.compile(r"[^。！？!?…\n]*[。！？!?…]+")


def plan_episodes(chapters: list, episode_seconds: int = 105,
                  episode_id_prefix: str = "ep") -> list:
    """把章节流切成 90-120 秒粒度的单集计划，每集绑定主钩子。

    :param chapters: splitter.split_chapters 的输出
    :param episode_seconds: 目标单集时长（默认 105s，落在 90-120s 窗口）
    :return: 分集计划列表（含每集正文、来源章节、时长、主钩子）
    """
    budget = int(episode_seconds * CHARS_PER_SECOND)
    episodes = []
    buf, src, idx = [], [], 1

    def _flush():
        nonlocal buf, src, idx
        if not buf:
            return
        content = "\n".join(buf).strip()
        if not content:
            buf, src = [], []
            return
        hook = hook_detector.episode_hook(content)
        title = _derive_title(content, src)
        episodes.append({
            "episode_id": f"{episode_id_prefix}{idx:02d}",
            "episode_title": title,
            "content": content,
            "source_chapters": list(src),
            "duration_seconds": min(120, max(90, round(len(content) / CHARS_PER_SECOND))),
            "hook_line": hook["sentence"],
            "hook_type": hook["type"],
        })
        buf, src = [], []
        idx += 1

    for ch in chapters:
        # 章内按句切分，逐句装桶，避免超预算
        sentences = [m.group(0).strip() for m in _SENT_RE.finditer(ch.get("content", ""))
                     if m.group(0).strip()]
        for s in sentences:
            buf.append(s)
            src.append(ch["chapter_id"])
            if sum(len(x) for x in buf) >= budget:
                _flush()
        # 章末残留不足半集预算则继续留桶（跨章聚合）
        if buf and sum(len(x) for x in buf) >= budget // 2:
            _flush()
    _flush()
    return episodes


def _derive_title(content: str, src: list) -> str:
    """单集标题基线：取首个句子截断 ≤12 字；LLM 增强后改用剧情摘要。"""
    first = next((s.group(0).strip() for s in _SENT_RE.finditer(content)), "")
    title = re.sub(r"[。！？!?…]+$", "", first)[:12]
    return title or f"第{src[0] if src else '?'}章节选"
