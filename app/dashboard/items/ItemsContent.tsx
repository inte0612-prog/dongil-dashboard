"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import { ItemData } from "@/types";
import { ITEM_LIMIT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { label: "건수순", value: "count" },
  { label: "평수순", value: "pyung" },
] as const;

type SortBy = "count" | "pyung";

export default function ItemsContent() {
  const { start, end, line } = useFilter();
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>("count");
  const [data, setData] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/items?start=${start}&end=${end}&line=${line}&limit=${limit}&sortBy=${sortBy}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [start, end, line, limit, sortBy]);

  const chartData = data.map((d) => ({
    label: d.itemName || d.itemCode,
    value: sortBy === "pyung" ? Math.round(d.totalPyung) : d.count,
  }));

  const formatter =
    sortBy === "pyung"
      ? (v: number) => v.toLocaleString() + "평"
      : (v: number) => v.toLocaleString() + "건";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(v) => setSortBy(v as SortBy)}
        />
        <ToggleGroup
          options={ITEM_LIMIT_OPTIONS}
          value={limit}
          onChange={(v) => setLimit(Number(v))}
        />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        {loading ? (
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
        ) : data.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <HorizontalBarChart
            data={chartData}
            color="#3b82f6"
            formatter={formatter}
          />
        )}
      </div>

      {!loading && data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">품명</th>
                <th className="px-4 py-2.5 text-right">건수</th>
                <th className="px-4 py-2.5 text-right">총 평수</th>
                <th className="px-4 py-2.5 text-right">평균 평수</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.itemCode} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{d.itemName || d.itemCode}</td>
                  <td className="px-4 py-2 text-right">{d.count.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{d.totalPyung.toFixed(1)}</td>
                  <td className="px-4 py-2 text-right">{d.avgPyung.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ToggleGroup<T extends string | number>({
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
          key={String(opt.value)}
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
