import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end   = searchParams.get("end");
  const line  = searchParams.get("line") ?? "all";

  if (!start || !end) return NextResponse.json({ error: "start/end 필요" }, { status: 400 });

  const supabase = createServiceClient();

  let q = supabase
    .from("production_records")
    .select("client")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .limit(1_000_000);
  if (line !== "all") q = q.eq("line", line);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const countMap = new Map<string, number>();
  for (const r of data ?? []) {
    const c = r.client || "(미입력)";
    countMap.set(c, (countMap.get(c) ?? 0) + 1);
  }

  const sorted = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1]);
  const grand  = sorted.reduce((s, [, v]) => s + v, 0);

  let cum = 0;
  // HHI: sum of (share_i)^2 × 10000
  let hhi = 0;
  const items = sorted.map(([name, count]) => {
    const share = grand > 0 ? count / grand : 0;
    cum += share;
    hhi += share * share * 10000;
    const grade: "A" | "B" | "C" = cum - share <= 0.7 ? "A" : cum - share <= 0.9 ? "B" : "C";
    return { name, count, share: Math.round(share * 10000) / 100, cumShare: Math.round(cum * 10000) / 100, grade };
  });

  const hhiRounded = Math.round(hhi);
  const top1  = items[0]?.cumShare  ?? 0;
  const top5  = items[4]?.cumShare  ?? items.at(-1)?.cumShare  ?? 0;
  const top10 = items[9]?.cumShare  ?? items.at(-1)?.cumShare  ?? 0;

  return NextResponse.json({
    items,
    hhi: hhiRounded,
    summary: { top1, top5, top10, total: sorted.length },
  });
}
