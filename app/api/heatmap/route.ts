import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { HeatmapDataPoint } from "@/types";

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

  query = query.limit(1_000_000);

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, number>();

  for (const row of data ?? []) {
    const d = new Date(row.registered_at);
    const hour = d.getHours();
    const weekday = d.getDay();
    const key = `${weekday}_${hour}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const result: HeatmapDataPoint[] = [];
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      result.push({ weekday: w, hour: h, count: map.get(`${w}_${h}`) ?? 0 });
    }
  }

  return NextResponse.json(result);
}
