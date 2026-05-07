"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { LINE_COLORS } from "@/lib/constants";

interface StackedBarChartProps {
  data: { name: string; line1: number; line2: number }[];
  formatter?: (v: number) => string;
}

export default function StackedBarChart({ data, formatter }: StackedBarChartProps) {
  const fmt = formatter ?? ((v: number) => v.toLocaleString());
  const height = Math.max(200, data.length * 36 + 60);
  const maxLabel = Math.max(...data.map((d) => d.name.length));
  const yAxisWidth = Math.min(180, Math.max(80, maxLabel * 8));

  return (
    <div style={{ width: "100%" }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmt} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={yAxisWidth}
            tickLine={false}
            tickFormatter={(v: string) =>
              v.length > 18 ? v.slice(0, 18) + "…" : v
            }
          />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              const items = payload.filter((p) => Number(p.value) > 0);
              if (!items.length) return null;
              return (
                <div className="rounded border bg-background p-2 text-xs shadow">
                  <p className="mb-1 font-medium">{label}</p>
                  {items.map((p, i) => (
                    <p key={i} style={{ color: p.fill as string }}>
                      {p.name}: {fmt(Number(p.value))}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            formatter={(v) => (v === "line1" ? "1-LINE" : "2-LINE")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="line1" name="line1" stackId="a" fill={LINE_COLORS["1-LINE"]} maxBarSize={20} />
          <Bar dataKey="line2" name="line2" stackId="a" fill={LINE_COLORS["2-LINE"]} maxBarSize={20} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
