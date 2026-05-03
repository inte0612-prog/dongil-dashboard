"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import StackedBarChart from "@/components/charts/StackedBarChart";
import { RegistrarData } from "@/types";

export default function RegistrarsContent() {
  const { start, end, line } = useFilter();
  const [data, setData] = useState<RegistrarData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/registrars?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  // 등록자별로 1-LINE / 2-LINE 건수 합산
  const registrarMap = new Map<string, { "1-LINE": number; "2-LINE": number }>();
  for (const d of data) {
    const existing = registrarMap.get(d.registrar) ?? { "1-LINE": 0, "2-LINE": 0 };
    if (d.line === "1-LINE") existing["1-LINE"] += d.count;
    else if (d.line === "2-LINE") existing["2-LINE"] += d.count;
    registrarMap.set(d.registrar, existing);
  }

  const chartData = Array.from(registrarMap.entries())
    .map(([name, v]) => ({ name, ...v, total: v["1-LINE"] + v["2-LINE"] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold">등록자별 라인 생산 건수</p>
        {loading ? (
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
        ) : chartData.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <StackedBarChart
            data={chartData}
            formatter={(v) => v.toLocaleString() + "건"}
          />
        )}
      </div>

      {!loading && data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-2.5">등록자</th>
                <th className="px-4 py-2.5">라인</th>
                <th className="px-4 py-2.5 text-right">건수</th>
                <th className="px-4 py-2.5 text-right">총 평수</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{d.registrar}</td>
                  <td className="px-4 py-2">{d.line}</td>
                  <td className="px-4 py-2 text-right">{d.count.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{d.totalPyung.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
