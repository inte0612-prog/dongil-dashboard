import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

type PivotBucketRow = { period: string; dim: string; value: number };

function aggregateDims(rows: PivotBucketRow[], topN = 10) {
  const totals = new Map<string, number>();
  for (const r of rows) {
    const dim = r.dim || "(미입력)";
    totals.set(dim, (totals.get(dim) ?? 0) + Number(r.value ?? 0));
  }
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, total]) => ({ name, total }));
}

async function fetchContext(start: string, end: string, line: string) {
  const supabase = await createClient();

  const [kpiRes, pivotClientRes, pivotItemRes] = await Promise.all([
    supabase.rpc("rpc_dashboard_kpi", { p_start: start, p_end: end, p_line: line }),
    supabase.rpc("rpc_pivot_bucketed", {
      p_start: start, p_end: end, p_line: line,
      p_dimension: "client", p_unit: "month", p_metric: "count",
    }),
    supabase.rpc("rpc_pivot_bucketed", {
      p_start: start, p_end: end, p_line: line,
      p_dimension: "item_code", p_unit: "month", p_metric: "count",
    }),
  ]);

  const kpi = kpiRes.data?.[0] ?? {};
  const topClients = aggregateDims((pivotClientRes.data ?? []) as PivotBucketRow[]);
  const topItems   = aggregateDims((pivotItemRes.data   ?? []) as PivotBucketRow[]);

  return { kpi, topClients, topItems };
}

function buildSystemPrompt(
  start: string,
  end: string,
  line: string,
  kpi: Record<string, number | null>,
  topClients: { name: string; total: number }[],
  topItems: { name: string; total: number }[]
): string {
  const lineLabel = line === "all" ? "전체 라인" : line;
  const clientList = topClients.map((c, i) => `  ${i + 1}. ${c.name} (${c.total.toLocaleString()}건)`).join("\n");
  const itemList = topItems.map((c, i) => `  ${i + 1}. ${c.name} (${c.total.toLocaleString()}건)`).join("\n");

  return `당신은 동일유리 생산 대시보드의 AI 분석 어시스턴트입니다.
아래 실제 생산 데이터를 기반으로 사용자의 질문에 한국어로 친절하고 전문적으로 답변하세요.
수치를 언급할 때는 항상 단위를 명시하고, 인사이트나 개선 제안도 함께 제공하세요.

=== 현재 분석 기간: ${start} ~ ${end} (${lineLabel}) ===

[KPI 요약]
- 총 생산 수량: ${Number(kpi.total_count ?? 0).toLocaleString()}건
- 총 생산 면적: ${Number(kpi.total_pyung ?? 0).toFixed(1)}평
- 일평균 생산 면적: ${Number(kpi.avg_daily_pyung ?? 0).toFixed(1)}평
- 1-LINE 비율: ${Number(kpi.line1_ratio ?? 0).toFixed(1)}%
- 2-LINE 비율: ${Number(kpi.line2_ratio ?? 0).toFixed(1)}%

[상위 10 거래처 (생산 수량 기준)]
${clientList || "  데이터 없음"}

[상위 10 품목 (생산 수량 기준)]
${itemList || "  데이터 없음"}

위 데이터 범위 밖의 질문(기간 외 데이터, 개인정보 등)은 정중히 안내하세요.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, start, end, line = "all", history = [] } = body as {
      message: string;
      start: string;
      end: string;
      line: string;
      history: { role: "user" | "model"; parts: { text: string }[] }[];
    };

    if (!message || !start || !end) {
      return NextResponse.json({ error: "message, start, end는 필수입니다." }, { status: 400 });
    }

    if (!OPENAI_KEY) return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });

    const { kpi, topClients, topItems } = await fetchContext(start, end, line);
    const systemPrompt = buildSystemPrompt(start, end, line, kpi, topClients, topItems);

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((h: { role: "user" | "model"; parts: { text: string }[] }) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.parts.map((p) => p.text).join(""),
      })),
      { role: "user", content: message },
    ];

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: chatMessages, temperature: 0.3 }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenAI 오류: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AI chat error]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
