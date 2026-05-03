import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { TrendDataPoint, TrendUnit } from "@/types";
import { getISOWeek, getISOWeekYear } from "date-fns";

function getPeriodKey(date: Date, unit: TrendUnit): string {
  if (unit === "day") {
    return date.toISOString().slice(0, 10);
  }
  if (unit === "week") {
    const week = String(getISOWeek(date)).padStart(2, "0");
    return `${getISOWeekYear(date)}-W${week}`;
  }
  return date.toISOString().slice(0, 7);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const unit = (searchParams.get("unit") ?? "day") as TrendUnit;

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("registered_at, pyung, line")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));

  query = query.limit(1_000_000);

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, TrendDataPoint>();

  for (const row of data ?? []) {
    const key = getPeriodKey(new Date(row.registered_at), unit);
    const existing = map.get(key) ?? {
      period: key,
      count: 0,
      pyung: 0,
      line1Count: 0,
      line2Count: 0,
      line1Pyung: 0,
      line2Pyung: 0,
    };

    existing.count += 1;
    existing.pyung += row.pyung ?? 0;

    if (row.line === "1-LINE") {
      existing.line1Count = (existing.line1Count ?? 0) + 1;
      existing.line1Pyung = (existing.line1Pyung ?? 0) + (row.pyung ?? 0);
    } else if (row.line === "2-LINE") {
      existing.line2Count = (existing.line2Count ?? 0) + 1;
      existing.line2Pyung = (existing.line2Pyung ?? 0) + (row.pyung ?? 0);
    }

    map.set(key, existing);
  }

  const result = Array.from(map.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  return NextResponse.json(result);
}
