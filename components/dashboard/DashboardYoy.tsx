"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

type YoyPoint = { month: string; cur: number; prev: number; growth: number | null };

interface Props { start: string; end: string; line: string }

export default function DashboardYoy({ start, end, line }: Props) {
  const [data, setData] = useState<YoyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/yoy?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="h-64 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const growthData = data.filter((d) => d.growth !== null);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* 전년 동기 대비 */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold">전년 동기 대비 월별 생산</p>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip
                formatter={(v) => [Number(v ?? 0).toLocaleString() + "건", ""]}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="cur"  name="올해" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Bar dataKey="prev" name="전년" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 성장률 추이 */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold">전년 동월 대비 성장률</p>
        {growthData.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={growthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={45} unit="%" />
              <Tooltip
                formatter={(v) => [`${Number(v ?? 0).toFixed(1)}%`, "성장률"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="growth" name="성장률" maxBarSize={24} radius={[3, 3, 0, 0]}>
                {growthData.map((d, i) => (
                  <Cell key={i} fill={(d.growth ?? 0) >= 0 ? "#3b82f6" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
