# ==============================================================
# YYC³ 漫剧生产系统 · style_keeper 单元测试（TC-G3-009 逻辑面 · 无门禁依赖）
# 运行：yyc3-ai-manju-studio/.venv/bin/python tests/test_style_keeper.py
# 覆盖：确定性派生 / 跨项目隔离 / 持久化防漂移 / 风格注入 / 参数核验 / 图像级三态闭环
# ==============================================================
import json
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

BACKEND = str(Path(__file__).resolve().parents[1] / "backend")
sys.path.insert(0, BACKEND)

from app.modules.consistency_engine.style_keeper import (  # noqa: E402
    StyleKeeper,
    _PIL_OK,
)

PASS = 0
FAIL = 0


def check(name: str, cond: bool, detail: str = ""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name}")
    else:
        FAIL += 1
        print(f"  FAIL  {name}  {detail}")


def make_image(path: str, base_rgb, noise_std: float = 0.0, seed: int = 0):
    """生成测试图：base_rgb 纯色底 + 可控噪声（色彩分布可控）"""
    rng = np.random.default_rng(seed)
    arr = np.zeros((64, 64, 3), dtype=np.float32)
    arr[..., 0], arr[..., 1], arr[..., 2] = base_rgb
    if noise_std > 0:
        arr = np.clip(arr + rng.normal(0, noise_std, arr.shape), 0, 255)
    Image.fromarray(arr.astype(np.uint8)).save(path)


def main():
    assert _PIL_OK, "测试前置：PIL 必须可用（真实图像分析路径）"
    tmp = tempfile.mkdtemp(prefix="yyc3_style_test_")
    sk = StyleKeeper(profiles_root=tmp)

    # ── 1. 确定性派生：同 project_id 跨实例档案完全一致 ──
    print("[1] 确定性派生")
    p1 = StyleKeeper(profiles_root=tmp).get_profile("proj-a", persist=False)
    p2 = StyleKeeper(profiles_root=tmp).get_profile("proj-a", persist=False)
    check("seed 一致", p1["seed"] == p2["seed"])
    check("LUT 一致", p1["lut"] == p2["lut"])
    check("笔触一致", p1["brush"] == p2["brush"])
    check("派生标识", p1["derived"] == "sha256-deterministic")

    # ── 2. 跨项目隔离：不同 project_id 档案必然不同 ──
    print("[2] 跨项目隔离")
    pa = sk.get_profile("proj-a", persist=False)
    pb = sk.get_profile("proj-b", persist=False)
    check("种子不同", pa["seed"] != pb["seed"])
    check("LUT 不同", pa["lut"] != pb["lut"])

    # ── 3. 持久化：二次加载读缓存且相等 ──
    print("[3] 持久化防漂移")
    sk.get_profile("proj-persist")  # 首次：派生 + 落盘
    manifest = Path(tmp) / "proj-persist" / "profile.json"
    check("manifest 存在", manifest.is_file())
    on_disk = json.loads(manifest.read_text(encoding="utf-8"))
    reloaded = StyleKeeper(profiles_root=tmp).get_profile("proj-persist")
    check("读缓存相等", on_disk == reloaded)

    # ── 4. 风格注入：前缀含锚定要素且原 prompt 保留 ──
    print("[4] 风格注入")
    out = sk.apply_prompt("proj-a", "少女在雨夜天台回眸")
    check("前缀含风格锚定", "风格锚定" in out["style_prefix"])
    check("前缀含种子", f"seed={pa['seed']}" in out["style_prefix"])
    check("原 prompt 保留", out["image_prompt"].endswith("少女在雨夜天台回眸"))

    # ── 5. 参数级核验：跨镜头完全一致 PASS / 漂移 FAIL ──
    print("[5] 参数核验（TC-G3-009 主判定）")
    snaps_ok = [{"seed": pa["seed"], "lut": pa["lut"], "brush": pa["brush"]}
                for _ in range(3)]
    r_ok = sk.verify_params_match("proj-a", snaps_ok)
    check("3 镜头一致 PASS", r_ok["passed"] is True, str(r_ok))
    drifted = [dict(snaps_ok[0])]
    drifted[0]["seed"] = 12345
    r_bad = sk.verify_params_match("proj-a", drifted)
    check("漂移检出", r_bad["passed"] is False and len(r_bad["mismatches"]) == 1)

    # ── 6. 图像级比对：同分布 accept / 异色 redraw / 超限 escalate ──
    print("[6] 图像级三态闭环")
    ref = str(Path(tmp) / "ref.png")
    same = str(Path(tmp) / "same.png")
    diff = str(Path(tmp) / "diff.png")
    make_image(ref, (220, 180, 160), noise_std=6, seed=1)     # 暖肤色基调
    make_image(same, (218, 182, 158), noise_std=6, seed=99)   # 同分布不同噪声
    make_image(diff, (10, 15, 40), noise_std=4, seed=7)       # 深蓝夜色（异分布）
    r_accept = sk.post_check("proj-a", same, ref)
    check("同分布 accept", r_accept["action"] == "accept"
          and r_accept["mode"] == "pil_hist", str(r_accept))
    r_redraw = sk.post_check("proj-a", diff, ref, attempts=0)
    check("异分布 redraw", r_redraw["action"] == "redraw", str(r_redraw))
    r_esc = sk.post_check("proj-a", diff, ref, attempts=2)
    check("超限 escalate", r_esc["action"] == "escalate", str(r_esc))
    r_miss = sk.post_check("proj-a", "/nonexistent.png", ref)
    check("文件缺失 blocked", r_miss["action"] == "blocked", str(r_miss))

    print(f"\n结果：{PASS} PASS / {FAIL} FAIL")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
