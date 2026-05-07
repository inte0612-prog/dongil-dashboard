"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import TrendLineChart from "@/components/charts/TrendLineChart";
import { TrendDataPoint, TrendUnit } from "@/types";
import { cn } from "@/lib/utils";

const METRIC_OPTIONS = [
  { label: "건수", value: "count" },
  { label: "평수", value: "pyung" },
] as const;

type Metric = "count" | "pyung";

function autoUnit(start: string, end: string): TrendUnit {
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
  );
  if (days > 365 * 2) return "month";
  if (days > 90)      return "week";
  return "day";
}

export default function TrendContent() {
  const { start, end, line } = useFilter();
  const [metric, setMetric] = useState<Metric>("count");
  const [data, setData]     = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const unit = autoUnit(start, end);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trend?start=${start}&end=${end}&line=${line}&unit=${unit}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [start, end, line, unit]);

  const unitLabel = unit === "day" ? "일별" : unit === "week" ? "주별" : "월별";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          집계 단위: <span className="font-medium text-foreground">{unitLabel}</span>
          （기간에 따라 자동 조정）
        </span>
        <ToggleGroup
          options={METRIC_OPTIONS}
          value={metric}
          onChange={(v) => setMetric(v as Metric)}
        />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        {loading ? (
          <div className="h-[340px] animate-pulse rounded-lg bg-muted" />
        ) : (
          <TrendLineChart data={data} metric={metric} line={line} unit={unit} />
        )}
      </div>

      {!loading && (
        <p className="text-right text-xs text-muted-foreground">
          총 {data.length}개 구간
        </p>
      )}
    </div>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md border bg-background">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
