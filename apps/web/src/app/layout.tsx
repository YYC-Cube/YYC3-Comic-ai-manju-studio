import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "YYC³ 漫剧工作台",
  description:
    "YYC³ AI Family 漫剧生产线前端工作台：生产监控、成本核算、剧本分镜、时间线剪辑一体化",
  icons: {
    icon: [
      { url: "/yyc3-icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/yyc3-icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/yyc3-icons/apple-touch-icon.png",
  },
  manifest: "/yyc3-icons/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          <Sidebar />
          {/* 侧栏固定 240px（w-60），主内容区左侧让位 */}
          <div className="pl-60">
            <Topbar />
            <main className="mx-auto max-w-[1400px] p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
