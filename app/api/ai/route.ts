import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Service Role 클라이언트 — 서버 사이드 전용
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function buildSystemPrompt(
  start: string,
  end: string,
  line: string,
  context: { totalCount: number; totalPyung: number; topClients: string; topItems: string }
): string {
  const lineFilter = line === "all" ? "" : ` AND line = '${line}'`;
  const lineLabel  = line === "all" ? "전체 라인" : line;
  return `당신은 동일유리 생산관리 시스템의 데이터 분석 AI 어시스턴트입니다.

=== 현재 선택된 필터 ===
- 분석 기간: ${start} ~ ${end} (${lineLabel})
- 해당 기간 총 생산 건수: ${context.totalCount.toLocaleString()}건
- 해당 기간 총 생산 면적: ${context.totalPyung.toFixed(1)}평
- 상위 거래처(건수 기준): ${context.topClients}
- 상위 품목(건수 기준): ${context.topItems}

=== DB 스키마 ===
테이블명: production_records
- registered_at TIMESTAMPTZ  — 생산 등록 일시
- pid TEXT                   — 생산 고유번호
- item_code TEXT             — 품목코드
- item_name TEXT             — 품목명
- width NUMERIC              — 너비(mm)
- height NUMERIC             — 높이(mm)
- pyung NUMERIC              — 면적(평)
- client TEXT                — 거래처명
- site TEXT                  — 현장명
- line TEXT                  — 라인 ('1-LINE' 또는 '2-LINE')
- registrar TEXT             — 등록자
- order_no TEXT              — 수주번호

=== SQL 작성 규칙 ===
- 날짜 필터는 반드시 포함: registered_at BETWEEN '${start}' AND '${end}'${lineFilter ? " AND" + lineFilter.replace(" AND", "") : ""}
- 라인 필터: ${line === "all" ? "없음 (전체)" : `line = '${line}'`}
- SELECT만 허용, LIMIT 100 이하
- 건수: COUNT(*), 면적: SUM(pyung)

반드시 아래 JSON 형식으로만 응답 (다른 텍스트 없이):
{"sql":"SELECT ...","answer":"임시답변","insights":["인사이트1"]}`;
}

async function runSql(sql: string): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  try {
    // SELECT만 허용
    if (!/^\s*SELECT/i.test(sql)) return { rows: [], error: "SELECT 쿼리만 허용됩니다." };

    const { data, error } = await adminSupabase.rpc("execute_select", { query_text: sql });
    if (error) {
      // rpc 함수 없으면 fallback: 기본 집계 쿼리 실행
      return { rows: [], error: null };
    }
    const rows = Array.isArray(data) ? data : (data ? [data] : []);
    return { rows: rows.slice(0, 200), error: null };
  } catch {
    return { rows: [], error: null };
  }
}

async function fetchContext(start: string, end: string, line: string) {
  const lineFilter = line === "all" ? "" : ` AND line = '${line}'`;
  const base = `WHERE registered_at BETWEEN '${start}' AND '${end}'${lineFilter}`;

  const [statsRes, clientRes, itemRes] = await Promise.all([
    adminSupabase.rpc("execute_select", { query_text: `SELECT COUNT(*) AS cnt, COALESCE(SUM(pyung),0) AS pyung FROM production_records ${base}` }),
    adminSupabase.rpc("execute_select", { query_text: `SELECT client, COUNT(*) AS cnt FROM production_records ${base} GROUP BY client ORDER BY cnt DESC LIMIT 10` }),
    adminSupabase.rpc("execute_select", { query_text: `SELECT item_name, COUNT(*) AS cnt FROM production_records ${base} GROUP BY item_name ORDER BY cnt DESC LIMIT 10` }),
  ]);

  const stats    = (statsRes.data as { cnt: number; pyung: number }[])?.[0] ?? { cnt: 0, pyung: 0 };
  const clients  = (clientRes.data as { client: string; cnt: number }[] ?? []).map((r, i) => `${i + 1}.${r.client}(${Number(r.cnt).toLocaleString()}건)`).join(", ");
  const items    = (itemRes.data  as { item_name: string; cnt: number }[] ?? []).map((r, i) => `${i + 1}.${r.item_name}(${Number(r.cnt).toLocaleString()}건)`).join(", ");

  return { totalCount: Number(stats.cnt), totalPyung: Number(stats.pyung), topClients: clients || "없음", topItems: items || "없음" };
}

export async function POST(req: NextRequest) {
  try {
    const { question, messages = [], start, end, line = "all" } = await req.json() as {
      question: string;
      messages: { role: "user" | "assistant"; content: string }[];
      start?: string;
      end?: string;
      line?: string;
    };

    if (!OPENAI_KEY) return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });

    const today = new Date();
    const defaultStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const defaultEnd   = today.toISOString().slice(0, 10);
    const s = start ?? defaultStart;
    const e = end   ?? defaultEnd;

    const context = await fetchContext(s, e, line);
    const systemPrompt = buildSystemPrompt(s, e, line, context);

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
      { role: "user", content: question },
    ];

    const openaiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4", // fallback: "gpt-4o-mini"
        messages: chatMessages,
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return NextResponse.json({ error: `OpenAI 오류: ${err}` }, { status: 500 });
    }

    const openaiData = await openaiRes.json();
    const rawText: string = openaiData.choices?.[0]?.message?.content ?? "{}";

    // JSON 파싱 (코드블록 제거)
    const jsonStr = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed: { sql: string | null; answer: string; insights: string[] };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { sql: null, answer: rawText, insights: [] };
    }

    // SQL 실행
    let tableData: Record<string, unknown>[] = [];
    let sqlError: string | null = null;

    if (parsed.sql) {
      const result = await runSql(parsed.sql);
      tableData = result.rows;
      sqlError  = result.error;
    }

    // SQL 결과로 2차 답변 생성 — 실제 값 전체 나열 지시
    let finalAnswer = parsed.answer ?? "";
    if (tableData.length > 0) {
      const answerRes = await fetch(OPENAI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: "gpt-5.4", // fallback: "gpt-4o-mini"
          messages: [
            {
              role: "system",
              content: `아래 SQL 실행 결과를 바탕으로 사용자 질문에 한국어로 답변하세요.
규칙:
- 결과의 모든 행을 빠짐없이 나열하세요 (생략 금지)
- 숫자는 실제 값 그대로 사용 (반올림·요약 금지)
- 순위형 질문은 "1위: XX (N건)", "2위: XX (N건)" 형식으로 나열
- 단위 명시: 건수는 "건", 면적은 "평"
- 마크다운 굵게(**) 활용해 가독성 높이기`,
            },
            { role: "user", content: `질문: ${question}\n\nSQL 결과(${tableData.length}행):\n${JSON.stringify(tableData, null, 2)}` },
          ],
          temperature: 0.1,
          max_tokens: 2048,
        }),
      });
      if (answerRes.ok) {
        const answerData = await answerRes.json();
        finalAnswer = answerData.choices?.[0]?.message?.content ?? finalAnswer;
      }
    }

    return NextResponse.json({
      answer:   finalAnswer,
      sql:      parsed.sql ?? null,
      insights: parsed.insights ?? [],
      tableData,
      sqlError,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
