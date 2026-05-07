"use client";

import { useState, useEffect, useCallback } from "react";
import { useFilter } from "@/hooks/useFilter";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── types ───────────────────────────────────────────────────────────────────
type PivotRow = { name: string; values: number[]; total: number };
type YoyPoint = { month: string; current: number; prev: number };
type KpiBlock = { totalCount: number; totalPyung: number; dimensionCount: number; periodCount: number };
type AbcItem = { name: string; total: number; share: number; cumShare: number; grade: "A" | "B" | "C" };
type PivotResp = {
  periods: string[];
  rows: PivotRow[];
  kpi: KpiBlock;
  yoy: YoyPoint[];
  allDims: { name: string; total: number }[];
};

// ─── constants ────────────────────────────────────────────────────────────────
const COLORS = [
  "#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6",
  "#ec4899","#06b6d4","#84cc16","#f97316","#a855f7",
  "#14b8a6","#f43f5e","#6366f1","#eab308","#10b981",
  "#64748b","#0ea5e9","#d946ef","#fb923c","#4ade80",
];

const UNIT_OPTS    = [{ label: "월별", value: "month" }, { label: "일별", value: "day" }];
const DIM_OPTS     = [
  { label: "거래처",   value: "client" },
  { label: "품목코드", value: "item_code" },
  { label: "라인",     value: "line" },
  { label: "등록자",   value: "registrar" },
];
const METRIC_OPTS  = [{ label: "수량 (건)", value: "count" }, { label: "평수", value: "pyung" }];
const TOPN_OPTS    = [5, 10, 20];
const TABS         = ["피벗 테이블", "차트 분석", "집중도 분석", "추세 분석", "전년 대비"];

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number, metric: string) {
  return metric === "pyung" ? n.toFixed(1) : n.toLocaleString();
}

function computeAbc(allDims: { name: string; total: number }[]): AbcItem[] {
  const sorted = [...allDims].sort((a, b) => b.total - a.total);
  const grand  = sorted.reduce((s, d) => s + d.total, 0);
  let cum = 0;
  return sorted.map((d) => {
    const share = grand > 0 ? d.total / grand : 0;
    cum += share;
    const grade: "A" | "B" | "C" = cum <= 0.7 ? "A" : cum <= 0.9 ? "B" : "C";
    return { name: d.name, total: d.total, share, cumShare: Math.min(cum, 1), grade };
  });
}

// ─── component ───────────────────────────────────────────────────────────────
export default function PivotPage() {
  const { start, end, line } = useFilter();
  const [unit,      setUnit]      = useState<"day" | "month">("month");
  const [dimension, setDimension] = useState<"client" | "item_code" | "line" | "registrar">("client");
  const [metric,    setMetric]    = useState<"count" | "pyung">("count");
  const [topN,      setTopN]      = useState(10);
  const [tab,       setTab]       = useState(0);
  const [data,      setData]      = useState<PivotResp | null>(null);
  const [loading,   setLoading]   = useState(false);

  const fetchData = useCallback(async () => {
    if (!start || !end) return;
    setLoading(true);
    const qs = new URLSearchParams({ start, end, line, unit, dimension, metric, topN: String(topN) });
    const res = await fetch(`/api/pivot?${qs}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [start, end, line, unit, dimension, metric, topN]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // recharts 용 데이터 변환
  const chartData = (data?.periods ?? []).map((p, pi) => {
    const pt: Record<string, unknown> = { period: p };
    data?.rows.forEach((r) => { pt[r.name] = r.values[pi]; });
    return pt;
  });

  const abcData = data ? computeAbc(data.allDims) : [];
  const metricUnit = metric === "count" ? "건" : "평";
  const dimLabel = DIM_OPTS.find((d) => d.value === dimension)?.label ?? "";

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-semibold">다차원 분석</h1>
        <p className="text-sm text-muted-foreground">분석 기준과 지표를 선택해 생산 데이터를 다각도로 분석합니다.</p>
      </div>

      {/* 로컬 필터 */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
        {/* 집계 단위 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">집계 단위</span>
          <div className="flex overflow-hidden rounded-md border text-xs">
            {UNIT_OPTS.map((o) => (
              <button key={o.value}
                onClick={() => setUnit(o.value as "day" | "month")}
                className={`px-3 py-1.5 transition-colors ${unit === o.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 분석 기준 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">분석 기준</span>
          <select value={dimension} onChange={(e) => setDimension(e.target.value as typeof dimension)}
            className="rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
            {DIM_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* 측정 지표 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">측정 지표</span>
          <div className="flex overflow-hidden rounded-md border text-xs">
            {METRIC_OPTS.map((o) => (
              <button key={o.value}
                onClick={() => setMetric(o.value as "count" | "pyung")}
                className={`px-3 py-1.5 transition-colors ${metric === o.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 상위 N */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">상위</span>
          <select value={topN} onChange={(e) => setTopN(Number(e.target.value))}
            className="rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
            {TOPN_OPTS.map((n) => <option key={n} value={n}>{n}개</option>)}
          </select>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "총 생산 수량", value: data?.kpi.totalCount.toLocaleString() ?? "—", unit: "건" },
          { label: "총 생산 면적", value: data ? data.kpi.totalPyung.toFixed(1) : "—", unit: "평" },
          { label: `${dimLabel} 수`, value: data?.kpi.dimensionCount.toLocaleString() ?? "—", unit: "개" },
          { label: "분석 기간", value: data?.kpi.periodCount.toLocaleString() ?? "—", unit: unit === "month" ? "개월" : "일" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.unit}</p>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="space-y-4">
        <div className="flex border-b">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
            데이터 불러오는 중…
          </div>
        ) : (
          <>
            {/* ── Tab 0: 피벗 테이블 ── */}
            {tab === 0 && (
              <div className="overflow-x-auto rounded-lg border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="sticky left-0 z-10 min-w-[180px] bg-muted/50 px-4 py-3 text-left font-medium">항목</th>
                      {data?.periods.map((p) => (
                        <th key={p} className="whitespace-nowrap px-3 py-3 text-right font-medium">{p}</th>
                      ))}
                      <th className="bg-muted px-4 py-3 text-right font-medium">합계</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.rows.map((row) => (
                      <tr key={row.name} className="hover:bg-muted/30">
                        <td className="sticky left-0 z-10 max-w-[180px] truncate bg-background px-4 py-2.5 font-medium">{row.name}</td>
                        {row.values.map((v, i) => (
                          <td key={i} className="px-3 py-2.5 text-right tabular-nums">
                            {v > 0 ? fmt(v, metric) : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        ))}
                        <td className="bg-muted/30 px-4 py-2.5 text-right font-semibold tabular-nums">
                          {fmt(row.total, metric)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Tab 1: 차트 분석 (누적 바) ── */}
            {tab === 1 && (
              <div className="rounded-lg border bg-background p-4">
                <p className="mb-3 text-xs text-muted-foreground">기간별 {dimLabel} 누적 {metricUnit}</p>
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" angle={-40} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [fmt(Number(v ?? 0), metric), ""]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {data?.rows.map((row, i) => (
                      <Bar key={row.name} dataKey={row.name} stackId="a" fill={COLORS[i % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Tab 2: 집중도 분석 (ABC) ── */}
            {tab === 2 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  {(["A", "B", "C"] as const).map((g) => {
                    const cnt = abcData.filter((d) => d.grade === g).length;
                    const cls = g === "A" ? "bg-blue-50 text-blue-700" : g === "B" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
                    const label = g === "A" ? "누적 70% 이내" : g === "B" ? "70~90%" : "90% 초과";
                    return (
                      <span key={g} className={`rounded-full px-3 py-1 font-medium ${cls}`}>
                        {g}등급 {cnt}개 ({label})
                      </span>
                    );
                  })}
                </div>
                <div className="overflow-x-auto rounded-lg border bg-background">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">순위</th>
                        <th className="px-4 py-3 text-left font-medium">항목</th>
                        <th className="px-4 py-3 text-right font-medium">합계 ({metricUnit})</th>
                        <th className="px-4 py-3 text-right font-medium">점유율</th>
                        <th className="px-4 py-3 text-right font-medium">누적 점유율</th>
                        <th className="px-4 py-3 text-center font-medium">등급</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {abcData.map((d, i) => {
                        const badge = d.grade === "A"
                          ? "bg-blue-100 text-blue-700"
                          : d.grade === "B" ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600";
                        return (
                          <tr key={d.name} className="hover:bg-muted/30">
                            <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                            <td className="max-w-[240px] truncate px-4 py-2.5 font-medium">{d.name}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.total, metric)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{(d.share * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{(d.cumShare * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>{d.grade}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab 3: 추세 분석 (라인 차트) ── */}
            {tab === 3 && (
              <div className="rounded-lg border bg-background p-4">
                <p className="mb-3 text-xs text-muted-foreground">기간별 {dimLabel} 추세</p>
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" angle={-40} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [fmt(Number(v ?? 0), metric), ""]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {data?.rows.map((row, i) => (
                      <Line
                        key={row.name} type="monotone" dataKey={row.name}
                        stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Tab 4: 전년 대비 ── */}
            {tab === 4 && (
              <div className="rounded-lg border bg-background p-4">
                <p className="mb-3 text-xs text-muted-foreground">선택 기간의 월별 올해 vs 전년 비교</p>
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart data={data?.yoy ?? []} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [fmt(Number(v ?? 0), metric), ""]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="current" name="올해" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="prev"    name="전년" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
