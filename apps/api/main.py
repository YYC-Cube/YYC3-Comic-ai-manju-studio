# ==============================================================
# YYC³ 漫剧生产系统 · manju-studio 后端入口（M1 后端通电）
# 架构：薄 HTTP 层 —— 9 路由按域挂载，引擎模块零改动直调
#   /api/v1/factory/*    storyboard · script · assets · task · image · audio · video
#   /api/v1/publishing/* publish
#   /api/v1/management/* project
# 契约：YYC3-78 端点治理；统一错误形态 {"error": {"code", "message"}}
# 启动：uvicorn main:app --host 0.0.0.0 --port 25200
# ==============================================================
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import assets, audio, image, project, publish, script, storyboard, task, video
from app.core.config import get_settings
from app.core.database import health as db_health
from app.core.redis import ping as redis_ping

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title="yyc3-manju-api",
        version="0.2.0-m1",
        description="YYC³ 漫剧全链路生产系统 · 生产端 API（M1 后端通电）",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- 统一错误形态（YYC3-78）----
    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "HTTP", "message": str(exc)}},
        )

    @app.get("/healthz", tags=["meta"])
    def healthz() -> dict:
        return {
            "status": "ok",
            "service": "manju-api",
            "stage": settings.service_stage,
            "redis": "ok" if redis_ping() else "down",
            "database": db_health(),
        }

    # ---- 路由挂载（按域）----
    factory = f"{settings.api_prefix}/factory"
    app.include_router(storyboard.router, prefix=factory, tags=["storyboard"])
    app.include_router(script.router, prefix=factory, tags=["script"])
    app.include_router(assets.router, prefix=factory, tags=["assets"])
    app.include_router(task.router, prefix=factory, tags=["task"])
    app.include_router(image.router, prefix=factory, tags=["image"])
    app.include_router(audio.router, prefix=factory, tags=["audio"])
    app.include_router(video.router, prefix=factory, tags=["video"])
    app.include_router(publish.router, prefix=f"{settings.api_prefix}/publishing", tags=["publish"])
    app.include_router(project.router, prefix=f"{settings.api_prefix}/management", tags=["project"])

    return app


app = create_app()
