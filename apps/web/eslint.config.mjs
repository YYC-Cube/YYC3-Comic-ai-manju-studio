// P3 修复（2026-10-05 首审）：Next 16 已移除 `next lint`——按官方口径
// flat config 直跑 eslint（pnpm lint = eslint .）；eslint-config-next@16
// 原生导出 flat 数组，无需 FlatCompat
import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
];

export default config;
