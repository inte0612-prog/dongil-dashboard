"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  question?: string;
  answer: string;
  sql?: string | null;
  insights?: string[];
  tableData?: Record<string, unknown>[];
  sqlError?: string | null;
  loading?: boolean;
};

const SUGGESTED = [
  "이번 달 생산실적을 요약해줘",
  "거래처별 생산량 TOP 10은?",
  "올해 월별 생산량 추이는 어때?",
  "최근 3개월 라인별 생산량 비교해줘",
  "전년 동기 대비 생산량 변화는?",
  "가장 많이 생산된 품목 TOP 5는?",
];

function SqlBlock({ sql, error }: { sql: string; error?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        SQL 보기
      </button>
      {open && (
        <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
          <code>{sql}</code>
          {error && <p className="mt-1 text-red-500">실행 오류: {error}</p>}
        </pre>
      )}
    </div>
  );
}

function TableBlock({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium text-muted-foreground">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 tabular-nums">
                  {String(row[c] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
          {rows.length > 50 && (
            <tr>
              <td colSpan={cols.length} className="px-3 py-2 text-center text-muted-foreground">
                … 외 {rows.length - 50}행
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: Message }) {
  if (msg.loading) {
    return (
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 rounded-xl rounded-tl-none bg-muted px-4 py-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="rounded-xl rounded-tl-none bg-muted px-4 py-3">
          <div
            className="prose prose-sm max-w-none text-sm dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: msg.answer
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                .replace(/\n/g, "<br/>"),
            }}
          />
          {msg.tableData && msg.tableData.length > 0 && <TableBlock rows={msg.tableData} />}
          {msg.sql && <SqlBlock sql={msg.sql} error={msg.sqlError} />}
        </div>
        {msg.insights && msg.insights.length > 0 && (
          <div className="space-y-1">
            {msg.insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      answer: "안녕하세요! 동일유리 생산 데이터 분석 AI 어시스턴트입니다.\n\n생산실적, 거래처별 현황, 기간별 추이 등 궁금한 것을 자유롭게 질문해 주세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Gemini multi-turn history 변환
  const buildHistory = () =>
    messages
      .filter((m) => !m.loading && m.role !== "assistant" || (m.role === "assistant" && m.answer))
      .slice(1) // 첫 인사 메시지 제외
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.role === "user" ? (m.question ?? m.answer) : m.answer,
      }));

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", question, answer: question },
      { role: "assistant", answer: "", loading: true },
    ]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, messages: buildHistory() }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          answer:    data.answer   ?? "응답을 가져오지 못했습니다.",
          sql:       data.sql      ?? null,
          insights:  data.insights ?? [],
          tableData: data.tableData ?? [],
          sqlError:  data.sqlError  ?? null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", answer: "오류가 발생했습니다. 다시 시도해 주세요." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* 헤더 */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold">AI 분석</h1>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Google Gemini 기반 · 생산 데이터를 자연어로 질문하세요
        </p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[75%] rounded-xl rounded-tr-none bg-primary px-4 py-3 text-sm text-primary-foreground">
                  {msg.question ?? msg.answer}
                </div>
              </div>
            ) : (
              <AssistantBubble key={i} msg={msg} />
            )
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 추천 질문 */}
      {messages.length <= 1 && (
        <div className="border-t bg-background px-6 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">추천 질문</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-accent"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 입력창 */}
      <div className="border-t bg-background px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
              }}
              placeholder="생산 데이터에 대해 질문하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
              rows={2}
              className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            AI가 생성한 SQL 및 분석 결과는 참고용입니다. 중요한 의사결정 전 검증하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
