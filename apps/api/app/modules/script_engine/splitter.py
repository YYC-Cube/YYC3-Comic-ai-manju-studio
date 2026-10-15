# ==============================================================
# YYC³ 漫剧生产系统 · 剧本语义结构化引擎 —— 章节拆分器
# 对齐：YYC3-02 §2.2.1 剧本语义结构化技术流 ｜ 技能：skills/06-语枢万物/novel-split
# 降级基线：纯规则实现（stdlib），LLM 精拆为后续增强（接口不变）
# 输出契约：split_chapters(text) -> [{"chapter_id","title","content","char_count"}]
# ==============================================================
import re

# 章节标题标记：第X章/回/节/卷/部/集（支持汉字与阿拉伯数字）
_CHAPTER_RE = re.compile(
    r"^\s*(第[零一二三四五六七八九十百千万0-9]+[章回节卷部集][^\n]{0,30})\s*$",
    re.MULTILINE,
)
# 卷/部级标记（更粗粒度，命中时并入标题行）
_PARA_SPLIT_RE = re.compile(r"\n\s*\n")


def split_chapters(text: str, min_chars: int = 300) -> list:
    """按章节标记拆分小说文本；无标记时按段落聚合到 min_chars 粒度。

    :param text: 小说原文（UTF-8）
    :param min_chars: 无章节标记时的最小拆分粒度（字符数）
    :return: 章节列表，每项 {chapter_id, title, content, char_count}
    """
    if not text or not text.strip():
        return []

    matches = list(_CHAPTER_RE.finditer(text))
    chapters = []
    if matches:
        # 标记命中：标题行到下一标题行之间为一章
        for i, m in enumerate(matches):
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            content = text[start:end].strip()
            if content:
                chapters.append({
                    "chapter_id": f"ch{i + 1:03d}",
                    "title": m.group(1).strip(),
                    "content": content,
                    "char_count": len(content),
                })
        # 首个标题前的遗留内容并入第一章（或独立成楔子）
        preamble = text[: matches[0].start()].strip()
        if preamble:
            if chapters:
                chapters[0]["content"] = preamble + "\n" + chapters[0]["content"]
                chapters[0]["char_count"] = len(chapters[0]["content"])
            else:
                chapters.append({
                    "chapter_id": "ch000",
                    "title": "楔子",
                    "content": preamble,
                    "char_count": len(preamble),
                })
    else:
        # 无标记兜底：按空行分段聚合，不足 min_chars 的段落并入上一块
        paras = [p.strip() for p in _PARA_SPLIT_RE.split(text) if p.strip()]
        buf, idx = [], 1
        size = 0
        for p in paras:
            buf.append(p)
            size += len(p)
            if size >= min_chars:
                content = "\n".join(buf)
                chapters.append({
                    "chapter_id": f"ch{idx:03d}",
                    "title": f"段落块{idx}",
                    "content": content,
                    "char_count": len(content),
                })
                buf, size = [], 0
                idx += 1
        if buf:
            content = "\n".join(buf)
            if chapters and size < min_chars // 2:
                chapters[-1]["content"] += "\n" + content
                chapters[-1]["char_count"] = len(chapters[-1]["content"])
            else:
                chapters.append({
                    "chapter_id": f"ch{idx:03d}",
                    "title": f"段落块{idx}",
                    "content": content,
                    "char_count": len(content),
                })
    return chapters


def split_scenes(chapter_text: str) -> list:
    """章内场景切分基线：以时空转换标记（夜/次日/此刻/ meanwhile 等 + 地点词）为界。

    规则基线仅按换行段聚合；LLM 增强后再输出 scene_id 级别切分。
    :return: [{"scene_id", "content"}]（至少一段）
    """
    paras = [p.strip() for p in _PARA_SPLIT_RE.split(chapter_text or "") if p.strip()]
    return [{"scene_id": f"sc{i + 1:03d}", "content": p} for i, p in enumerate(paras)]
