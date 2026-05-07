"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TrendPoint = {
  day: string;
  count: number;
  pyung: number;
  line1: number;
  line2: number;
  ma7: number;
  ma30: number;
  isAnomaly: boolean;
};

interface Props {
  start: string;
  end: string;
  line: string;
}

export default function DashboardTrend({ start, end, line }: Props) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [split, setSplit] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/trend?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  if (loading) return <Skeleton />;
  if (!data.length) return <Empty />;

  const trimmed = (() => {
    let last = data.length - 1;
    while (last > 0 && data[last].count === 0 && data[last].ma7 === 0 && data[last].ma30 === 0) last--;
    return data.slice(0, last + 1);
  })();

  const chartData = trimmed.map((d) => ({
    ...d,
    anomalyValue: d.isAnomaly ? d.count : null,
  }));

  const counts = chartData.map((d) => d.count);
  const avg = counts.reduce((s, v) => s + v, 0) / counts.length;
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const cv = avg > 0
    ? (Math.sqrt(counts.reduce((s, v) => s + (v - avg) ** 2, 0) / counts.length) / avg) * 100
    : 0;

  const tickCount = Math.min(chartData.length, 20);
  const interval = Math.max(0, Math.floor((chartData.length - 1) / Math.max(1, tickCount - 1)));

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">생산량 추이 (이동평균)</p>
        <button
          onClick={() => setSplit((v) => !v)}
          className="rounded-md border px-3 py-1 text-xs transition-colors hover:bg-accent"
        >
          {split ? "합산 보기" : "라인 분리"}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10 }}
            interval={interval}
            angle={-30}
            textAnchor="end"
            height={45}
            tickFormatter={(v: string) => v.slice(5).replace("-", "/")}
          />
          <YAxis tick={{ fontSize: 11 }} width={40} />
          <Tooltip
            shared
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              const filtered = payload.filter((p) => typeof p.value === "number" && !isNaN(p.value as number));
              return (
                <div className="rounded border bg-background p-2 text-xs shadow">
                  <p className="mb-1 font-medium">{label}</p>
                  {filtered.map((p, i) => (
                    <p key={i} style={{ color: p.color as string }}>
                      {p.name}: {Number(p.value ?? 0).toLocaleString()}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

          {split ? (
            <>
              <Line type="monotone" dataKey="line1" name="1-LINE" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="line2" name="2-LINE" stroke="#22c55e" dot={false} strokeWidth={1.5} />
            </>
          ) : (
            <Line type="monotone" dataKey="count" name="생산 건수" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
          )}

          <Line
            type="monotone"
            dataKey="ma7"
            name="7일 이동평균"
            stroke="#f97316"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="ma30"
            name="30일 이동평균"
            stroke="#22c55e"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />

          <Line
            type="linear"
            dataKey="anomalyValue"
            name="이상치"
            stroke="transparent"
            connectNulls={false}
            dot={{ r: 4, fill: "#ef4444", fillOpacity: 0.35, stroke: "none" }}
            activeDot={{ r: 5, fill: "#ef4444", fillOpacity: 0.45, stroke: "none" }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span><span className="inline-block h-[2px] w-6 bg-orange-400 align-middle" /> 7일 이동평균</span>
        <span><span className="inline-block h-[2px] w-6 bg-green-500 align-middle" /> 30일 이동평균</span>
        <span><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-300 align-middle opacity-60" /> 이상치 (±2σ)</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          { label: "일평균", value: `${avg.toFixed(1)}건` },
          { label: "최대", value: `${max.toLocaleString()}건` },
          { label: "최소", value: `${min.toLocaleString()}건` },
          { label: "변동성", value: `${cv.toFixed(1)}%` },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold">생산량 추이 (이동평균)</p>
      <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
    </section>
  );
}

function Empty() {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold">생산량 추이 (이동평균)</p>
      <p className="py-16 text-center text-sm text-muted-foreground">데이터 없음</p>
    </section>
  );
}
