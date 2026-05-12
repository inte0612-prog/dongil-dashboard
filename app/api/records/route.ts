import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { PaginatedResponse, RecordRow, SortOrder } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
  const sortBy = searchParams.get("sortBy") ?? "registered_at";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as SortOrder;
  const search = searchParams.get("search") ?? "";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("production_records")
    .select("*", { count: "exact" })
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (line !== "all") query = query.eq("line", line);
  if (search) query = query.or(`item_name.ilike.%${search}%,client.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: PaginatedResponse<RecordRow> = {
    data: (data ?? []) as RecordRow[],
    total: count ?? 0,
    page,
    pageSize,
  };

  return NextResponse.json(result);
}
