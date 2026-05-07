"use client";

import {
  ScatterChart as ReScatterChart,
  Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { DimensionScatterPoint } from "@/types";

interface ScatterChartProps {
  data: DimensionScatterPoint[];
}

export default function ScatterChart({ data }: ScatterChartProps) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">데이터 없음</p>;
  }

  return (
    <div style={{ width: "100%" }}>
      <ResponsiveContainer width="100%" height={340}>
        <ReScatterChart margin={{ top: 4, right: 16, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="width"
            name="너비(mm)"
            tick={{ fontSize: 11 }}
            label={{ value: "너비 (mm)", position: "insideBottom", offset: -12, fontSize: 11 }}
            height={48}
          />
          <YAxis
            type="number"
            dataKey="height"
            name="높이(mm)"
            tick={{ fontSize: 11 }}
            label={{ value: "높이 (mm)", angle: -90, position: "insideLeft", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as DimensionScatterPoint;
              return (
                <div className="rounded border bg-background p-2 text-xs shadow">
                  <p>너비: {d.width}mm</p>
                  <p>높이: {d.height}mm</p>
                  <p>평수: {d.pyung.toFixed(2)}평</p>
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            shape={(props) => {
              const { cx, cy } = props as { cx?: number; cy?: number };
              if (cx == null || cy == null) return <g />;
              return (
                <circle
                  cx={cx} cy={cy} r={3}
                  fill="#3b82f6" fillOpacity={0.4}
                  stroke="none"
                />
              );
            }}
          />
        </ReScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
