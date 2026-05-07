import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

type TrendRow = {
  day: string;
  count: number;
  pyung: number;
  line1_count: number;
  line2_count: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start/end is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("rpc_dashboard_daily_trend", {
    p_start: start,
    p_end: end,
    p_line: line,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as TrendRow[]).map((r) => ({
    day: r.day,
    count: Number(r.count ?? 0),
    pyung: Number(r.pyung ?? 0),
    line1: Number(r.line1_count ?? 0),
    line2: Number(r.line2_count ?? 0),
  }));

  const counts = rows.map((r) => r.count);

  const result = rows.map((r, i) => {
    const ma7 = movingAvg(counts, i, 7);
    const ma30 = movingAvg(counts, i, 30);
    const sd30 = stdDev(counts, i, 30);
    const isAnomaly = sd30 > 0 && Math.abs(r.count - ma30) > 2 * sd30;

    return {
      day: r.day,
      count: r.count,
      pyung: Math.round(r.pyung * 10) / 10,
      line1: r.line1,
      line2: r.line2,
      ma7: Math.round(ma7 * 10) / 10,
      ma30: Math.round(ma30 * 10) / 10,
      isAnomaly,
    };
  });

  return NextResponse.json(result);
}

