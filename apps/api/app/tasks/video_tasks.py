# ==============================================================
# YYC³ 漫剧生产系统 · tasks/video_tasks —— 视频生成队列（M1 骨架）
# ==============================================================
from celery_worker import celery_app


@celery_app.task(name="video.render", queue="video")
def render_video(job: dict) -> dict:
    """图生视频任务骨架：校验入队契约，回执占位结果。"""
    if not isinstance(job, dict) or not job.get("shot_id"):
        return {"accepted": False, "reason": "缺少 shot_id", "job": job}
    return {
        "accepted": True,
        "stage": "M1-skeleton",
        "note": "真实视频生成随 H3 产线 A2A 衔接（D6/M5）",
        "job": job,
    }
