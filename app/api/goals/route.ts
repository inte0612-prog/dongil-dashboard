import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");
  const supabase = await createClient();

  let query = supabase
    .from("production_goals")
    .select("*")
    .order("month", { ascending: true });

  if (year) query = query.eq("year", Number(year));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { year, month, target_quantity, target_area, memo } = body;

  if (!year || !month) {
    return NextResponse.json({ error: "year, month 필수" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_goals")
    .insert({ year, month, target_quantity: target_quantity ?? null, target_area: target_area ?? null, memo: memo ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, target_quantity, target_area, memo } = body;

  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_goals")
    .update({ target_quantity: target_quantity ?? null, target_area: target_area ?? null, memo: memo ?? null })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("production_goals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
