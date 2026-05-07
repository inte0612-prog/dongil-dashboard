"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

// ─── types ───────────────────────────────────────────────────────────────────
type GoalPoint = {
  yearMonth: string; label: string;
  actual: number; goalCount: number | null; rateCount: number | null;
};
type YoyPoint  = { month: string; current: number; prev: number };
type GrowthPoint = { yearMonth: string; label: string; count: number; growth: number | null };
type AbcItem   = { name: string; total: number; share: number; cumShare: number; grade: "A" | "B" | "C" };

type ExtraData = {
  goalsProgress: GoalPoint[];
  yoy:           YoyPoint[];
  growthRate:    GrowthPoint[];
  clientAbc:     AbcItem[];
};

const ABC_COLOR: Record<string, string> = {
  A: "#3b82f6",
  B: "#f59e0b",
  C: "#94a3b8",
};

// ─── lollipop bar shape ──────────────────────────────────────────────────────
function LollipopShape(props: {
  x?: number; y?: number; width?: number; height?: number; fill?: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill = "#3b82f6" } = props;
  if (width <= 0) return null;
  const cy = y + height / 2;
  return (
    <g>
      <line x1={x} y1={cy} x2={x + width} y2={cy} stroke={fill} strokeWidth={2} />
      <circle cx={x + width} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={1.5} />
    </g>
  );
}

// ─── section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function DashboardExtra({
  start, end, line,
}: {
  start: string; end: string; line: string;
}) {
  const [data, setData] = useState<ExtraData | null>(null);

  useEffect(() => {
    if (!start || !end) return;
    const qs = new URLSearchParams({ start, end, line });
    fetch(`/api/dashboard-extra?${qs}`)
      .then((r) => r.json())
      .then(setData);
  }, [start, end, line]);

  if (!data) return null;

  const { goalsProgress, yoy, growthRate, clientAbc } = data;
  const hasGoals = goalsProgress.some((g) => g.goalCount !== null);

  return (
    <div className="space-y-8">

      {/* ── 1. 목표 달성률 ── */}
      <Section title="목표 달성률">
        {!hasGoals ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background py-10 text-center">
            <p className="text-sm text-muted-foreground">설정된 목표가 없습니다.</p>
            <Link
              href="/dashboard/goals"
              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              목표 설정하러 가기
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border bg-background p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={goalsProgress} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    v.toLocaleString() + "건",
                    name === "actual" ? "실적" : "목표",
                  ]}
                />
                <Legend
                  formatter={(v) => (v === "actual" ? "실적" : "목표")}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="goalCount"  name="goalCount"  fill="#e2e8f0" radius={[3,3,0,0]} />
                <Bar dataKey="actual"     name="actual"     fill="#3b82f6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            {/* 달성률 배지 */}
            <div className="mt-3 flex flex-wrap gap-2">
              {goalsProgress.filter((g) => g.rateCount !== null).map((g) => {
                const rate = g.rateCount!;
                const cls  = rate >= 100 ? "bg-emerald-50 text-emerald-700"
                           : rate >= 80  ? "bg-amber-50 text-amber-700"
                           :               "bg-red-50 text-red-600";
                return (
                  <span key={g.yearMonth} className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
                    {g.label} {rate}%
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      {/* ── 2. 전년 동기 대비 ── */}
      <Section title="전년 동기 대비">
        <div className="rounded-lg border bg-background p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yoy} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v.toLocaleString() + "건", ""]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="current" name="올해"  fill="#3b82f6" radius={[3,3,0,0]} />
              <Bar dataKey="prev"    name="전년"  fill="#94a3b8" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 3. 성장률 추이 ── */}
      <Section title="전월 대비 성장률 추이">
        <div className="rounded-lg border bg-background p-4">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart
              data={growthRate.filter((d) => d.growth !== null)}
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: number) => [`${v}%`, "성장률"]} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="growth" name="성장률"
                stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 4. 거래처 집중도 ABC 분석 ── */}
      <Section title="거래처 집중도 ABC 분석">
        <div className="flex flex-wrap gap-2 text-xs">
          {(["A", "B", "C"] as const).map((g) => {
            const cnt = clientAbc.filter((d) => d.grade === g).length;
            const cls = g === "A" ? "bg-blue-50 text-blue-700"
                      : g === "B" ? "bg-amber-50 text-amber-700"
                      :             "bg-slate-100 text-slate-600";
            const label = g === "A" ? "누적 70% 이내" : g === "B" ? "70~90%" : "90% 초과";
            return (
              <span key={g} className={`rounded-full px-3 py-1 font-medium ${cls}`}>
                {g}등급 {cnt}개 ({label})
              </span>
            );
          })}
        </div>
        <div className="rounded-lg border bg-background p-4">
          <ResponsiveContainer width="100%" height={Math.max(clientAbc.length * 28, 200)}>
            <BarChart
              layout="vertical"
              data={clientAbc}
              margin={{ top: 5, right: 40, left: 120, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category" dataKey="name" tick={{ fontSize: 11 }}
                width={115} tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
              />
              <Tooltip formatter={(v: number) => [v.toLocaleString() + "건", "생산 건수"]} />
              <Bar dataKey="total" shape={<LollipopShape />} barSize={20}>
                {clientAbc.map((d, i) => (
                  <Cell key={i} fill={ABC_COLOR[d.grade]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

    </div>
  );
}
