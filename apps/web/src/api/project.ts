/**
 * 项目相关 API（M2 · 对齐后端 /api/v1/management/projects，{items} 信封）
 */
import { request } from "@/api/client";
import type { CreateProjectInput, Project } from "@/types/project";

/** 项目列表（解信封 {items}） */
export async function listProjects(): Promise<Project[]> {
  const res = await request<{ items: Project[] }>("/api/v1/management/projects");
  return res.items;
}

/** 项目详情 */
export function getProject(projectId: string): Promise<Project> {
  return request<Project>(
    `/api/v1/management/projects/${encodeURIComponent(projectId)}`
  );
}

/** 创建项目 */
export function createProject(input: CreateProjectInput): Promise<Project> {
  return request<Project>("/api/v1/management/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
