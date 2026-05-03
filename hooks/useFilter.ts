"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { LineFilter } from "@/types";
import { getDefaultDateRange } from "@/lib/utils/dateUtils";

export function useFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaults = getDefaultDateRange();

  const start = searchParams.get("start") ?? defaults.start;
  const end = searchParams.get("end") ?? defaults.end;
  const line = (searchParams.get("line") ?? "all") as LineFilter;

  const setFilter = useCallback(
    (params: { start?: string; end?: string; line?: LineFilter }) => {
      const current = new URLSearchParams(searchParams.toString());
      if (params.start !== undefined) current.set("start", params.start);
      if (params.end !== undefined) current.set("end", params.end);
      if (params.line !== undefined) current.set("line", params.line);
      router.push(`${pathname}?${current.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const resetFilter = useCallback(() => {
    router.push(`${pathname}?start=${defaults.start}&end=${defaults.end}&line=all`);
  }, [router, pathname, defaults]);

  return { start, end, line, setFilter, resetFilter };
}
