import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end   = searchParams.get("end");
  const line  = searchParams.get("line") ?? "all";

  if (!start || !end) return NextResponse.json({ error: "start/end 필요" }, { status: 400 });

  const supabase = await createClient();

  let q = supabase
    .from("production_records")
    .select("registered_at, pyung, line")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .limit(1_000_000);
  if (line !== "all") q = q.eq("line", line);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 일별 집계
  const dayMap = new Map<string, { count: number; pyung: number; line1: number; line2: number }>();
  for (const r of data ?? []) {
    const day = r.registered_at.slice(0, 10);
    const e = dayMap.get(day) ?? { count: 0, pyung: 0, line1: 0, line2: 0 };
    e.count += 1;
    e.pyung += Number(r.pyung) || 0;
    if (r.line === "1-LINE") e.line1 += 1;
    else if (r.line === "2-LINE") e.line2 += 1;
    dayMap.set(day, e);
  }

  // 날짜 범위 내 모든 날 채우기 (문자열 기반으로 timezone 무관하게 처리)
  const days: string[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    const [y, m, d] = cur.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    cur = next.toISOString().slice(0, 10);
  }

  const counts = days.map((d) => dayMap.get(d)?.count ?? 0);

  const result = days.map((day, i) => {
    const entry = dayMap.get(day) ?? { count: 0, pyung: 0, line1: 0, line2: 0 };
    const ma7  = movingAvg(counts, i, 7);
    const ma30 = movingAvg(counts, i, 30);
    const sd30 = stdDev(counts, i, 30);
    const isAnomaly = sd30 > 0 && Math.abs(entry.count - ma30) > 2 * sd30;
    return {
      day,
      count: entry.count,
      pyung: Math.round(entry.pyung * 10) / 10,
      line1: entry.line1,
      line2: entry.line2,
      ma7:   Math.round(ma7 * 10) / 10,
      ma30:  Math.round(ma30 * 10) / 10,
      isAnomaly,
    };
  });

  return NextResponse.json(result);
}
