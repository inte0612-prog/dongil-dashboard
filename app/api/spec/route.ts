import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { parseCoating, parseGap, hasArgon } from "@/lib/utils/specParser";
import { SpecData } from "@/types";

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
    .select("item_name")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));

  query = query.limit(1_000_000);

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const coatingMap = new Map<string, number>();
  const gapMap = new Map<string, number>();
  let argonYes = 0;
  let argonNo = 0;

  for (const row of data ?? []) {
    const name = row.item_name ?? "";
    const coating = parseCoating(name);
    const gap = parseGap(name);
    coatingMap.set(coating, (coatingMap.get(coating) ?? 0) + 1);
    gapMap.set(gap, (gapMap.get(gap) ?? 0) + 1);
    if (hasArgon(name)) argonYes++;
    else argonNo++;
  }

  const result: SpecData = {
    coating: Array.from(coatingMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    gap: Array.from(gapMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    argon: { yes: argonYes, no: argonNo },
  };

  return NextResponse.json(result);
}
