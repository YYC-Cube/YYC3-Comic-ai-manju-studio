# ==============================================================
# YYC³ 漫剧生产系统 · tasks/audio_tasks —— 音频合成队列（M1 骨架）
# ==============================================================
from celery_worker import celery_app


@celery_app.task(name="audio.synthesize", queue="audio")
def synthesize(job: dict) -> dict:
    """TTS/配音任务骨架：校验入队契约，回执占位结果。"""
    if not isinstance(job, dict) or not job.get("text"):
        return {"accepted": False, "reason": "缺少 text", "job": job}
    return {
        "accepted": True,
        "stage": "M1-skeleton",
        "note": "真实配音链路随语音引擎接入（配音导演台页面迁移后联调）",
        "job": job,
    }
