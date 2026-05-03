"use client";

import { HeatmapDataPoint } from "@/types";
import { WEEKDAY_LABELS } from "@/lib/utils/dateUtils";

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getColor(count: number, max: number): string {
  if (max === 0 || count === 0) return "hsl(var(--muted))";
  const ratio = count / max;
  const alpha = 0.15 + ratio * 0.85;
  return `rgba(59, 130, 246, ${alpha})`;
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  const max = Math.max(...data.map((d) => d.count));

  const getCount = (weekday: number, hour: number) =>
    data.find((d) => d.weekday === weekday && d.hour === hour)?.count ?? 0;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* 시간 헤더 */}
        <div className="mb-1 flex">
          <div className="w-8 shrink-0" />
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex-1 text-center text-[10px] text-muted-foreground"
            >
              {h % 3 === 0 ? `${h}시` : ""}
            </div>
          ))}
        </div>

        {/* 요일 × 시간 그리드 */}
        {WEEKDAY_LABELS.map((label, w) => (
          <div key={w} className="flex items-center gap-0.5 py-0.5">
            <div className="w-8 shrink-0 text-right text-[10px] text-muted-foreground pr-1">
              {label}
            </div>
            {HOURS.map((h) => {
              const count = getCount(w, h);
              return (
                <div
                  key={h}
                  className="group relative flex-1 rounded-sm"
                  style={{
                    backgroundColor: getColor(count, max),
                    aspectRatio: "1",
                    minHeight: "22px",
                  }}
                >
                  {/* 툴팁 */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                    {label} {h}시 — {count.toLocaleString()}건
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* 범례 */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <span className="text-[10px] text-muted-foreground">적음</span>
          {[0.1, 0.3, 0.5, 0.7, 1.0].map((r) => (
            <div
              key={r}
              className="h-3 w-5 rounded-sm"
              style={{ backgroundColor: `rgba(59, 130, 246, ${0.15 + r * 0.85})` }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">많음</span>
        </div>
      </div>
    </div>
  );
}
