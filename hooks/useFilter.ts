"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LineFilter } from "@/types";
import { getDefaultDateRange } from "@/lib/utils/dateUtils";

export function useFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaults = getDefaultDateRange();

  const start = searchParams.get("start") ?? defaults.start;
  const end   = searchParams.get("end")   ?? defaults.end;
  const line  = (searchParams.get("line") ?? "all") as LineFilter;

  function setFilter(params: { start?: string; end?: string; line?: LineFilter }) {
    const next = new URLSearchParams(searchParams.toString());
    if (params.start !== undefined) next.set("start", params.start);
    if (params.end   !== undefined) next.set("end",   params.end);
    if (params.line  !== undefined) next.set("line",  params.line);
    router.push(`${pathname}?${next.toString()}`);
  }

  function resetFilter() {
    router.push(`${pathname}?start=${defaults.start}&end=${defaults.end}&line=all`);
  }

  return { start, end, line, setFilter, resetFilter };
}
