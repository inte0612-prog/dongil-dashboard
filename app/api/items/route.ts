import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { ItemData } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const limit = Number(searchParams.get("limit") ?? 10);
  const sortBy = searchParams.get("sortBy") ?? "count";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("item_code, item_name, pyung")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, ItemData>();

  for (const row of data ?? []) {
    const key = row.item_code || row.item_name;
    const existing = map.get(key) ?? {
      itemCode: row.item_code,
      itemName: row.item_name,
      count: 0,
      totalPyung: 0,
      avgPyung: 0,
    };
    existing.count += 1;
    existing.totalPyung += row.pyung ?? 0;
    map.set(key, existing);
  }

  const result = Array.from(map.values())
    .map((d) => ({ ...d, avgPyung: d.count > 0 ? d.totalPyung / d.count : 0 }))
    .sort((a, b) =>
      sortBy === "pyung" ? b.totalPyung - a.totalPyung : b.count - a.count
    )
    .slice(0, limit);

  return NextResponse.json(result);
}
