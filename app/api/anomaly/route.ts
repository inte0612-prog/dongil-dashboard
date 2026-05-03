import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay, formatDate } from "@/lib/utils/dateUtils";
import { detectAnomalies } from "@/lib/utils/anomalyDetector";
import { ANOMALY_THRESHOLD } from "@/lib/constants";

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
    .select("registered_at")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 일별 건수 집계
  const countMap = new Map<string, number>();
  for (const row of data ?? []) {
    const day = formatDate(row.registered_at);
    countMap.set(day, (countMap.get(day) ?? 0) + 1);
  }

  const dailyData = Array.from(countMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const anomalies = detectAnomalies(dailyData, 7, ANOMALY_THRESHOLD);

  return NextResponse.json({ anomalies, dailyData });
}
