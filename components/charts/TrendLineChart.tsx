"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendDataPoint, TrendUnit } from "@/types";
import { LINE_COLORS } from "@/lib/constants";

interface TrendLineChartProps {
  data: TrendDataPoint[];
  metric: "count" | "pyung";
  line: string;
  unit: TrendUnit;
}

function formatTick(period: string, unit: TrendUnit): string {
  if (unit === "day")   return period.slice(5).replace("-", "/");   // "2024-01-15" → "01/15"
  if (unit === "week")  return period.slice(2);                      // "2024-W03"  → "24-W03"
  return period.slice(2).replace("-", "/");                          // "2024-01"   → "24/01"
}

function calcInterval(len: number, unit: TrendUnit): number {
  if (unit === "month") return Math.max(0, Math.floor(len / 18));
  if (unit === "week")  return Math.max(0, Math.floor(len / 26));
  return Math.max(0, Math.floor(len / 20));
}

export default function TrendLineChart({ data, metric, line, unit }: TrendLineChartProps) {
  const fmt = (v: number) => metric === "count" ? v.toLocaleString() : v.toFixed(0);
  const showSplit = line === "all";

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11 }}
          interval={calcInterval(data.length, unit)}
          tickFormatter={(v) => formatTick(v, unit)}
          angle={-30}
          textAnchor="end"
          height={48}
        />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} width={60} />
        <Tooltip
          formatter={(value) => [fmt(Number(value ?? 0)), ""]}
          labelFormatter={(label) => formatTick(label, unit)}
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
