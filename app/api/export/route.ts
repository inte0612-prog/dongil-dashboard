import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";

const HEADERS = [
  "id", "등록일시", "PID", "공정", "품목코드", "품명",
  "너비", "높이", "수량", "평수", "의뢰번호", "순번",
  "거래처", "현장", "라인", "등록자", "비고",
];

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const search = searchParams.get("search") ?? "";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("*")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .order("registered_at", { ascending: false });

  if (line !== "all") query = query.eq("line", line);
  if (search) query = query.or(`item_name.ilike.%${search}%,client.ilike.%${search}%`);
  query = query.limit(1_000_000);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = [
    HEADERS.join(","),
    ...(data ?? []).map((r) =>
      [
        r.id, r.registered_at, r.pid, r.process, r.item_code, r.item_name,
        r.width, r.height, r.quantity, r.pyung, r.order_no, r.seq_no,
        r.client, r.site, r.line, r.registrar, r.remark,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ].join("\r\n");

  const bom = "﻿";
  return new NextResponse(bom + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="production_${start}_${end}.csv"`,
    },
  });
}
