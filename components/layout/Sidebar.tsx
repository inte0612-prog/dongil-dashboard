"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_MENUS } from "@/lib/constants";
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Building2,
  Users,
  Clock,
  Layers,
  Ruler,
  ClipboardList,
  Grid,
  Table,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  TrendingUp,
  Package,
  Building2,
  Users,
  Clock,
  Layers,
  Ruler,
  ClipboardList,
  Grid,
  Table,
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-5">
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight text-sidebar-foreground transition-opacity hover:opacity-70"
        >
          동일산업 생산 대시보드
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {NAV_MENUS.map((menu) => {
            const Icon = ICON_MAP[menu.icon];
            const isActive =
              menu.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(menu.href);

            return (
              <li key={menu.href}>
                <Link
                  href={menu.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span>{menu.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t px-5 py-3">
        <p className="text-xs text-muted-foreground">오창공장 MES · 465,399건</p>
      </div>
    </aside>
  );
}
