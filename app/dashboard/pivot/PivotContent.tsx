"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useFilter } from "@/hooks/useFilter";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ClientSidebar }  from "@/components/pivot/ClientSidebar";
import { AnomalyCards }   from "@/components/pivot/AnomalyCards";
import { SmallMultiples } from "@/components/pivot/SmallMultiples";
import {
  SERIES_COLORS,
  SERIES_OTHERS,
  SERIES_GHOST,
  TOPN_OPTS,
  SORT_OPTS,
  TREND_TABS,
} from "@/components/pivot/pivotConstants";

// ─── 타입 ─────────────────────────────────────────────────────────────────────
type PivotRow  = { name: string; values: number[]; total: number };
type YoyPoint  = { month: string; current: number; prev: number };
type KpiBlock  = { totalCount: number; totalPyung: number; dimensionCount: number; periodCount: number };
type AbcItem   = { name: string; total: number; share: number; cumShare: number; grade: "A" | "B" | "C" };
type SortMode  = "total" | "recent" | "growth";
type PivotResp = {
  periods: string[];
  rows:    PivotRow[];
  kpi:     KpiBlock;
  yoy:     YoyPoint[];
  allDims: { name: string; total: number }[];
};

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const UNIT_OPTS   = [{ label: "월별", value: "month" }, { label: "일별", value: "day" }] as const;
const DIM_OPTS    = [
  { label: "거래처",   value: "client"    },
  { label: "품목명", value: "item_code" },
  { label: "라인",     value: "line"      },
  { label: "등록자",   value: "registrar" },
] as const;
const METRIC_OPTS = [{ label: "수량 (건)", value: "count" }, { label: "평수", value: "pyung" }] as const;
const TABS        = ["피벗 테이블", "차트 분석", "집중도 분석", "추세 분석", "전년 대비"] as const;

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────
function fmt(n: number, metric: string) {
  return metric === "pyung" ? n.toFixed(1) : n.toLocaleString();
}

function computeGrowth(values: number[]): number {
  const n     = values.length;
  if (n < 2) return 0;
  const slice = Math.min(3, Math.floor(n / 2));
  const recent = values.slice(-slice).reduce((a, b) => a + b, 0) / slice;
  const prior  = values.slice(-slice * 2, -slice).reduce((a, b) => a + b, 0) / slice;
  return prior > 0 ? (recent - prior) / prior : 0;
}

function applySortMode(rows: PivotRow[], mode: SortMode): PivotRow[] {
  if (mode === "total")  return rows; // API가 이미 total 순으로 정렬
  if (mode === "recent") {
    return [...rows].sort((a, b) => {
      const aR = a.values.slice(-3).reduce((s, v) => s + v, 0);
      const bR = b.values.slice(-3).reduce((s, v) => s + v, 0);
      return bR - aR;
    });
  }
  // growth
  return [...rows].sort((a, b) => computeGrowth(b.values) - computeGrowth(a.values));
}

function computeAbc(allDims: { name: string; total: number }[]): AbcItem[] {
  const sorted = [...allDims].sort((a, b) => b.total - a.total);
  const grand  = sorted.reduce((s, d) => s + d.total, 0);
  let   cum    = 0;
  return sorted.map(d => {
    const share = grand > 0 ? d.total / grand : 0;
    cum        += share;
    const grade: "A" | "B" | "C" = cum <= 0.7 ? "A" : cum <= 0.9 ? "B" : "C";
    return { name: d.name, total: d.total, share, cumShare: Math.min(cum, 1), grade };
  });
}

// ─── Focus Mode 전용 툴팁 ─────────────────────────────────────────────────────
function FocusTooltip({
  active, payload, label, metric, highlight,
}: {
  active?:   boolean;
  payload?:  { dataKey: string; value: number; stroke: string }[];
  label?:    string;
  metric:    string;
  highlight: string[];
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter(p => highlight.includes(p.dataKey));
  if (items.length === 0) return null;
  const unit = metric === "pyung" ? "평" : "건";
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      {items.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: p.stroke }} />
          <span className="max-w-[180px] flex-1 truncate">{p.dataKey}</span>
          <span className="font-semibold tabular-nums">{fmt(p.value ?? 0, metric)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function PivotContent() {
  const { start, end, line } = useFilter();

  // 필터 상태 (기존 구조 유지)
  const [unit,      setUnit]      = useState<"day" | "month">("month");
  const [dimension, setDimension] = useState<"client" | "item_code" | "line" | "registrar">("client");
  const [metric,    setMetric]    = useState<"count" | "pyung">("count");
  const [tab,       setTab]       = useState(0);

  // 새로운 UI 상태
  const [displayTopN,       setDisplayTopN]       = useState(10);
  const [sortMode,          setSortMode]           = useState<SortMode>("total");
  const [selectedClients,   setSelectedClients]   = useState<string[]>([]);
  const [trendSubTab,       setTrendSubTab]        = useState(0);

  // 데이터 상태 (기존 구조 유지)
  const [data,    setData]    = useState<PivotResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── 데이터 fetch: 항상 전체를 받아 클라이언트 측에서 그룹핑 ──────────────
  const fetchData = useCallback(async () => {
    if (!start || !end) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const qs  = new URLSearchParams({ start, end, line, unit, dimension, metric, topN: "50" });
      const res = await fetch(`/api/pivot?${qs}`);
      if (res.ok) {
        setData(await res.json());
        setSelectedClients([]);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `서버 오류 (${res.status})`);
      }
    } catch {
      setError("네트워크 오류 — 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, [start, end, line, unit, dimension, metric]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Esc → 선택 해제, / → 사이드바 검색 포커스
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedClients([]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── 클라이언트 측 데이터 변환 ─────────────────────────────────────────────
  const sortedRows  = useMemo(() => applySortMode(data?.rows ?? [], sortMode), [data, sortMode]);
  const topRows     = useMemo(() => sortedRows.slice(0, displayTopN), [sortedRows, displayTopN]);
  const othersRows  = useMemo(() => sortedRows.slice(displayTopN),    [sortedRows, displayTopN]);

  // 누적 바 차트용 데이터 (Top N + 기타)
  const barChartData = useMemo(() => {
    if (!data) return [];
    return data.periods.map((p, pi) => {
      const pt: Record<string, unknown> = { period: p };
      topRows.forEach(r => { pt[r.name] = r.values[pi] ?? 0; });
      if (othersRows.length > 0) {
        pt["기타"] = othersRows.reduce((s, r) => s + (r.values[pi] ?? 0), 0);
      }
      return pt;
    });
  }, [data, topRows, othersRows]);

  // 라인 차트용 데이터 (전체 행)
  const lineChartData = useMemo(() => {
    if (!data) return [];
    return data.periods.map((p, pi) => {
      const pt: Record<string, unknown> = { period: p };
      sortedRows.forEach(r => { pt[r.name] = r.values[pi] ?? 0; });
      return pt;
    });
  }, [data, sortedRows]);

  // Focus Mode 강조 대상: 선택 있으면 선택, 없으면 상위 5개 기본 강조
  const focusHighlight = useMemo(
    () => (selectedClients.length > 0 ? selectedClients : topRows.slice(0, 5).map(r => r.name)),
    [selectedClients, topRows],
  );

  const ghostRows = useMemo(
    () => sortedRows.filter(r => !focusHighlight.includes(r.name)),
    [sortedRows, focusHighlight],
  );

  const abcData     = useMemo(() => computeAbc(data?.allDims ?? []), [data]);
  const metricUnit  = metric === "count" ? "건" : "평";
  const dimLabel    = DIM_OPTS.find(d => d.value === dimension)?.label ?? "";
  const showSidebar = tab === 1 || tab === 3;

  // ── 거래처 선택 핸들러 ───────────────────────────────────────────────────
  const handleToggleClient = (name: string) => {
    setSelectedClients(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= 5)   return prev;
      return [...prev, name];
    });
  };

  const handleAnomalySelect = (name: string) => {
    setTab(3);
    setTrendSubTab(0);
    handleToggleClient(name);
  };

  // ── 렌더링 ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-semibold">다차원 분석</h1>
        <p className="text-sm text-muted-foreground">
          분석 기준과 지표를 선택해 생산 데이터를 다각도로 분석합니다.
        </p>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-4">
        {/* 집계 단위 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">집계 단위</span>
          <div className="flex overflow-hidden rounded-md border text-xs">
            {UNIT_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => setUnit(o.value)}
                className={`px-3 py-1.5 transition-colors ${
                  unit === o.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 분석 기준 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">분석 기준</span>
          <select
            value={dimension}
            onChange={e => setDimension(e.target.value as typeof dimension)}
            className="rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {DIM_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* 측정 지표 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">측정 지표</span>
          <div className="flex overflow-hidden rounded-md border text-xs">
            {METRIC_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => setMetric(o.value)}
                className={`px-3 py-1.5 transition-colors ${
                  metric === o.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 강조 항목 수 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">강조 항목</span>
          <div className="flex overflow-hidden rounded-md border text-xs">
            {TOPN_OPTS.map(n => (
              <button
                key={n}
                onClick={() => setDisplayTopN(n)}
                className={`px-3 py-1.5 transition-colors ${
                  displayTopN === n ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {n}개
              </button>
            ))}
          </div>
        </div>

        {/* 정렬 기준 (차트 탭에서만 표시) */}
        {showSidebar && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">정렬</span>
            <div className="flex overflow-hidden rounded-md border text-xs">
              {SORT_OPTS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setSortMode(o.value as SortMode)}
                  className={`px-3 py-1.5 transition-colors ${
                    sortMode === o.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 오류 */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "총 생산 수량",  value: data?.kpi.totalCount.toLocaleString() ?? "—", unit: "건" },
          { label: "총 생산 면적",  value: data ? data.kpi.totalPyung.toFixed(1) : "—", unit: "평" },
          { label: `${dimLabel} 수`, value: data?.kpi.dimensionCount.toLocaleString() ?? "—", unit: "개" },
          {
            label: "분석 기간",
            value: data?.kpi.periodCount.toLocaleString() ?? "—",
            unit:  unit === "month" ? "개월" : "일",
          },
        ].map(k => (
          <div key={k.label} className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {loading
                ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted" />
                : k.value}
            </p>
            <p className="text-xs text-muted-foreground">{k.unit}</p>
          </div>
        ))}
      </div>

      {/* 급증/급감 카드 */}
      {!loading && data && data.rows.length >= 2 && (
        <AnomalyCards
          rows={data.rows}
          periods={data.periods}
          metric={metric}
          onSelect={handleAnomalySelect}
          selected={selectedClients}
        />
      )}

      {/* 탭 + 콘텐츠 */}
      <div>
        <div className="flex border-b">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === i
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 로딩 */}
        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-b-lg border-x border-b">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">데이터 분석 중…</p>
            </div>
          </div>
        ) : (
          /* 2-컬럼 레이아웃 (차트/추세 탭) vs 전체 너비 */
          <div className={showSidebar ? "flex" : ""}>
            {/* ── 메인 콘텐츠 영역 ── */}
            <div className={showSidebar ? "min-w-0 flex-1" : "w-full"}>

              {/* Tab 0: 피벗 테이블 */}
              {tab === 0 && (
                <div className="overflow-x-auto rounded-b-lg border-x border-b bg-background">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="sticky left-0 z-10 min-w-[180px] bg-muted/50 px-4 py-3 text-left font-medium">
                          항목
                        </th>
                        {data?.periods.map(p => (
                          <th key={p} className="whitespace-nowrap px-3 py-3 text-right font-medium">
                            {p}
                          </th>
                        ))}
                        <th className="bg-muted px-4 py-3 text-right font-medium">합계</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sortedRows.slice(0, 50).map(row => (
                        <tr key={row.name} className="hover:bg-muted/30">
                          <td className="sticky left-0 z-10 max-w-[180px] truncate bg-background px-4 py-2.5 font-medium">
                            {row.name}
                          </td>
                          {row.values.map((v, i) => (
                            <td key={i} className="px-3 py-2.5 text-right tabular-nums">
                              {v > 0
                                ? fmt(v, metric)
                                : <span className="text-muted-foreground/40">—</span>}
                            </td>
                          ))}
                          <td className="bg-muted/30 px-4 py-2.5 text-right font-semibold tabular-nums">
                            {fmt(row.total, metric)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sortedRows.length > 50 && (
                    <div className="border-t p-3 text-center text-xs text-muted-foreground">
                      상위 50개 표시 중 (전체 {sortedRows.length}개)
                    </div>
                  )}
                </div>
              )}

              {/* Tab 1: 차트 분석 — Top N + Others 누적 바 */}
              {tab === 1 && (
                <div className="rounded-b-lg border-x border-b bg-background p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      기간별 {dimLabel} 누적 {metricUnit}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {othersRows.length > 0 && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                          + 기타 {othersRows.length}개 포함
                        </span>
                      )}
                      {/* 컬러 범례 (상위 N개) */}
                      <div className="flex flex-wrap gap-1.5">
                        {topRows.slice(0, 10).map((r, i) => (
                          <span key={r.name} className="flex items-center gap-1 text-[10px]">
                            <span
                              className="inline-block h-2 w-2 rounded-sm"
                              style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                            />
                            <span className="max-w-[80px] truncate text-muted-foreground">{r.name}</span>
                          </span>
                        ))}
                        {othersRows.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px]">
                            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SERIES_OTHERS }} />
                            <span className="text-muted-foreground">기타</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={barChartData} margin={{ top: 8, right: 16, left: 8, bottom: 48 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                      <XAxis
                        dataKey="period"
                        angle={-40}
                        textAnchor="end"
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v, name) => [
                          `${fmt(Number(v ?? 0), metric)}${metricUnit}`,
                          name,
                        ]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      />
                      {topRows.map((row, i) => (
                        <Bar
                          key={row.name}
                          dataKey={row.name}
                          stackId="s"
                          fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                          maxBarSize={48}
                          isAnimationActive={false}
                        />
                      ))}
                      {othersRows.length > 0 && (
                        <Bar
                          dataKey="기타"
                          stackId="s"
                          fill={SERIES_OTHERS}
                          maxBarSize={48}
                          isAnimationActive={false}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tab 2: 집중도 분석 (ABC) */}
              {tab === 2 && (
                <div className="space-y-4 rounded-b-lg border-x border-b bg-background p-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(["A", "B", "C"] as const).map(g => {
                      const cnt = abcData.filter(d => d.grade === g).length;
                      const cls = g === "A"
                        ? "bg-blue-50 text-blue-700"
                        : g === "B"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600";
                      const lbl = g === "A" ? "누적 70% 이내" : g === "B" ? "70~90%" : "90% 초과";
                      return (
                        <span key={g} className={`rounded-full px-3 py-1 font-medium ${cls}`}>
                          {g}등급 {cnt}개 ({lbl})
                        </span>
                      );
                    })}
                  </div>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          {["순위", "항목", `합계(${metricUnit})`, "점유율", "누적 점유율", "등급"].map(h => (
                            <th key={h} className="px-4 py-3 text-right font-medium first:text-left last:text-center">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {abcData.map((d, i) => {
                          const badge = d.grade === "A"
                            ? "bg-blue-100 text-blue-700"
                            : d.grade === "B"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600";
                          return (
                            <tr key={d.name} className="hover:bg-muted/30">
                              <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                              <td className="max-w-[240px] truncate px-4 py-2.5 font-medium">{d.name}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.total, metric)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">{(d.share * 100).toFixed(1)}%</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">{(d.cumShare * 100).toFixed(1)}%</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                                  {d.grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: 추세 분석 — 3가지 서브 뷰 */}
              {tab === 3 && (
                <div className="rounded-b-lg border-x border-b bg-background">
                  {/* 서브 탭 바 */}
                  <div className="flex items-center border-b bg-muted/20 px-4 pt-0">
                    <div className="flex">
                      {TREND_TABS.map((t, i) => (
                        <button
                          key={t}
                          onClick={() => setTrendSubTab(i)}
                          className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                            trendSubTab === i
                              ? "border-primary text-primary"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {/* 선택된 거래처 칩 */}
                    {selectedClients.length > 0 && (
                      <div className="ml-auto flex flex-wrap items-center gap-1.5 py-2">
                        {selectedClients.map((c, i) => (
                          <button
                            key={c}
                            onClick={() => handleToggleClient(c)}
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                            style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                          >
                            <span className="max-w-[72px] truncate">{c}</span>
                            <span className="text-white/80">×</span>
                          </button>
                        ))}
                        <button
                          onClick={() => setSelectedClients([])}
                          className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                        >
                          Esc
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {/* Sub 0: Focus Mode */}
                    {trendSubTab === 0 && (
                      <div>
                        <p className="mb-4 text-xs text-muted-foreground">
                          {selectedClients.length === 0
                            ? "사이드바에서 거래처를 선택하면 강조됩니다 (최대 5개). 기본으로 상위 5개 강조 표시."
                            : `${selectedClients.length}개 선택됨 — Esc 또는 칩을 클릭해 해제`}
                        </p>
                        <ResponsiveContainer width="100%" height={420}>
                          <LineChart
                            data={lineChartData}
                            margin={{ top: 8, right: 16, left: 8, bottom: 48 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" vertical={false} />
                            <XAxis
                              dataKey="period"
                              angle={-40}
                              textAnchor="end"
                              tick={{ fontSize: 11, fill: "#6B7280" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: "#6B7280" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              content={(props: any) => (
                                <FocusTooltip
                                  {...props}
                                  metric={metric}
                                  highlight={focusHighlight}
                                />
                              )}
                            />
                            {/* Ghost 라인: 비선택 항목 (연한 회색, 애니메이션 없음) */}
                            {ghostRows.map(row => (
                              <Line
                                key={`g-${row.name}`}
                                type="monotone"
                                dataKey={row.name}
                                stroke={SERIES_GHOST}
                                strokeWidth={1}
                                strokeOpacity={0.3}
                                dot={false}
                                activeDot={false}
                                isAnimationActive={false}
                                legendType="none"
                              />
                            ))}
                            {/* 강조 라인 */}
                            {focusHighlight.map((name, i) => (
                              <Line
                                key={`f-${name}`}
                                type="monotone"
                                dataKey={name}
                                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                isAnimationActive={false}
                                legendType="none"
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Sub 1: Sparkline Grid */}
                    {trendSubTab === 1 && (
                      <SmallMultiples
                        rows={sortedRows}
                        periods={data?.periods ?? []}
                        metric={metric}
                        onSelect={handleToggleClient}
                        selected={selectedClients}
                      />
                    )}

                  </div>
                </div>
              )}

              {/* Tab 4: 전년 대비 */}
              {tab === 4 && (
                <div className="rounded-b-lg border-x border-b bg-background p-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    선택 기간의 월별 올해 vs 전년 비교
                  </p>
                  {(data?.yoy?.length ?? 0) === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                      전년 비교 데이터가 없습니다.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={data?.yoy ?? []}
                        margin={{ top: 8, right: 16, left: 8, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "#6B7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#6B7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(v) => [`${fmt(Number(v ?? 0), metric)}${metricUnit}`, ""]}
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <Bar
                          dataKey="current"
                          name="올해"
                          fill={SERIES_COLORS[1]}
                          radius={[3, 3, 0, 0]}
                          maxBarSize={40}
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="prev"
                          name="전년"
                          fill="#D4D4D4"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={40}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>

            {/* ── 거래처 사이드바 (차트/추세 탭) ── */}
            {showSidebar && (
              <div
                className="w-64 flex-shrink-0 border-l"
                style={{ maxHeight: "80vh", position: "sticky", top: 0, overflowY: "hidden" }}
              >
                <ClientSidebar
                  items={sortedRows.map(r => ({ name: r.name, total: r.total }))}
                  selected={selectedClients}
                  onToggle={handleToggleClient}
                  onClear={() => setSelectedClients([])}
                  metric={metric}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
