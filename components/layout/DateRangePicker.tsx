"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  format, addMonths, subMonths,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, parseISO, isValid,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function isValidDateStr(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return isValid(parseISO(s));
}

export default function DateRangePicker({ start, end, onChange }: Props) {
  const [open,      setOpen]      = useState(false);
  const [leftMonth, setLeftMonth] = useState<Date>(() => {
    try { return startOfMonth(parseISO(start)); } catch { return startOfMonth(new Date()); }
  });
  const [selecting, setSelecting] = useState<string | null>(null);
  const [hovered,   setHovered]   = useState<string | null>(null);

  // 수기 입력 상태
  const [startInput, setStartInput] = useState(start);
  const [endInput,   setEndInput]   = useState(end);

  const ref = useRef<HTMLDivElement>(null);

  // 팝업 바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setSelecting(null);
        setHovered(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // 외부 start/end 변경 시 입력창 동기화
  useEffect(() => { setStartInput(start); }, [start]);
  useEffect(() => { setEndInput(end);     }, [end]);

  const rightMonth = addMonths(leftMonth, 1);

  const rangeStart = selecting
    ? [selecting, hovered ?? selecting].sort()[0]
    : start;
  const rangeEnd = selecting
    ? [selecting, hovered ?? selecting].sort()[1]
    : end;

  const handleDayClick = (dayStr: string) => {
    if (!selecting) {
      setSelecting(dayStr);
    } else {
      const a = selecting <= dayStr ? selecting : dayStr;
      const b = selecting <= dayStr ? dayStr : selecting;
      onChange(a, b);
      setSelecting(null);
      setHovered(null);
      setOpen(false);
    }
  };

  const handleMonthSelect = (month: Date) => {
    const s = format(startOfMonth(month), "yyyy-MM-dd");
    const e = format(endOfMonth(month), "yyyy-MM-dd");
    onChange(s, e);
    setSelecting(null);
    setHovered(null);
    setOpen(false);
  };

  // 수기 입력 → 적용
  const applyTextInput = useCallback(() => {
    const s = startInput.trim();
    const e = endInput.trim();
    if (isValidDateStr(s) && isValidDateStr(e) && s <= e) {
      onChange(s, e);
      setLeftMonth(startOfMonth(parseISO(s)));
      setOpen(false);
      setSelecting(null);
    }
  }, [startInput, endInput, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") applyTextInput();
  };

  const close = () => {
    setOpen(false);
    setSelecting(null);
    setHovered(null);
    // 입력창 원복
    setStartInput(start);
    setEndInput(end);
  };

  return (
    <div ref={ref} className="relative">
      {/* 트리거 버튼 */}
      <button
        onClick={() => { setOpen(v => !v); setSelecting(null); setHovered(null); }}
        className="flex h-8 items-center gap-2 rounded-md border bg-background px-3 text-xs text-foreground transition-colors hover:bg-accent"
      >
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        {start} ~ {end}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 rounded-xl border bg-background shadow-2xl"
          style={{ minWidth: 520 }}>

          {/* ── 상단: 수기 입력 ── */}
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <span className="text-xs text-muted-foreground">시작일</span>
            <input
              type="text"
              value={startInput}
              onChange={e => setStartInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              className={[
                "w-28 rounded-md border px-2 py-1 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring",
                isValidDateStr(startInput) ? "" : "border-rose-400 bg-rose-50",
              ].join(" ")}
            />
            <span className="text-xs text-muted-foreground">~</span>
            <input
              type="text"
              value={endInput}
              onChange={e => setEndInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              className={[
                "w-28 rounded-md border px-2 py-1 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring",
                isValidDateStr(endInput) ? "" : "border-rose-400 bg-rose-50",
              ].join(" ")}
            />
            <button
              onClick={applyTextInput}
              disabled={
                !isValidDateStr(startInput) ||
                !isValidDateStr(endInput) ||
                startInput > endInput
              }
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
            >
              적용
            </button>
            <div className="ml-auto">
              {selecting ? (
                <span className="text-xs text-muted-foreground">종료일을 선택하세요</span>
              ) : (
                <button onClick={close} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── 달력 영역 ── */}
          <div className="px-5 pb-5 pt-4">
            {/* 화살표 + 달력 헤더 한 줄 고정 */}
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setLeftMonth(d => subMonths(d, 1))}
                className="flex-shrink-0 rounded-md border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex flex-1 gap-4">
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm font-semibold">{format(leftMonth, "yyyy년 M월")}</span>
                  <button
                    onClick={() => handleMonthSelect(leftMonth)}
                    className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    이 달 전체
                  </button>
                </div>
                <div className="w-px bg-border" />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm font-semibold">{format(rightMonth, "yyyy년 M월")}</span>
                  <button
                    onClick={() => handleMonthSelect(rightMonth)}
                    className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    이 달 전체
                  </button>
                </div>
              </div>

              <button
                onClick={() => setLeftMonth(d => addMonths(d, 1))}
                className="flex-shrink-0 rounded-md border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 두 달 달력 그리드 (헤더 제외) */}
            <div className="flex gap-4">
              <MonthView
                month={leftMonth}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                isSelecting={!!selecting}
                onDayClick={handleDayClick}
                onDayHover={d => selecting && setHovered(d)}
              />
              <div className="w-px bg-border" />
              <MonthView
                month={rightMonth}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                isSelecting={!!selecting}
                onDayClick={handleDayClick}
                onDayHover={d => selecting && setHovered(d)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthView({
  month, rangeStart, rangeEnd, isSelecting,
  onDayClick, onDayHover,
}: {
  month:       Date;
  rangeStart:  string;
  rangeEnd:    string;
  isSelecting: boolean;
  onDayClick:  (d: string) => void;
  onDayHover:  (d: string) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd   = endOfWeek(endOfMonth(month),     { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="w-52 flex-shrink-0">
      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-1 text-center text-[11px] font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {days.map(day => {
          const dayStr  = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const isStart = dayStr === rangeStart;
          const isEnd   = dayStr === rangeEnd;
          const inRange = dayStr > rangeStart && dayStr < rangeEnd;
          const dow     = day.getDay();

          return (
            <div
              key={dayStr}
              onClick={() => inMonth && onDayClick(dayStr)}
              onMouseEnter={() => inMonth && onDayHover(dayStr)}
              className={[
                "flex cursor-pointer select-none items-center justify-center py-[5px] text-xs transition-colors",
                !inMonth && "pointer-events-none opacity-20",
                (isStart || isEnd) && "rounded-md bg-primary font-semibold text-primary-foreground",
                inRange && !isStart && !isEnd && "bg-primary/15",
                inMonth && !isStart && !isEnd && "hover:rounded-md hover:bg-accent",
                dow === 0 && !isStart && !isEnd && inMonth && "text-red-500",
                dow === 6 && !isStart && !isEnd && inMonth && "text-blue-500",
              ].filter(Boolean).join(" ")}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
