#!/usr/bin/env python3
"""
@file: scripts/train_character_lora.py
@description: 角色 LoRA 训练骨架（M3 视听产能 · 一致性 0.85+ 的训练路径）
              基于 diffusers text-to-image LoRA 微调（SD1.5 级 checkpoint），
              训练集 = 角色 IP 设定图（生成式扩增：flip/色温/JPEG 变体族）。
@status: skeleton（可运行骨架；Mac MPS 可跑小步数，DGX 上放大参数）
@usage:
  # 1) 准备训练集：角色设定图放入 assets/characters/<char_id>/train/*.png
  # 2) 安装训练依赖（独立环境，避免污染运行时 venv）：
  #    pip install diffusers transformers accelerate peft safetensors
  # 3) 训练（Mac 小步数验证 / DGX 正式参数见 TRAIN_PRESETS）：
  #    python scripts/train_character_lora.py --char-id sd-hero \
  #        --base-model /Users/yanyu/YYC-Cube/tools/ComfyUI/models/checkpoints/DreamShaper_8_pruned.safetensors \
  #        --steps 200 --output models/lora/sd-hero.safetensors
@evidence: 训练后 LoRA 放 ComfyUI models/loras/，text_to_image 工作流追加
           LoraLoader 节点（weight 0.8-1.0），跨种子 sim 复测（目标 ≥0.85），
           执行器复用 scripts/run_ipadapter_identity.py 的矩阵（改 LoRA 路径）。
"""
import argparse
from pathlib import Path

# ── 训练参数预设（Mac 验证 / DGX 正式）──
TRAIN_PRESETS = {
    "mac_smoke": {"steps": 200, "lr": 5e-4, "batch": 1, "res": 512,
                  "lora_rank": 8, "note": "链路验证用（≈30-60min MPS）"},
    "dgx_prod": {"steps": 2000, "lr": 1e-4, "batch": 4, "res": 768,
                 "lora_rank": 32, "note": "正式角色 LoRA（DGX NF4，≈2-4h/角色）"},
}


def build_dataset(char_id: str, assets_root: Path) -> Path:
    """训练集装配：设定图 + 变换族扩增（flip/暖/冷/JPEG60，同 G3 标定方法）。

    :return: 训练图目录（每图同名 .txt 为 caption：<char_id> 的固定触发词）
    """
    import numpy as np
    from PIL import Image

    src_dir = assets_root / char_id / "train"
    out_dir = assets_root / char_id / "dataset"
    out_dir.mkdir(parents=True, exist_ok=True)
    trigger = f"<{char_id}>"  # LoRA 触发词

    n = 0
    for img_path in sorted(src_dir.glob("*.png")) + sorted(src_dir.glob("*.jpg")):
        img = Image.open(img_path).convert("RGB").resize((512, 512), Image.LANCZOS)
        variants = {"orig": img, "flip": img.transpose(Image.FLIP_LEFT_RIGHT)}
        warm = np.array(img).astype(np.float32)
        warm[..., 0] *= 1.12
        variants["warm"] = Image.fromarray(np.clip(warm, 0, 255).astype(np.uint8))
        variants["cool"] = Image.fromarray(
            np.clip(warm * np.array([0.9, 1.0, 1.12]), 0, 255).astype(np.uint8))
        for name, im in variants.items():
            p = out_dir / f"{img_path.stem}_{name}.png"
            im.save(p, "JPEG", quality=88)
            p.with_suffix(".txt").write_text(
                f"{trigger}, portrait of a young chinese wuxia heroine, "
                f"ancient hanfu, ink wash background", encoding="utf-8")
            n += 1
    print(f"[dataset] {char_id}: {n} 张训练图（含扩增）→ {out_dir}")
    return out_dir


def train(char_id: str, base_model: str, steps: int, lr: float,
          batch: int, res: int, rank: int, output: str):
    """diffusers LoRA 微调主链（骨架：依赖安装后可执行）。"""
    try:
        import torch  # noqa: F401
        from diffusers import AutoPipelineForText2Image  # noqa: F401
        from peft import LoraConfig  # noqa: F401
    except ImportError as e:
        print(f"[skip] 训练依赖未安装（{e}）——骨架模式，参数已留证："
              f"steps={steps} lr={lr} batch={batch} res={res} rank={rank}")
        print("[next] pip install diffusers transformers accelerate peft 后重跑；"
              "或按 TRAIN_PRESETS['dgx_prod'] 在 DGX 执行")
        return 1

    # 正式实现要点（DGX/MPS 通用）：
    # 1) AutoPipelineForText2Image.from_single_file(base_model) 加载底模
    # 2) LoraConfig(r=rank, target_modules=["to_k","to_q","to_v","to_out_0"])
    # 3) 训练循环：dataset 图+caption，前缀触发词 <char_id>，AdamW(lr)
    # 4) 导出 ComfyUI 兼容 safetensors（peft merge_and_unload → save_lora_weights）
    raise NotImplementedError("骨架：依赖就绪后按上方要点补全训练循环（DGX 首选）")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--char-id", required=True)
    ap.add_argument("--base-model", required=True)
    ap.add_argument("--steps", type=int, default=200)
    ap.add_argument("--lr", type=float, default=5e-4)
    ap.add_argument("--batch", type=int, default=1)
    ap.add_argument("--res", type=int, default=512)
    ap.add_argument("--rank", type=int, default=8)
    ap.add_argument("--output", default=None)
    ap.add_argument("--assets-root",
                    default="/tmp/yyc3_assets/characters")
    args = ap.parse_args()

    dataset = build_dataset(args.char_id, Path(args.assets_root))
    out = args.output or f"models/lora/{args.char_id}.safetensors"
    return train(args.char_id, args.base_model, args.steps, args.lr,
                 args.batch, args.res, args.rank, out)


if __name__ == "__main__":
    raise SystemExit(main())
