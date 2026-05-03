"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import ScatterChart from "@/components/charts/ScatterChart";
import DonutChart from "@/components/charts/DonutChart";
import { DimensionScatterPoint, SizeClassData, TopDimension } from "@/types";
import { SIZE_CLASS } from "@/lib/constants";

interface DimData {
  scatter: DimensionScatterPoint[];
  sizeClass: SizeClassData;
  topDimensions: TopDimension[];
}

export default function DimensionsContent() {
  const { start, end, line } = useFilter();
  const [data, setData] = useState<DimData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dimensions?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  const sizeData = data
    ? (Object.entries(data.sizeClass) as [keyof SizeClassData, number][]).map(
        ([k, v]) => ({ name: SIZE_CLASS[k].label, count: v })
      )
    : [];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <p className="mb-3 text-sm font-semibold">치수 분포 산점도</p>
          {loading ? (
            <div className="h-[340px] animate-pulse rounded-lg bg-muted" />
          ) : (
            data && <ScatterChart data={data.scatter} />
          )}
          {!loading && data && (
            <p className="mt-1 text-right text-xs text-muted-foreground">
              샘플 {data.scatter.length.toLocaleString()}건
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold">크기 분류</p>
          {loading ? (
            <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
          ) : (
            <DonutChart data={sizeData} />
          )}
        </div>
      </div>

      {!loading && data && data.topDimensions.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">너비 (mm)</th>
                <th className="px-4 py-2.5">높이 (mm)</th>
                <th className="px-4 py-2.5 text-right">건수</th>
              </tr>
            </thead>
            <tbody>
              {data.topDimensions.map((d, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">{d.width}</td>
                  <td className="px-4 py-2">{d.height}</td>
                  <td className="px-4 py-2 text-right">{d.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
