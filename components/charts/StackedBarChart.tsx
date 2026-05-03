"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LINE_COLORS } from "@/lib/constants";

interface StackedBarChartProps {
  data: { name: string; "1-LINE": number; "2-LINE": number }[];
  formatter?: (v: number) => string;
}

export default function StackedBarChart({ data, formatter }: StackedBarChartProps) {
  const fmt = formatter ?? ((v: number) => v.toLocaleString());
  const barHeight = 36;
  const height = Math.max(200, data.length * barHeight + 60);

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
          dataKey="name"
          tick={{ fontSize: 11 }}
          width={80}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [fmt(Number(value)), ""]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="1-LINE" stackId="a" fill={LINE_COLORS["1-LINE"]} maxBarSize={20} />
        <Bar dataKey="2-LINE" stackId="a" fill={LINE_COLORS["2-LINE"]} maxBarSize={20} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
