"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface HorizontalBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  formatter?: (v: number) => string;
}

export default function HorizontalBarChart({
  data,
  color = "#3b82f6",
  formatter,
}: HorizontalBarChartProps) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">데이터 없음</p>;
  }

  const fmt = formatter ?? ((v: number) => v.toLocaleString());
  const height = Math.max(200, data.length * 36 + 40);
  const maxLabel = Math.max(...data.map((d) => d.label.length));
  const yAxisWidth = Math.min(180, Math.max(120, maxLabel * 8));

  return (
    <div style={{ width: "100%" }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 70, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmt} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11 }}
            width={yAxisWidth}
            tickLine={false}
            tickFormatter={(v: string) =>
              v.length > 18 ? v.slice(0, 18) + "…" : v
            }
          />
          <Tooltip
            formatter={(value) => [fmt(Number(value)), ""]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24} minPointSize={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} opacity={1 - (i / data.length) * 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
