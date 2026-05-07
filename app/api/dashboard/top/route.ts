import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end   = searchParams.get("end");
  const line  = searchParams.get("line") ?? "all";

  if (!start || !end) return NextResponse.json({ error: "start/end 필요" }, { status: 400 });

  const supabase = await createClient();

  let q = supabase
    .from("production_records")
    .select("client, item_name, pyung")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .limit(1_000_000);
  if (line !== "all") q = q.eq("line", line);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // 거래처 집계
  const clientMap = new Map<string, { count: number; pyung: number }>();
  const itemMap   = new Map<string, { count: number; pyung: number }>();

  for (const r of rows) {
    const c = r.client    || "(미입력)";
    const it = r.item_name || "(미입력)";
    const p = Number(r.pyung) || 0;

    const ce = clientMap.get(c) ?? { count: 0, pyung: 0 };
    ce.count += 1; ce.pyung += p;
    clientMap.set(c, ce);

    const ie = itemMap.get(it) ?? { count: 0, pyung: 0 };
    ie.count += 1; ie.pyung += p;
    itemMap.set(it, ie);
  }

  const toArr = (m: Map<string, { count: number; pyung: number }>) =>
    Array.from(m.entries())
      .map(([name, v]) => ({ name, count: v.count, pyung: Math.round(v.pyung * 10) / 10 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

  return NextResponse.json({ clients: toArr(clientMap), items: toArr(itemMap) });
}
