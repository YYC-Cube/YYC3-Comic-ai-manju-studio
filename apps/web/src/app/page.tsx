import { redirect } from "next/navigation";

/** 根路径重定向到生产指挥工作台（M3：dashboard 落地后由 /production 改指） */
export default function HomePage() {
  redirect("/dashboard");
}
