"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import HeatmapChart from "@/components/charts/HeatmapChart";
import { HeatmapDataPoint } from "@/types";

export default function HeatmapContent() {
  const { start, end, line } = useFilter();
  const [data, setData] = useState<HeatmapDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/heatmap?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  const total = data.reduce((s, d) => s + d.count, 0);
  const peakHour = data.reduce((a, b) => {
    const aSum = data.filter((d) => d.hour === a).reduce((s, d) => s + d.count, 0);
    const bSum = data.filter((d) => d.hour === b.hour).reduce((s, d) => s + d.count, 0);
    return bSum > aSum ? b.hour : a;
  }, 0);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        ) : (
          <HeatmapChart data={data} />
        )}
      </div>

      {!loading && total > 0 && (
        <p className="text-xs text-muted-foreground">
          피크 시간대: <span className="font-medium text-foreground">{peakHour}시</span>
          &nbsp;· 총 {total.toLocaleString()}건
        </p>
      )}
    </div>
  );
}
