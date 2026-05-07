"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import { LINE_OPTIONS } from "@/lib/constants";
import { getPresetRanges } from "@/lib/utils/dateUtils";
import { cn } from "@/lib/utils";
import DateRangePicker from "./DateRangePicker";

export default function GlobalFilter() {
  const { start, end, line, setFilter } = useFilter();
  const [dataRange, setDataRange] = useState<{ min: string; max: string } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/data-range")
      .then((r) => r.json())
      .then((d) => setDataRange({ min: d.minDate, max: d.maxDate }))
      .catch(() => {});
  }, []);

  const presets = getPresetRanges().map((p) =>
    p.label === "전체" && dataRange ? { ...p, start: dataRange.min, end: dataRange.max } : p
  );
  const activeLabel = presets.find((p) => p.start === start && p.end === end)?.label ?? null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 빠른 선택 버튼 */}
      <div className="flex rounded-md border bg-background">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setFilter({ start: p.start, end: p.end })}
            className={cn(
              "px-2.5 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md",
              activeLabel === p.label
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 달력 직접 선택 */}
      <DateRangePicker
        start={start}
        end={end}
        onChange={(s, e) => setFilter({ start: s, end: e })}
      />

      {/* 라인 필터 */}
      <select
        value={line}
        onChange={(ev) => setFilter({ line: ev.target.value as typeof line })}
        className="h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {LINE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
