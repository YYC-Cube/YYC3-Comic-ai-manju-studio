/**
 * @file packages/manifest-schema/src/gen-json-schema.ts
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-15
 *
 * Contract: zod -> JSON Schema（Python 侧 jsonschema 校验的同源真源）
 * Output: packages/manifest-schema/schema/storyboard.v1.json
 * 衔接点：apps/api/app/modules/script_engine/storyboard_schema.py 的
 *         SCHEMA_PATH 指向 script_engine/schema/storyboard.v1.json，
 *         M1 需将本导出物同步至该路径（或改读包内路径）。
 */
import fs from "node:fs";
import path from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { storyboardV1Schema } from "./index";

const outDir = path.join(__dirname, "..", "schema");
fs.mkdirSync(outDir, { recursive: true });

// 不指定 target：默认 Draft-07；superRefine 跨字段规则不进 JSON Schema（由两端校验器承担）
const json = zodToJsonSchema(storyboardV1Schema, { name: "storyboard.v1" });
const file = path.join(outDir, "storyboard.v1.json");
fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
console.log("generated:", path.relative(process.cwd(), file));
