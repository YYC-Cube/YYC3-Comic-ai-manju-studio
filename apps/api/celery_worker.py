# ==============================================================
# YYC³ 漫剧生产系统 · Celery Worker 入口（M1）
# 队列：image / audio / video / render 四队列（task_routes 按任务名前缀分发）
# 启动：celery -A celery_worker worker -Q image,audio,video,render --loglevel=info
# ==============================================================
import os

from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "manju",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "app.tasks.image_tasks",
        "app.tasks.audio_tasks",
        "app.tasks.video_tasks",
        "app.tasks.render_tasks",
    ],
)

celery_app.conf.update(
    task_routes={
        "image.*": {"queue": "image"},
        "audio.*": {"queue": "audio"},
        "video.*": {"queue": "video"},
        "render.*": {"queue": "render"},
    },
    task_acks_late=True,
    task_track_started=True,
    result_expires=3600,
)
