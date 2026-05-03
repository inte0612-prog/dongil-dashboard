import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { OrderData } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const limit = Number(searchParams.get("limit") ?? 50);

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("order_no, pyung, registered_at")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .not("order_no", "eq", "");

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, { count: number; totalPyung: number; dates: string[] }>();

  for (const row of data ?? []) {
    const existing = map.get(row.order_no) ?? { count: 0, totalPyung: 0, dates: [] };
    existing.count += 1;
    existing.totalPyung += row.pyung ?? 0;
    existing.dates.push(row.registered_at);
    map.set(row.order_no, existing);
  }

  const result: OrderData[] = Array.from(map.entries())
    .map(([orderNo, v]) => {
      const sorted = v.dates.sort();
      const first = sorted[0].slice(0, 10);
      const last = sorted[sorted.length - 1].slice(0, 10);
      const leadDays = Math.round(
        (new Date(last).getTime() - new Date(first).getTime()) / 86400000
      );
      return { orderNo, count: v.count, totalPyung: v.totalPyung, firstDate: first, lastDate: last, leadDays };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return NextResponse.json(result);
}
