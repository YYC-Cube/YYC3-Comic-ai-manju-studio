# ==============================================================
# YYC³ 漫剧生产系统 · 剧本语义结构化引擎 —— 流量钩子识别
# 对齐：ManjuForge 钩子识别算法思路（YYC3-05 §2.2 / YYC3-06 §2.1 吸收策略）
#       落位：modules/script_engine/hook_detector.py（完整版文件树既定路径）
# 降级基线：纯规则实现（stdlib）；LLM 语义钩子为后续增强（输出契约不变）
# 输出契约：detect_hooks(text) -> [{"type","sentence","score","index"}]
#           top_hooks(hooks, n) -> 前 n 个钩子（按 score 降序、位置升序）
# ==============================================================
import re

# 钩子规则库：(类型, 关键词, 权重)
# 悬念=留人 ｜ 反转=情绪拐点 ｜ 爽点=即时反馈 ｜ 冲突=对抗张力 ｜ 互动=评论引导
HOOK_RULES = [
    ("悬念", ("难道", "到底", "是谁", "秘密", "真相", "为何", "究竟"), 3),
    ("反转", ("没想到", "谁知", "居然", "万万没想到", "竟然", "偏偏"), 4),
    ("爽点", ("打脸", "反击", "逆袭", "震惊", "全场哗然", "跪下", "认输"), 4),
    ("冲突", ("怒", "质问", "对峙", "争吵", "拦住", "不许", "放肆"), 2),
    ("互动", ("评论区", "点赞", "关注", "下一集", "猜"), 1),
]

# 句子切分（保留标点）
_SENT_RE = re.compile(r"[^。！？!?…\n]*[。！？!?…]+")


def _sentences(text: str) -> list:
    """切句并保留原文位置（index=句首偏移）"""
    return [{"sentence": m.group(0).strip(), "index": m.start()}
            for m in _SENT_RE.finditer(text or "") if m.group(0).strip()]


def detect_hooks(text: str) -> list:
    """规则基线钩子识别：句级扫描 × 关键词命中 × 权重计分。

    :return: [{"type","sentence","score","index"}]（按 index 升序）
    """
    hooks = []
    for s in _sentences(text):
        for htype, keywords, weight in HOOK_RULES:
            hits = sum(1 for kw in keywords if kw in s["sentence"])
            if hits:
                # 同句多类型命中时各记一条；score = 权重 × 命中次数
                hooks.append({
                    "type": htype,
                    "sentence": s["sentence"],
                    "score": weight * hits,
                    "index": s["index"],
                })
    return hooks


def top_hooks(hooks: list, n: int = 3) -> list:
    """取前 n 个钩子：score 降序、位置升序（早出现的钩子更适合做片头留人点）"""
    return sorted(hooks, key=lambda h: (-h["score"], h["index"]))[:n]


def episode_hook(text: str) -> dict:
    """为单集挑一个主钩子：优先「悬念/反转」（留人属性最强），取 top1。"""
    hooks = detect_hooks(text)
    if not hooks:
        return {"type": "无", "sentence": "", "score": 0, "index": 0}
    priority = {"悬念": 0, "反转": 1, "爽点": 2, "冲突": 3, "互动": 4}
    ranked = sorted(hooks, key=lambda h: (priority.get(h["type"], 9), -h["score"], h["index"]))
    return ranked[0]
