"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import HistogramChart from "@/components/charts/HistogramChart";
import { OrderData } from "@/types";

export default function OrdersContent() {
  const { start, end, line } = useFilter();
  const [data, setData] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  // 납기 소요일 히스토그램 구간 집계
  const buckets = [
    { label: "당일", min: 0, max: 0 },
    { label: "1~3일", min: 1, max: 3 },
    { label: "4~7일", min: 4, max: 7 },
    { label: "8~14일", min: 8, max: 14 },
    { label: "15~30일", min: 15, max: 30 },
    { label: "31일+", min: 31, max: Infinity },
  ];

  const histData = buckets.map((b) => ({
    label: b.label,
    count: data.filter((d) => d.leadDays >= b.min && d.leadDays <= b.max).length,
  }));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold">납기 소요일 분포</p>
        {loading ? (
          <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
        ) : histData.every((d) => d.count === 0) ? (
          <p className="py-10 text-center text-sm text-muted-foreground">수주 추적 데이터 없음</p>
        ) : (
          <HistogramChart data={histData} color="#8b5cf6" />
        )}
      </div>

      {!loading && data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-2.5">의뢰번호</th>
                <th className="px-4 py-2.5 text-right">건수</th>
                <th className="px-4 py-2.5 text-right">총 평수</th>
                <th className="px-4 py-2.5">최초일</th>
                <th className="px-4 py-2.5">최종일</th>
                <th className="px-4 py-2.5 text-right">소요일</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.orderNo} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{d.orderNo}</td>
                  <td className="px-4 py-2 text-right">{d.count.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{d.totalPyung.toFixed(1)}</td>
                  <td className="px-4 py-2">{d.firstDate}</td>
                  <td className="px-4 py-2">{d.lastDate}</td>
                  <td className="px-4 py-2 text-right">{d.leadDays}일</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
