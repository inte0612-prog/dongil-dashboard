import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { ClientData, SiteData } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const limit = Number(searchParams.get("limit") ?? 20);

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("client, site, pyung")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end));

  query = query.limit(1_000_000);

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 거래처 집계
  const clientMap = new Map<string, ClientData>();
  const siteMap = new Map<string, SiteData>();

  for (const row of data ?? []) {
    const c = row.client || "(미입력)";
    const s = row.site || "(미입력)";

    const existing = clientMap.get(c) ?? { client: c, count: 0, totalPyung: 0 };
    existing.count += 1;
    existing.totalPyung += Number(row.pyung) || 0;
    clientMap.set(c, existing);

    const se = siteMap.get(s) ?? { site: s, count: 0 };
    se.count += 1;
    siteMap.set(s, se);
  }

  const clients = Array.from(clientMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const sites = Array.from(siteMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return NextResponse.json({ clients, sites });
}
