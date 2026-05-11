import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { KpiData } from "@/types";

type PeriodStats = {
  total_count: number;
  total_pyung: number;
  line1_count: number;
  line2_count: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end   = searchParams.get("end");
  const line  = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: statsData, error: e1 } = await supabase.rpc("get_period_stats", {
    p_start: start,
    p_end:   end,
    p_line:  line,
  });

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const stats = ((statsData ?? []) as PeriodStats[])[0];
  const totalCount = stats?.total_count ?? 0;
  const totalPyung = stats?.total_pyung ?? 0;
  const line1Count = stats?.line1_count ?? 0;
  const line2Count = stats?.line2_count ?? 0;

  const days = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1
  );
  const avgDailyPyung = totalPyung / days;
  const line1Ratio = totalCount > 0 ? line1Count / totalCount : 0;
  const line2Ratio = totalCount > 0 ? line2Count / totalCount : 0;

  // 직전 동일 기간 대비 변화율
  const periodMs  = new Date(end).getTime() - new Date(start).getTime();
  const prevEnd   = new Date(new Date(start).getTime() - 86_400_000).toISOString().slice(0, 10);
  const prevStart = new Date(new Date(start).getTime() - periodMs - 86_400_000).toISOString().slice(0, 10);

  const { data: prevData, error: e2 } = await supabase.rpc("get_period_stats", {
    p_start: prevStart,
    p_end:   prevEnd,
    p_line:  line,
  });

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const prevStats = ((prevData ?? []) as PeriodStats[])[0];
  const prevPyung = prevStats?.total_pyung ?? 0;
  const momChange = prevPyung > 0 ? ((totalPyung - prevPyung) / prevPyung) * 100 : null;

  const result: KpiData = {
    totalCount,
    totalPyung,
    avgDailyPyung,
    line1Ratio,
    line2Ratio,
    momChange,
  };

  return NextResponse.json(result);
}
