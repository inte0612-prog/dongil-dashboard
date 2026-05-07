import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { KpiData } from "@/types";

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end parameters are required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: kpiData, error: kpiError } = await supabase.rpc("rpc_dashboard_kpi", {
    p_start: start,
    p_end: end,
    p_line: line,
  });

  if (kpiError) {
    return NextResponse.json({ error: kpiError.message }, { status: 500 });
  }

  const days = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1
  );

  const prevEnd = shiftDate(start, -1);
  const prevStart = shiftDate(start, -days);

  const { data: prevKpiData, error: prevError } = await supabase.rpc("rpc_dashboard_kpi", {
    p_start: prevStart,
    p_end: prevEnd,
    p_line: line,
  });

  if (prevError) {
    return NextResponse.json({ error: prevError.message }, { status: 500 });
  }

  const cur = (kpiData?.[0] ?? {}) as Record<string, number | null>;
  const prev = (prevKpiData?.[0] ?? {}) as Record<string, number | null>;

  const totalPyung = Number(cur.total_pyung ?? 0);
  const prevPyung = Number(prev.total_pyung ?? 0);
  const momChange = prevPyung > 0 ? ((totalPyung - prevPyung) / prevPyung) * 100 : null;

  const result: KpiData = {
    totalCount: Number(cur.total_count ?? 0),
    totalPyung,
    avgDailyPyung: Number(cur.avg_daily_pyung ?? 0),
    line1Ratio: Number(cur.line1_ratio ?? 0),
    line2Ratio: Number(cur.line2_ratio ?? 0),
    momChange,
  };

  return NextResponse.json(result);
}

