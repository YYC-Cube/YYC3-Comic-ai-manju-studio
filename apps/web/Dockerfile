# manju-web（M0 开发镜像；构建上下文为仓库根，以接入 pnpm workspace）
FROM node:22-alpine

RUN corepack enable

WORKDIR /repo

# 先拷贝清单层，最大化利用构建缓存
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/manifest-schema/package.json packages/manifest-schema/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/manifest-schema packages/manifest-schema

WORKDIR /repo/apps/web
EXPOSE 20300
CMD ["pnpm", "dev"]
