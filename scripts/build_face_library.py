#!/usr/bin/env python3
"""
@file: scripts/build_face_library.py
@description: face_encoder 512 维特征库建库脚本
              扫描 <source_dir> 下角色图片，逐个提取特征并落盘到特征库。
              若 source_dir 无角色图，则用 PIL 生成占位样本用于建库冒烟（不落仓库）。
@usage: python3 scripts/build_face_library.py [--source ASSETS_DIR] [--library LIBRARY_ROOT]
"""
import argparse
import json
import sys
import tempfile
from pathlib import Path

# 让脚本能 import backend 模块
BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

from app.modules.consistency_engine.face_encoder import FaceEncoder, FEATURE_DIM  # noqa: E402


def generate_sample_characters(target_dir: Path, names):
    """生成占位角色图（仅用于建库冒烟，不落仓库）"""
    import numpy as np
    from PIL import Image

    target_dir.mkdir(parents=True, exist_ok=True)
    created = []
    for i, name in enumerate(names):
        # 每张图用不同种子像素，保证哈希特征不同
        arr = np.zeros((128, 128, 3), dtype=np.uint8)
        arr[:, :, 0] = (i * 40) % 256
        arr[:, :, 1] = 100 + i * 20
        arr[:, :, 2] = 200 - i * 15
        img = Image.fromarray(arr)
        fpath = target_dir / f"{name}.png"
        img.save(fpath)
        created.append(fpath)
    return created


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=None, help="角色图片目录（每个文件=一个角色）")
    ap.add_argument("--library", default=None, help="特征库输出根目录")
    args = ap.parse_args()

    source = Path(args.source) if args.source else Path(tempfile.gettempdir()) / "yyc3_face_samples"
    library = args.library

    enc = FaceEncoder(library_root=library)
    print(f"[建库] 编码器模式：{enc.mode}  目标维度：{FEATURE_DIM}")
    print(f"[建库] 特征库根目录：{enc.library_root}")

    # 若无角色图，生成占位样本
    images = sorted(source.glob("*.png")) + sorted(source.glob("*.jpg"))
    if not images:
        print(f"[建库] {source} 无角色图，生成 3 个占位样本用于冒烟...")
        images = generate_sample_characters(source, ["hero", "heroine", "villain"])

    manifests = []
    for img in images:
        char_id = img.stem
        manifest = enc.save_character(char_id=char_id, name=char_id, image_path=str(img))
        manifests.append(manifest)

    # 校验：维度=512 + 同图余弦相似度=1.0
    print("\n[校验] 维度与确定性校验...")
    all_ok = True
    for m in manifests:
        vec = enc.load_feature(m["char_id"])
        assert vec is not None, f"{m['char_id']} 加载失败"
        if vec.shape != (FEATURE_DIM,):
            print(f"  FAIL {m['char_id']} shape={vec.shape}")
            all_ok = False
            continue
        # 同图二次编码余弦=1.0
        vec2 = enc.extract_feature(str(Path(m["source_image"])))
        cos = float(vec @ vec2)
        ok = abs(cos - 1.0) < 1e-5
        all_ok = all_ok and ok
        print(f"  {'PASS' if ok else 'FAIL'} {m['char_id']}: dim={vec.shape[0]} "
              f"cos_sim_same={cos:.6f} mode={m['mode']}")

    # 落盘 manifest 索引
    index_path = Path(enc.library_root) / "index.json"
    index_path.write_text(json.dumps(manifests, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[建库] 完成：{len(manifests)} 个角色，索引 -> {index_path}")
    print(f"[建库] 结果：{'全部通过' if all_ok else '存在失败'}")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
