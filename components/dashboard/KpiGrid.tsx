"use client";

import { useEffect, useState } from "react";
import KpiCard from "./KpiCard";
import { KpiData } from "@/types";
import { formatCount, formatPyung, formatRatio } from "@/lib/utils/numberUtils";

interface KpiGridProps {
  start: string;
  end: string;
  line: string;
}

export default function KpiGrid({ start, end, line }: KpiGridProps) {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kpi?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="총 생산 건수"
        value={formatCount(data.totalCount)}
        trend={data.momChange}
      />
      <KpiCard
        label="총 생산 평수"
        value={formatPyung(data.totalPyung)}
        trend={data.momChange}
      />
      <KpiCard
        label="일 평균 생산"
        value={formatPyung(data.avgDailyPyung)}
        sub="기간 평균"
      />
      <KpiCard
        label="라인 비율"
        value={`1-LINE ${formatRatio(data.line1Ratio)}`}
        sub={`2-LINE ${formatRatio(data.line2Ratio)}`}
      />
    </div>
  );
}
