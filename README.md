# yyc3-ai-manju-studio（业务层·漫剧全链路生产系统）

> 生产端 Web 壳 + API。B 端生产可视化页面的唯一落点（页面对齐蓝本：YYC3-MiniMax-3 原型）。
> 架构衔接总方案与推进流程：见 MiniMax-3 仓 `docs/architecture-integration-plan.md`（YYC3-77）。

## 仓内布局（M0 · apps/packages 收敛后）

```
apps/
  web/                  # Next.js 16 前端（@yyc3/manju-frontend，dev :20300）
  api/                  # FastAPI + Celery 后端（uvicorn :25200）
packages/
  manifest-schema/      # StoryboardV1 双端契约（zod → JSON Schema，复用 H3 范式）
deploy/ · storage/ · tests/ · scripts/
docker-compose.mac.yml  # Mac 本地全栈（web/api/redis/postgres/celery）
docker-compose.dgx.yml  # DGX 生产差异骨架（随 M4 完善）
```

## 快速开始

```bash
# 前端 + 契约包（pnpm workspace）
pnpm install
pnpm dev                      # = pnpm --filter @yyc3/manju-frontend dev
pnpm test                     # 契约包冒烟（StoryboardV1 fixture + 负例）

# 全栈空壳（Docker）
docker compose -f docker-compose.mac.yml up --build
curl http://localhost:25200/healthz
```

## 当前阶段：M0（衔接奠基）

- 后端为 M0 空壳（仅 `/healthz`）；HTTP 业务层 9 路由在 M1 建设，引擎模块
  （`apps/api/app/modules/script_engine` / `consistency_engine`）届时薄路由暴露、零改动。
- 契约包 `packages/manifest-schema` 为 StoryboardV1 唯一真源；`apps/web/src/types/storyboard.ts`
  与 `apps/api/app/modules/script_engine/storyboard_schema.py` 与其同构，修改须三方同步。
