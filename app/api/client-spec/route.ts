import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { parseCoating } from "@/lib/utils/specParser";
import { ClientSpecData } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const topN = Number(searchParams.get("topN") ?? 10);

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("client, item_name")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 거래처 상위 N개 필터링
  const clientCount = new Map<string, number>();
  for (const r of data ?? []) {
    const c = r.client || "(미입력)";
    clientCount.set(c, (clientCount.get(c) ?? 0) + 1);
  }
  const topClients = new Set(
    Array.from(clientCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([c]) => c)
  );

  // 교차 집계
  const map = new Map<string, number>();
  for (const r of data ?? []) {
    const c = r.client || "(미입력)";
    if (!topClients.has(c)) continue;
    const coating = parseCoating(r.item_name ?? "");
    const key = `${c}__${coating}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const result: ClientSpecData[] = Array.from(map.entries())
    .map(([k, count]) => {
      const [client, coating] = k.split("__");
      return { client, coating, count };
    })
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(result);
}
