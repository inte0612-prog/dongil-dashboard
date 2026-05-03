import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { KpiData } from "@/types";

const MAX_ROWS = 1_000_000;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  // 전체 건수 (head: true — 데이터 미전송, 빠름)
  let countQuery = supabase
    .from("production_records")
    .select("*", { count: "exact", head: true })
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));
  if (line !== "all") countQuery = countQuery.eq("line", line);

  // 평수·라인 집계용 데이터
  let dataQuery = supabase
    .from("production_records")
    .select("pyung, line")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .limit(MAX_ROWS);
  if (line !== "all") dataQuery = dataQuery.eq("line", line);

  const [{ count: totalCount, error: e1 }, { data, error: e2 }] = await Promise.all([
    countQuery,
    dataQuery,
  ]);

  if (e1 || e2) return NextResponse.json({ error: (e1 ?? e2)!.message }, { status: 500 });

  const rows = data ?? [];
  const totalPyung = rows.reduce((s, r) => s + ((r.pyung as number) ?? 0), 0);
  const count = totalCount ?? 0;

  const days = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1
  );
  const avgDailyPyung = totalPyung / days;

  const line1Count = rows.filter((r) => r.line === "1-LINE").length;
  const line2Count = rows.filter((r) => r.line === "2-LINE").length;
  const line1Ratio = count > 0 ? line1Count / count : 0;
  const line2Ratio = count > 0 ? line2Count / count : 0;

  // 직전 동일 기간 대비 변화율
  const periodMs = new Date(end).getTime() - new Date(start).getTime();
  const prevEnd = new Date(new Date(start).getTime() - 1).toISOString().slice(0, 10);
  const prevStart = new Date(new Date(start).getTime() - periodMs - 86_400_000).toISOString().slice(0, 10);

  let prevQuery = supabase
    .from("production_records")
    .select("pyung")
    .gte("registered_at", toStartOfDay(prevStart))
    .lte("registered_at", toEndOfDay(prevEnd))
    .limit(MAX_ROWS);
  if (line !== "all") prevQuery = prevQuery.eq("line", line);

  const { data: prevData } = await prevQuery;
  const prevPyung = (prevData ?? []).reduce((s, r) => s + ((r.pyung as number) ?? 0), 0);
  const momChange = prevPyung > 0 ? ((totalPyung - prevPyung) / prevPyung) * 100 : null;

  const result: KpiData = {
    totalCount: count,
    totalPyung,
    avgDailyPyung,
    line1Ratio,
    line2Ratio,
    momChange,
  };

  return NextResponse.json(result);
}
