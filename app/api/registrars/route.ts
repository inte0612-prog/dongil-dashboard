import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { RegistrarData } from "@/types";

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
    .select("registrar, line, pyung")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, RegistrarData>();

  for (const row of data ?? []) {
    const key = `${row.registrar}__${row.line}`;
    const existing = map.get(key) ?? {
      registrar: row.registrar || "(미입력)",
      line: row.line || "(미입력)",
      count: 0,
      totalPyung: 0,
    };
    existing.count += 1;
    existing.totalPyung += row.pyung ?? 0;
    map.set(key, existing);
  }

  const result = Array.from(map.values()).sort((a, b) => b.count - a.count);
  return NextResponse.json(result);
}
