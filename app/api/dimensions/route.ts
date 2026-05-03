import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { toStartOfDay, toEndOfDay } from "@/lib/utils/dateUtils";
import { parseSizeClass } from "@/lib/utils/specParser";
import { SCATTER_SAMPLE_SIZE } from "@/lib/constants";
import { DimensionScatterPoint, SizeClassData, TopDimension } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const line = searchParams.get("line") ?? "all";

  if (!start || !end) {
    return NextResponse.json({ error: "start, end 파라미터 필요" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("production_records")
    .select("width, height, pyung")
    .gte("registered_at", toStartOfDay(start))
    .lte("registered_at", toEndOfDay(end))
    .not("width", "is", null)
    .not("height", "is", null);

  query = query.limit(1_000_000);

  if (line !== "all") query = query.eq("line", line);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // 균등 샘플링
  const step = Math.max(1, Math.floor(rows.length / SCATTER_SAMPLE_SIZE));
  const scatter: DimensionScatterPoint[] = rows
    .filter((_, i) => i % step === 0)
    .map((r) => ({ width: r.width, height: r.height, pyung: r.pyung ?? 0 }));

  // 크기 분류
  const sizeClass: SizeClassData = { 소형: 0, 중형: 0, 대형: 0 };
  for (const r of rows) {
    sizeClass[parseSizeClass(r.pyung ?? 0)]++;
  }

  // 상위 치수 조합
  const dimMap = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.width}×${r.height}`;
    dimMap.set(key, (dimMap.get(key) ?? 0) + 1);
  }
  const topDimensions: TopDimension[] = Array.from(dimMap.entries())
    .map(([k, count]) => {
      const [w, h] = k.split("×").map(Number);
      return { width: w, height: h, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({ scatter, sizeClass, topDimensions });
}
