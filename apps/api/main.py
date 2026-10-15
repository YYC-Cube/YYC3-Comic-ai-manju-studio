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

from app.api.v1 import assets, audio, auth, image, library, project, publish, script, storyboard, task, video
from app.core.config import get_settings
from app.core.database import health as db_health
from app.core.database import init_all as db_init_all
from app.core.redis import ping as redis_ping

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title="yyc3-manju-api",
        version="0.5.0-m5",
        description="YYC³ 漫剧全链路生产系统 · 生产端 API（M5 编排对齐 + 持久化切库）",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- M5 持久化：启动建表（幂等）+ 库域空表灌演示种子；失败不阻断，healthz 可见 ----
    try:
        db_init_all()
        from app.seeds import ensure_library_seed  # noqa: PLC0415

        seeded = ensure_library_seed()
        if seeded:
            print(f"[manju-api] 库域空表已灌演示种子 {seeded} 条（script/asset/batch）")
    except Exception as exc:  # noqa: BLE001
        print(f"[manju-api] 启动建表/种子失败（路由首次访问将惰性重试）：{exc}")

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
    app.include_router(library.router, prefix=factory, tags=["library"])
    app.include_router(publish.router, prefix=f"{settings.api_prefix}/publishing", tags=["publish"])
    app.include_router(project.router, prefix=f"{settings.api_prefix}/management", tags=["project"])
    # M4：会话鉴权（双模式 mock/gateway；挂 /api/v1 直下，不属于任一业务域）
    app.include_router(auth.router, prefix=settings.api_prefix, tags=["auth"])

    return app


app = create_app()
