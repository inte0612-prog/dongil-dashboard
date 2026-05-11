import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { genDays } from "@/lib/utils/dateUtils";
import { detectAnomalies } from "@/lib/utils/anomalyDetector";
import { ANOMALY_THRESHOLD } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end   = searchParams.get("end");
  const line  = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("get_daily_trend", {
    p_start: start,
    p_end:   end,
    p_line:  line,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rpcMap = new Map<string, number>();
  for (const row of (data ?? []) as { day: string; cnt: number }[]) {
    rpcMap.set(row.day, row.cnt);
  }

  const days = genDays(start, end);
  const dailyData = days.map((date) => ({ date, count: rpcMap.get(date) ?? 0 }));
  const anomalies = detectAnomalies(dailyData, 7, ANOMALY_THRESHOLD);

  return NextResponse.json({ anomalies, dailyData });
}
