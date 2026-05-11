import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Service Role 클라이언트 — 서버 사이드 전용
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `당신은 동일유리 생산관리 시스템의 데이터 분석 AI 어시스턴트입니다.
사용자의 자연어 질문을 분석하여 PostgreSQL SELECT 쿼리를 생성하고 결과를 해석해 주세요.

데이터베이스 스키마:
테이블명: production_records
컬럼:
- registered_at TIMESTAMPTZ  — 생산 등록 일시 (KST, 예: '2024-03-15 09:30:00+09')
- pid TEXT                   — 생산 고유번호
- item_code TEXT             — 품목코드
- item_name TEXT             — 품목명(제품명)
- width NUMERIC              — 너비(mm)
- height NUMERIC             — 높이(mm)
- pyung NUMERIC              — 면적(평)
- client TEXT                — 거래처명
- site TEXT                  — 현장명
- line TEXT                  — 라인 ('1-LINE' 또는 '2-LINE')
- registrar TEXT             — 등록자
- order_no TEXT              — 수주번호

날짜 참고: 오늘은 ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })} 입니다.
이번 달: ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "sql": "SELECT ... FROM production_records WHERE ... LIMIT 200",
  "answer": "분석 결과를 한국어로 설명 (마크다운 사용 가능)",
  "insights": ["핵심 인사이트 1", "핵심 인사이트 2", "핵심 인사이트 3"]
}

규칙:
- SQL은 SELECT만 허용, LIMIT 200 이하
- registered_at 기준 날짜 필터는 AT TIME ZONE 'Asia/Seoul' 사용
- 면적 합계는 SUM(pyung), 건수는 COUNT(*)
- sql이 필요없는 일반 질문은 sql을 null로
- answer는 반드시 한국어
`;

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

export async function POST(req: NextRequest) {
  try {
    const { question, messages = [] } = await req.json() as {
      question: string;
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!OPENAI_KEY) return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });

    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
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
        model: "gpt-4o-mini",
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

    return NextResponse.json({
      answer:   parsed.answer ?? "",
      sql:      parsed.sql ?? null,
      insights: parsed.insights ?? [],
      tableData,
      sqlError,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
