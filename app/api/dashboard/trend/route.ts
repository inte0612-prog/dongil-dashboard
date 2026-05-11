import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { genDays } from "@/lib/utils/dateUtils";

function movingAvg(arr: number[], i: number, window: number): number {
  const slice = arr.slice(Math.max(0, i - window + 1), i + 1);
  return slice.reduce((s, v) => s + v, 0) / slice.length;
}

function stdDev(arr: number[], i: number, window: number): number {
  const slice = arr.slice(Math.max(0, i - window + 1), i + 1);
  const mean = slice.reduce((s, v) => s + v, 0) / slice.length;
  const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length;
  return Math.sqrt(variance);
}

type RpcRow = { day: string; cnt: number; pyung_sum: number; line1_cnt: number; line2_cnt: number };

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end   = searchParams.get("end");
  const line  = searchParams.get("line") ?? "all";

  if (!start || !end) return NextResponse.json({ error: "start/end 필요" }, { status: 400 });

  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("get_daily_trend", {
    p_start: start,
    p_end:   end,
    p_line:  line,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rpcMap = new Map<string, RpcRow>();
  for (const row of (data ?? []) as RpcRow[]) {
    rpcMap.set(row.day, row);
  }

  const days = genDays(start, end);
  const counts = days.map((d) => rpcMap.get(d)?.cnt ?? 0);

  const result = days.map((day, i) => {
    const row   = rpcMap.get(day);
    const count = row?.cnt ?? 0;
    const ma7   = movingAvg(counts, i, 7);
    const ma30  = movingAvg(counts, i, 30);
    const sd30  = stdDev(counts, i, 30);
    const isAnomaly = sd30 > 0 && Math.abs(count - ma30) > 2 * sd30;
    return {
      day,
      count,
      pyung:  Math.round((row?.pyung_sum ?? 0) * 10) / 10,
      line1:  row?.line1_cnt ?? 0,
      line2:  row?.line2_cnt ?? 0,
      ma7:    Math.round(ma7 * 10) / 10,
      ma30:   Math.round(ma30 * 10) / 10,
      isAnomaly,
    };
  });

  return NextResponse.json(result);
}
