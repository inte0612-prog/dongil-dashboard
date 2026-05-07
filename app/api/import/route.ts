import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rows } = body as { rows: Record<string, unknown>[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows 필수" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_records")
    .upsert(rows, { onConflict: "registered_at,pid", ignoreDuplicates: true })
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: data?.length ?? 0, processed: rows.length });
}
