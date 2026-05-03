"use client";

import { useFilter } from "@/hooks/useFilter";
import { LINE_OPTIONS } from "@/lib/constants";

export default function GlobalFilter() {
  const { start, end, line, setFilter, resetFilter } = useFilter();

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={start}
        onChange={(e) => setFilter({ start: e.target.value })}
        className="h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="text-xs text-muted-foreground">~</span>
      <input
        type="date"
        value={end}
        onChange={(e) => setFilter({ end: e.target.value })}
        className="h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <select
        value={line}
        onChange={(e) => setFilter({ line: e.target.value as typeof line })}
        className="h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {LINE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        onClick={resetFilter}
        className="h-8 rounded-md border bg-background px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        초기화
      </button>
    </div>
  );
}
