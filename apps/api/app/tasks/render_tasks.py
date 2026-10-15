# ==============================================================
# YYC³ 漫剧生产系统 · tasks/render_tasks —— 合成导出队列（M1 骨架）
# ==============================================================
from celery_worker import celery_app


@celery_app.task(name="render.export", queue="render")
def export(job: dict) -> dict:
    """剪辑合成导出任务骨架：校验入队契约，回执占位结果。"""
    if not isinstance(job, dict) or not job.get("episode_id"):
        return {"accepted": False, "reason": "缺少 episode_id", "job": job}
    return {
        "accepted": True,
        "stage": "M1-skeleton",
        "note": "FFmpeg 渲染导出随剪辑域页面迁移联调（P1）",
        "job": job,
    }
