"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

type Item = { name: string; count: number; share: number; cumShare: number; grade: "A" | "B" | "C" };
type ConcentrationData = {
  items: Item[];
  hhi: number;
  summary: { top1: number; top5: number; top10: number; total: number };
};

interface Props { start: string; end: string; line: string }

const GRADE_COLOR = { A: "#ef4444", B: "#f97316", C: "#22c55e" } as const;
const GRADE_BG    = { A: "bg-red-50 text-red-700", B: "bg-orange-50 text-orange-700", C: "bg-green-50 text-green-700" } as const;

function HhiBadge({ hhi }: { hhi: number }) {
  const { label, cls } =
    hhi >= 2500 ? { label: `HHI ${hhi.toLocaleString()} 고집중`, cls: "bg-red-100 text-red-700" }
  : hhi >= 1500 ? { label: `HHI ${hhi.toLocaleString()} 중간`,  cls: "bg-yellow-100 text-yellow-700" }
  :               { label: `HHI ${hhi.toLocaleString()} 양호`,  cls: "bg-green-100 text-green-700" };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

export default function DashboardConcentration({ start, end, line }: Props) {
  const [data, setData] = useState<ConcentrationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/concentration?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(d && d.items ? d : null))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  if (loading) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold">거래처 집중도 분석 (파레토 + ABC)</p>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </section>
    );
  }

  if (!data || !data.items.length) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold">거래처 집중도 분석 (파레토 + ABC)</p>
        <p className="py-16 text-center text-sm text-muted-foreground">데이터 없음</p>
      </section>
    );
  }

  const chartData = data.items.slice(0, 30).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
    share: d.share,
    cumShare: d.cumShare,
    grade: d.grade,
  }));

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">거래처 집중도 분석 (파레토 + ABC)</p>
        <HhiBadge hhi={data.hhi} />
      </div>

      {/* 파레토 차트 */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 40, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" height={55} />
          <YAxis yAxisId="left"  tick={{ fontSize: 11 }} unit="%" width={40} domain={[0, "auto"]} />
          <YAxis yAxisId="right" tick={{ fontSize: 11 }} unit="%" width={45} orientation="right" domain={[0, 100]} />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              const d = payload[0]?.payload as typeof chartData[0];
              return (
                <div className="rounded border bg-background p-2 text-xs shadow">
                  <p className="mb-1 font-medium">{label}</p>
                  <p>점유율: {d.share.toFixed(1)}%</p>
                  <p>누적: {d.cumShare.toFixed(1)}%</p>
                  <p>등급: {d.grade}</p>
                </div>
              );
            }}
          />
          <Bar yAxisId="left" dataKey="share" name="점유율(%)" maxBarSize={20} radius={[3, 3, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={GRADE_COLOR[d.grade as keyof typeof GRADE_COLOR]} />
            ))}
          </Bar>
          <Line yAxisId="right" type="monotone" dataKey="cumShare" name="누적(%)" stroke="#6366f1" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 등급 요약 */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(["A", "B", "C"] as const).map((g) => {
          const cnt = data.items.filter((d) => d.grade === g).length;
          const desc = g === "A" ? "누적 70% 이내" : g === "B" ? "70~90%" : "90% 초과";
          return (
            <span key={g} className={`rounded-full px-3 py-1 font-medium ${GRADE_BG[g]}`}>
              {g}등급 {cnt}개 ({desc})
            </span>
          );
        })}
      </div>

      {/* Top 요약 카드 */}
      <div className="mt-3 grid grid-cols-4 gap-3">
        {[
          { label: "Top 1 점유율",  value: data.summary.top1.toFixed(1) + "%" },
          { label: "Top 5 점유율",  value: data.summary.top5.toFixed(1) + "%" },
          { label: "Top 10 점유율", value: data.summary.top10.toFixed(1) + "%" },
          { label: "전체 거래처 수", value: data.summary.total.toLocaleString() + "개" },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {/* 등급 설명 */}
      <p className="mt-3 text-[11px] text-muted-foreground">
        A등급(빨강): 매출 상위 70% 핵심 거래처 — 집중 관리 대상 &nbsp;|&nbsp;
        B등급(주황): 70~90% 중요 거래처 — 성장 가능성 모니터링 &nbsp;|&nbsp;
        C등급(초록): 90% 초과 소량 거래처 — 다변화 잠재 고객
      </p>
    </section>
  );
}
