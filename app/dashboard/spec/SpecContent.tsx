"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import DonutChart from "@/components/charts/DonutChart";
import { SpecData } from "@/types";

export default function SpecContent() {
  const { start, end, line } = useFilter();
  const [data, setData] = useState<SpecData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/spec?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  const argonData = data
    ? [
        { name: "아르곤 주입", count: data.argon.yes },
        { name: "미주입", count: data.argon.no },
      ]
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <ChartCard title="코팅 종류" loading={loading}>
        {data && <DonutChart data={data.coating} />}
      </ChartCard>
      <ChartCard title="간봉 규격" loading={loading}>
        {data && <DonutChart data={data.gap} />}
      </ChartCard>
      <ChartCard title="아르곤 주입 여부" loading={loading}>
        {data && (
          <DonutChart
            data={argonData}
            formatter={(v) => v.toLocaleString() + "건"}
          />
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {loading ? <div className="h-[260px] animate-pulse rounded-lg bg-muted" /> : children}
    </div>
  );
}
