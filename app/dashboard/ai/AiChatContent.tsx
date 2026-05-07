"use client";

import { useState, useRef, useEffect } from "react";
import { useFilter } from "@/hooks/useFilter";
import { Sparkles, Send, User, RotateCcw } from "lucide-react";

type Role = "user" | "model";
type Message = { role: Role; text: string };
type HistoryPart = { role: Role; parts: { text: string }[] };

const SUGGESTIONS = [
  "이번 기간 생산 실적을 요약해줘",
  "가장 많이 생산한 거래처 Top 5는?",
  "1-LINE과 2-LINE 비율을 분석해줘",
  "생산량이 많은 품목은 무엇인가요?",
];

export default function AiChatContent() {
  const { start, end, line } = useFilter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryPart[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !start || !end) return;

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const newHistory: HistoryPart[] = [
      ...history,
      { role: "user", parts: [{ text }] },
    ];

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, start, end, line, history }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      const modelMsg: Message = { role: "model", text: data.text };
      setMessages((prev) => [...prev, modelMsg]);
      setHistory([...newHistory, { role: "model", parts: [{ text: data.text }] }]);
    } catch (err) {
      const errText = err instanceof Error ? err.message : "알 수 없는 오류";
      setMessages((prev) => [...prev, { role: "model", text: `오류: ${errText}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function reset() {
    setMessages([]);
    setHistory([]);
    setInput("");
  }

  const noDate = !start || !end;

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI 분석</h1>
          <p className="text-sm text-muted-foreground">
            생산 데이터를 기반으로 AI가 질문에 답변합니다.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-3 w-3" />
            대화 초기화
          </button>
        )}
      </div>

      {/* 날짜 미선택 경고 */}
      {noDate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          상단 날짜 필터에서 분석 기간을 선택해주세요.
        </div>
      )}

      {/* 채팅 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-background">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 초기 안내 */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-medium">생산 데이터에 대해 무엇이든 물어보세요</p>
              <p className="mt-1 text-xs text-muted-foreground">
                현재 선택된 기간의 실제 데이터를 바탕으로 답변합니다.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={noDate || loading}
                    className="rounded-lg border px-4 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "model" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* 로딩 */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={noDate || loading}
              placeholder={noDate ? "날짜를 먼저 선택해주세요" : "질문을 입력하세요… (Enter로 전송, Shift+Enter 줄바꿈)"}
              rows={1}
              className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || noDate || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
