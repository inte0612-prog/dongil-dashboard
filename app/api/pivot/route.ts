import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type PivotBucketRow = {
  period: string;
  dim: string;
  value: number;
};

type KpiRow = {
  total_count: number;
  total_pyung: number;
  avg_daily_pyung: number;
};

type YoyRow = {
  month: number;
  current_count: number;
  prev_count: number;
};

const RPC_PAGE_SIZE = 1000;

async function fetchAllPivotRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  start: string,
  end: string,
  line: string,
  unit: "day" | "month",
  dimension: "client" | "item_code" | "line" | "registrar",
  metric: "count" | "pyung"
) {
  const allRows: PivotBucketRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .rpc("rpc_pivot_bucketed", {
        p_start: start,
        p_end: end,
        p_line: line,
        p_unit: unit,
        p_dimension: dimension,
        p_metric: metric,
      })
      .range(from, from + RPC_PAGE_SIZE - 1);

    if (error) return { data: null, error };

    const chunk = (data ?? []) as PivotBucketRow[];
    allRows.push(...chunk);

    if (chunk.length < RPC_PAGE_SIZE) break;
    from += RPC_PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const unit = (searchParams.get("unit") ?? "month") as "day" | "month";
  const dimension = (searchParams.get("dimension") ?? "client") as
    | "client"
    | "item_code"
    | "line"
    | "registrar";
  const metric = (searchParams.get("metric") ?? "count") as "count" | "pyung";
  const topN = Number(searchParams.get("topN") ?? 10);

  if (!start || !end) {
    return NextResponse.json({ error: "start, end parameters are required" }, { status: 400 });
  }

  const supabase = await createClient();

  const [{ data: pivotData, error: pivotError }, { data: kpiData, error: kpiError }, { data: yoyData, error: yoyError }] =
    await Promise.all([
      fetchAllPivotRows(supabase, start, end, line, unit, dimension, metric),
      supabase.rpc("rpc_dashboard_kpi", {
        p_start: start,
        p_end: end,
        p_line: line,
      }),
      supabase.rpc("rpc_dashboard_yoy", {
        p_start: start,
        p_end: end,
        p_line: line,
      }),
    ]);

  const anyError = pivotError ?? kpiError ?? yoyError;
  if (anyError) {
    return NextResponse.json({ error: anyError.message }, { status: 500 });
  }

  const rows = (pivotData ?? []) as PivotBucketRow[];

  const periodSet = new Set<string>();
  const dimTotals = new Map<string, number>();
  const pivotMap = new Map<string, Map<string, number>>();

  for (const r of rows) {
    const period = r.period;
    const dim = r.dim || "(미입력)";
    const val = Number(r.value ?? 0);

    periodSet.add(period);
    dimTotals.set(dim, (dimTotals.get(dim) ?? 0) + val);

    if (!pivotMap.has(dim)) pivotMap.set(dim, new Map());
    const p = pivotMap.get(dim)!;
    p.set(period, (p.get(period) ?? 0) + val);
  }

  const periods = Array.from(periodSet).sort();
  const sortedDims = Array.from(dimTotals.entries()).sort((a, b) => b[1] - a[1]);
  const topDims = sortedDims.slice(0, Math.max(1, topN)).map(([name]) => name);

  const pivotRows = topDims.map((name) => ({
    name,
    values: periods.map((p) => pivotMap.get(name)?.get(p) ?? 0),
    total: dimTotals.get(name) ?? 0,
  }));

  const kpiRow = ((kpiData ?? [])[0] ?? {}) as KpiRow;

  const kpi = {
    totalCount: Number(kpiRow.total_count ?? 0),
    totalPyung: Number(kpiRow.total_pyung ?? 0),
    dimensionCount: dimTotals.size,
    periodCount: periods.length,
  };

  const yoy = ((yoyData ?? []) as YoyRow[])
    .sort((a, b) => Number(a.month) - Number(b.month))
    .map((r) => ({
      month: `${Number(r.month)}월`,
      current: Number(r.current_count ?? 0),
      prev: Number(r.prev_count ?? 0),
    }));

  return NextResponse.json({
    periods,
    rows: pivotRows,
    kpi,
    yoy,
    allDims: sortedDims.map(([name, total]) => ({ name, total })),
  });
}

