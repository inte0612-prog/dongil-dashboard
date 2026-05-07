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

  const prevStart = new Date(start); prevStart.setFullYear(prevStart.getFullYear() - 1);
  const prevEnd   = new Date(end);   prevEnd.setFullYear(prevEnd.getFullYear() - 1);

  let qCur = supabase
    .from("production_records")
    .select("registered_at")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .limit(1_000_000);
  if (line !== "all") qCur = qCur.eq("line", line);

  let qPrev = supabase
    .from("production_records")
    .select("registered_at")
    .gte("registered_at", toStartOfDay(prevStart.toISOString().slice(0, 10)))
    .lte("registered_at", toEndOfDay(prevEnd.toISOString().slice(0, 10)))
    .limit(1_000_000);
  if (line !== "all") qPrev = qPrev.eq("line", line);

  const [{ data: curData, error }, { data: prevData }] = await Promise.all([qCur, qPrev]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 월(01~12)별 카운트
  const curMap  = new Map<string, number>();
  const prevMap = new Map<string, number>();

  for (const r of curData  ?? []) { const m = r.registered_at.slice(5, 7); curMap.set(m,  (curMap.get(m)  ?? 0) + 1); }
  for (const r of prevData ?? []) { const m = r.registered_at.slice(5, 7); prevMap.set(m, (prevMap.get(m) ?? 0) + 1); }

  const months = Array.from(new Set([...curMap.keys(), ...prevMap.keys()])).sort();
  const yoy = months.map((m) => {
    const cur  = curMap.get(m)  ?? 0;
    const prev = prevMap.get(m) ?? 0;
    const growth = prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;
    return { month: `${Number(m)}월`, cur, prev, growth };
  });

  return NextResponse.json(yoy);
}
