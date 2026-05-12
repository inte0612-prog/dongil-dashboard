import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type YoyRow = {
  month: number;
  current_count: number;
  prev_count: number;
  growth_pct: number | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start/end is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("rpc_dashboard_yoy", {
    p_start: start,
    p_end: end,
    p_line: line,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const yoy = ((data ?? []) as YoyRow[]).map((r) => ({
    month: `${Number(r.month)}월`,
    cur: Number(r.current_count ?? 0),
    prev: Number(r.prev_count ?? 0),
    growth: r.growth_pct == null ? null : Number(r.growth_pct),
  }));

  return NextResponse.json(yoy);
}

