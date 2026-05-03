import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { KpiData } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("pyung, line, registered_at")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const totalCount = rows.length;
  const totalPyung = rows.reduce((s, r) => s + (r.pyung ?? 0), 0);

  const days = Math.max(
    1,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
  const avgDailyPyung = totalPyung / days;

  const line1Count = rows.filter((r) => r.line === "1-LINE").length;
  const line2Count = rows.filter((r) => r.line === "2-LINE").length;
  const line1Ratio = totalCount > 0 ? line1Count / totalCount : 0;
  const line2Ratio = totalCount > 0 ? line2Count / totalCount : 0;

  // 전월 대비 변화율: 동일 기간 길이를 이전 구간으로 조회
  const periodMs = new Date(end).getTime() - new Date(start).getTime();
  const prevEnd = new Date(new Date(start).getTime() - 1).toISOString().slice(0, 10);
  const prevStart = new Date(new Date(start).getTime() - periodMs - 86400000)
    .toISOString()
    .slice(0, 10);

  let prevQuery = supabase
    .from("production_records")
    .select("pyung", { count: "exact", head: false })
    .gte("registered_at", toStartOfDay(prevStart))
    .lte("registered_at", toEndOfDay(prevEnd));

  if (line !== "all") prevQuery = prevQuery.eq("line", line);

  const { data: prevData } = await prevQuery;
  const prevPyung = (prevData ?? []).reduce((s, r) => s + (r.pyung ?? 0), 0);
  const momChange =
    prevPyung > 0 ? ((totalPyung - prevPyung) / prevPyung) * 100 : null;

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
