import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";

type Row = {
  client: string;
  item_code: string;
  item_name: string;
  line: string;
  registrar: string;
  registered_at: string;
  quantity: number;
  pyung: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const unit = (searchParams.get("unit") ?? "month") as "day" | "month";
  const dimension = (searchParams.get("dimension") ?? "client") as
    | "client" | "item_code" | "line" | "registrar";
  const metric = (searchParams.get("metric") ?? "count") as "count" | "pyung";
  const topN = Number(searchParams.get("topN") ?? 10);

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("client, item_code, item_name, line, registrar, registered_at, quantity, pyung", { count: "exact" })
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .limit(1_000_000);
  if (line !== "all") query = query.eq("line", line);

  // 전년 동기 쿼리
  const prevStart = new Date(start);
  prevStart.setFullYear(prevStart.getFullYear() - 1);
  const prevEnd = new Date(end);
  prevEnd.setFullYear(prevEnd.getFullYear() - 1);

  let prevQuery = supabase
    .from("production_records")
    .select("registered_at, quantity, pyung")
    .gte("registered_at", toStartOfDay(prevStart.toISOString().slice(0, 10)))
    .lte("registered_at", toEndOfDay(prevEnd.toISOString().slice(0, 10)))
    .limit(1_000_000);
  if (line !== "all") prevQuery = prevQuery.eq("line", line);

  const [{ data, count: exactCount, error }, { data: prevData }] = await Promise.all([query, prevQuery]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Row[];
  const prevRows = prevData ?? [];

  const getDim = (r: Row): string => {
    if (dimension === "client") return r.client || "(미입력)";
    if (dimension === "item_code") return r.item_code ? `${r.item_code} ${r.item_name}` : "(미입력)";
    if (dimension === "line") return r.line || "(미입력)";
    return r.registrar || "(미입력)";
  };

  const getPeriod = (at: string) => (unit === "day" ? at.slice(0, 10) : at.slice(0, 7));
  const getVal = (r: { quantity?: number; pyung?: number }) =>
    metric === "count" ? 1 : Number(r.pyung) || 0;

  // 피벗 집계
  const pivotMap = new Map<string, Map<string, number>>();
  const periodSet = new Set<string>();
  const dimTotals = new Map<string, number>();

  for (const r of rows) {
    const dim = getDim(r);
    const period = getPeriod(r.registered_at);
    const val = getVal(r);
    periodSet.add(period);
    if (!pivotMap.has(dim)) pivotMap.set(dim, new Map());
    const pm = pivotMap.get(dim)!;
    pm.set(period, (pm.get(period) ?? 0) + val);
    dimTotals.set(dim, (dimTotals.get(dim) ?? 0) + val);
  }

  const periods = Array.from(periodSet).sort();
  const sortedDims = Array.from(dimTotals.entries()).sort((a, b) => b[1] - a[1]);
  const topDims = sortedDims.slice(0, topN).map(([name]) => name);

  const pivotRows = topDims.map((name) => ({
    name,
    values: periods.map((p) => pivotMap.get(name)?.get(p) ?? 0),
    total: dimTotals.get(name) ?? 0,
  }));

  // KPI
  const totalCount = exactCount ?? rows.length;
  const totalPyung = rows.reduce((s, r) => s + (Number(r.pyung) || 0), 0);
  const kpi = {
    totalCount,
    totalPyung,
    dimensionCount: pivotMap.size,
    periodCount: periods.length,
  };

  // 전년 대비
  const yoyMap = new Map<string, { current: number; prev: number }>();
  for (const r of rows) {
    const m = r.registered_at.slice(5, 7);
    const e = yoyMap.get(m) ?? { current: 0, prev: 0 };
    e.current += getVal(r);
    yoyMap.set(m, e);
  }
  for (const r of prevRows) {
    const m = r.registered_at.slice(5, 7);
    const e = yoyMap.get(m) ?? { current: 0, prev: 0 };
    e.prev += getVal(r);
    yoyMap.set(m, e);
  }
  const yoy = Array.from(yoyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => ({ month: `${Number(m)}월`, ...v }));

  return NextResponse.json({
    periods,
    rows: pivotRows,
    kpi,
    yoy,
    allDims: sortedDims.map(([name, total]) => ({ name, total })),
  });
}
