"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendDataPoint } from "@/types";
import { LINE_COLORS } from "@/lib/constants";

interface TrendLineChartProps {
  data: TrendDataPoint[];
  metric: "count" | "pyung";
  line: string;
}

const TICK_INTERVAL = (len: number) => {
  if (len <= 31) return 0;
  if (len <= 90) return 6;
  return Math.floor(len / 15);
};

export default function TrendLineChart({ data, metric, line }: TrendLineChartProps) {
  const fmt = (v: number) =>
    metric === "count" ? v.toLocaleString() : v.toFixed(0);

  const showSplit = line === "all";

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11 }}
          interval={TICK_INTERVAL(data.length)}
        />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} width={60} />
        <Tooltip
          formatter={(value) => [fmt(Number(value ?? 0)), ""]}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        {showSplit ? (
          <>
            <Line
              type="monotone"
              dataKey={metric === "count" ? "line1Count" : "line1Pyung"}
              name="1-LINE"
              stroke={LINE_COLORS["1-LINE"]}
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey={metric === "count" ? "line2Count" : "line2Pyung"}
              name="2-LINE"
              stroke={LINE_COLORS["2-LINE"]}
              dot={false}
              strokeWidth={2}
            />
          </>
        ) : (
          <Line
            type="monotone"
            dataKey={metric}
            name={line}
            stroke={LINE_COLORS[line as keyof typeof LINE_COLORS] ?? LINE_COLORS["전체"]}
            dot={false}
            strokeWidth={2}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
