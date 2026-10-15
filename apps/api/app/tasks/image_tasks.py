# ==============================================================
# YYC³ 漫剧生产系统 · tasks/image_tasks —— 图像生成队列（M1 骨架）
# M1：任务登记与回执形态定稿；真实生成链路（H3 产线 / SDXL）随 A2A 衔接（D6）
# ==============================================================
from celery_worker import celery_app


@celery_app.task(name="image.generate", queue="image")
def generate_image(job: dict) -> dict:
    """文生图任务骨架：校验入队契约，回执占位结果。"""
    if not isinstance(job, dict) or not job.get("image_prompt"):
        return {"accepted": False, "reason": "缺少 image_prompt", "job": job}
    return {
        "accepted": True,
        "stage": "M1-skeleton",
        "note": "真实生成链路随 H3 产线 A2A 衔接（D6/M5）",
        "job": job,
    }
