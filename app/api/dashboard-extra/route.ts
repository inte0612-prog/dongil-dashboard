import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let mainQuery = supabase
    .from("production_records")
    .select("registered_at, pyung, client")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .limit(1_000_000);
  if (line !== "all") mainQuery = mainQuery.eq("line", line);

  const prevStart = new Date(start);
  prevStart.setFullYear(prevStart.getFullYear() - 1);
  const prevEnd = new Date(end);
  prevEnd.setFullYear(prevEnd.getFullYear() - 1);

  let prevQuery = supabase
    .from("production_records")
    .select("registered_at, pyung")
    .gte("registered_at", toStartOfDay(prevStart.toISOString().slice(0, 10)))
    .lte("registered_at", toEndOfDay(prevEnd.toISOString().slice(0, 10)))
    .limit(1_000_000);
  if (line !== "all") prevQuery = prevQuery.eq("line", line);

  const startYear = new Date(start).getFullYear();
  const endYear = new Date(end).getFullYear();
  const goalsQuery = supabase
    .from("production_goals")
    .select("year, month, target_quantity, target_area")
    .gte("year", startYear)
    .lte("year", endYear);

  const [{ data, error }, { data: prevData }, { data: goalsData }] =
    await Promise.all([mainQuery, prevQuery, goalsQuery]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows     = data ?? [];
  const prevRows = prevData ?? [];
  const goals    = goalsData ?? [];

  // ── 월별 집계 (year-month 키) ──
  const monthlyMap = new Map<string, { count: number; pyung: number }>();
  for (const r of rows) {
    const ym = r.registered_at.slice(0, 7);
    const e = monthlyMap.get(ym) ?? { count: 0, pyung: 0 };
    e.count += 1;
    e.pyung += (r.pyung as number) ?? 0;
    monthlyMap.set(ym, e);
  }
  const sortedYms = Array.from(monthlyMap.keys()).sort();

  // ── 목표 달성률 ──
  const goalsProgress = sortedYms.map((ym) => {
    const [y, m] = ym.split("-");
    const goal   = goals.find((g) => g.year === Number(y) && g.month === Number(m));
    const actual = monthlyMap.get(ym)!;
    return {
      yearMonth:  ym,
      label:      `${y}년 ${Number(m)}월`,
      actual:     actual.count,
      actualPyung: actual.pyung,
      goalCount:  goal?.target_quantity ?? null,
      goalPyung:  goal?.target_area     ?? null,
      rateCount:  goal?.target_quantity ? Math.round((actual.count / goal.target_quantity) * 100) : null,
    };
  });

  // ── 전년 대비 (월 번호 기준) ──
  const yoyMap = new Map<string, { current: number; prev: number }>();
  for (const r of rows) {
    const m = r.registered_at.slice(5, 7);
    const e = yoyMap.get(m) ?? { current: 0, prev: 0 };
    e.current += 1;
    yoyMap.set(m, e);
  }
  for (const r of prevRows) {
    const m = r.registered_at.slice(5, 7);
    const e = yoyMap.get(m) ?? { current: 0, prev: 0 };
    e.prev += 1;
    yoyMap.set(m, e);
  }
  const yoy = Array.from(yoyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => ({ month: `${Number(m)}월`, ...v }));

  // ── 전월 대비 성장률 ──
  const growthRate = sortedYms.map((ym, i) => {
    const cur  = monthlyMap.get(ym)!.count;
    const prev = i > 0 ? monthlyMap.get(sortedYms[i - 1])!.count : null;
    const growth = prev && prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;
    return { yearMonth: ym, label: `${Number(ym.slice(5, 7))}월`, count: cur, growth };
  });

  // ── 거래처 ABC 분석 ──
  const clientMap = new Map<string, number>();
  for (const r of rows) {
    const c = (r.client as string) || "(미입력)";
    clientMap.set(c, (clientMap.get(c) ?? 0) + 1);
  }
  const sorted = Array.from(clientMap.entries()).sort((a, b) => b[1] - a[1]);
  const grand  = sorted.reduce((s, [, v]) => s + v, 0);
  let cum = 0;
  const clientAbc = sorted.slice(0, 30).map(([name, total]) => {
    const share = grand > 0 ? total / grand : 0;
    cum += share;
    const grade: "A" | "B" | "C" = cum <= 0.7 ? "A" : cum <= 0.9 ? "B" : "C";
    return { name, total, share, cumShare: Math.min(cum, 1), grade };
  });

  return NextResponse.json({ goalsProgress, yoy, growthRate, clientAbc });
}
