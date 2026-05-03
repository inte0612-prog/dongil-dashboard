"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
  const fmt = formatter ?? ((v: number) => v.toLocaleString());
  const barHeight = 32;
  const height = Math.max(200, data.length * barHeight + 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmt} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11 }}
          width={120}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [fmt(Number(value)), ""]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={color}
              opacity={1 - (i / data.length) * 0.4}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
