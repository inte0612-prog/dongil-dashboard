"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";

type TopItem = { name: string; count: number; pyung: number };

interface Props { start: string; end: string; line: string }

function HorizontalBar({ data, title }: { data: TopItem[]; title: string }) {
  const height = Math.max(200, data.length * 44 + 40);
  const maxLabel = Math.max(...data.map((d) => d.name.length), 4);
  const yAxisWidth = Math.min(160, Math.max(80, maxLabel * 7));

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category" dataKey="name" tick={{ fontSize: 10 }}
            width={yAxisWidth} tickLine={false}
            tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + "…" : v}
          />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              const d = payload[0]?.payload as TopItem;
              return (
                <div className="rounded border bg-background p-2 text-xs shadow">
                  <p className="mb-1 font-medium">{label}</p>
                  <p>건수: {d.count.toLocaleString()}건</p>
                  <p>평수: {d.pyung.toFixed(1)}평</p>
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="count" name="건수" fill="#3b82f6" maxBarSize={16} radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#3b82f6" opacity={1 - (i / data.length) * 0.4} />
            ))}
          </Bar>
          <Bar dataKey="pyung" name="평수" fill="#22c55e" maxBarSize={16} radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#22c55e" opacity={1 - (i / data.length) * 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardTop({ start, end, line }: Props) {
  const [clients, setClients] = useState<TopItem[]>([]);
  const [items,   setItems]   = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/top?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => { setClients(d.clients ?? []); setItems(d.items ?? []); })
      .finally(() => setLoading(false));
  }, [start, end, line]);

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold">거래처별 생산 현황 (상위 10)</p>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold">품목별 생산 현황 (상위 10)</p>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <HorizontalBar data={clients} title="거래처별 생산 현황 (상위 10)" />
      <HorizontalBar data={items}   title="품목별 생산 현황 (상위 10)" />
    </div>
  );
}
