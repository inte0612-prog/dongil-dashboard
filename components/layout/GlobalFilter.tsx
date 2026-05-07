"use client";

import { useFilter } from "@/hooks/useFilter";
import { LINE_OPTIONS } from "@/lib/constants";
import DateRangePicker from "./DateRangePicker";

export default function GlobalFilter() {
  const { start, end, line, setFilter } = useFilter();

  return (
    <div className="flex items-center gap-2">
      <DateRangePicker
        start={start}
        end={end}
        onChange={(s, e) => setFilter({ start: s, end: e })}
      />
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
