"use client";

/**
 * 左侧固定导航栏（240px，深色主题）
 */
import { cn } from "@/lib/utils";
import {
  BadgePercent,
  BookOpen,
  BrainCircuit,
  Clapperboard,
  Coins,
  Database,
  Film,
  FolderKanban,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  LibraryBig,
  ListChecks,
  MessagesSquare,
  Mic,
  Music,
  Scale,
  ScrollText,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/** 产线作业动线排序：驾驶舱 → 生产域（剧本→分镜→资产→批量→质检→任务）→ 后期/管理域（P2 迁入） */
const NAV_GROUPS: NavGroup[] = [
  {
    title: "产线作业",
    items: [
      { label: "指挥中心", href: "/dashboard", icon: Gauge },
      { label: "剧本工作台", href: "/script", icon: BookOpen },
      { label: "分镜工作台", href: "/storyboard", icon: Clapperboard },
      { label: "资产管理", href: "/assets", icon: Users },
      { label: "批量生成", href: "/production", icon: LayoutDashboard },
      { label: "质量检测", href: "/qa", icon: ShieldCheck },
      { label: "任务监控", href: "/tasks", icon: ListChecks },
      { label: "时间线剪辑", href: "/video", icon: Film },
      { label: "配音导演台", href: "/voice", icon: Mic },
      { label: "BGM 情绪库", href: "/music", icon: Music },
      { label: "模板中心", href: "/templates", icon: LayoutTemplate },
      { label: "商业化", href: "/ad", icon: BadgePercent },
      { label: "推送分发", href: "/publish", icon: Send },
      { label: "项目管理", href: "/project", icon: FolderKanban },
      { label: "成本核算", href: "/cost", icon: Coins },
      { label: "运营数据", href: "/analytics", icon: TrendingUp },
    ],
  },
  {
    title: "管理域",
    items: [
      { label: "设定集图谱", href: "/lore", icon: ScrollText },
      { label: "剧集中心", href: "/series", icon: LibraryBig },
      { label: "协同批注", href: "/collab", icon: MessagesSquare },
      { label: "智能体训练", href: "/admin/agents", icon: BrainCircuit },
      { label: "权限矩阵", href: "/admin/permission", icon: KeyRound },
      { label: "合规中心", href: "/admin/compliance", icon: Scale },
      { label: "RAG 语料", href: "/admin/rag", icon: Database },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-zinc-950 text-zinc-300">
      {/* 品牌区 */}
      <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-5">
        <img
          src="/yyc3-icons/logo.svg"
          alt="YYC³"
          className="h-6 w-auto invert"
        />
        <span className="ml-1 text-xs text-zinc-500">漫剧工场</span>
      </div>

      {/* 导航（分组：产线作业 / 管理域） */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-zinc-800 font-medium text-white"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 底部：品牌与 NAS 状态 */}
      <div className="border-t border-zinc-800 px-5 py-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>NAS /mnt/nas</span>
        </div>
        <p className="mt-2 leading-5">YYC³ AI Family 漫剧生产线</p>
      </div>
    </aside>
  );
}
