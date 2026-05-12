import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { formatDate } from "@/lib/utils/dateUtils";

export async function GET() {
  const supabase = createServiceClient();

  const [{ data: first }, { data: last }] = await Promise.all([
    supabase
      .from("production_records")
      .select("registered_at")
      .order("registered_at", { ascending: true })
      .limit(1),
    supabase
      .from("production_records")
      .select("registered_at")
      .order("registered_at", { ascending: false })
      .limit(1),
  ]);

  const minDate = first?.[0]?.registered_at?.slice(0, 10) ?? "2020-01-01";
  const maxDate = last?.[0]?.registered_at?.slice(0, 10) ?? formatDate(new Date());

  return NextResponse.json({ minDate, maxDate });
}
