"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_MENUS } from "@/lib/constants";
import GlobalFilter from "./GlobalFilter";

function getPageTitle(pathname: string): string {
  const menu = NAV_MENUS.find((m) =>
    m.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(m.href)
  );
  return menu?.label ?? "대시보드";
}

export default function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <Link href="/dashboard" className="text-sm font-semibold text-foreground hover:opacity-70 transition-opacity">{title}</Link>
      <Suspense>
        <GlobalFilter />
      </Suspense>
    </header>
  );
}
