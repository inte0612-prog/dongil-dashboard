"use client";

import { useState, useRef, useEffect } from "react";
import {
  format, addMonths, subMonths,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, parseISO,
} from "date-fns";
import { CalendarDays } from "lucide-react";

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function DateRangePicker({ start, end, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [leftMonth, setLeftMonth] = useState<Date>(() => {
    try { return startOfMonth(parseISO(start)); } catch { return startOfMonth(new Date()); }
  });
  const [selecting, setSelecting] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const rightMonth = addMonths(leftMonth, 1);

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

  const rangeStart: string = selecting
    ? [selecting, hovered ?? selecting].sort()[0]
    : start;
  const rangeEnd: string = selecting
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); setSelecting(null); setHovered(null); }}
        className="flex h-8 items-center gap-2 rounded-md border bg-background px-3 text-xs text-foreground transition-colors hover:bg-accent"
      >
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        {start} ~ {end}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-max rounded-xl border bg-background p-5 shadow-2xl">
          {/* 달력 두 개 나란히 */}
          <div className="flex gap-8">
            <MonthView
              month={leftMonth}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              isSelecting={!!selecting}
              onDayClick={handleDayClick}
              onDayHover={(d) => selecting && setHovered(d)}
              onMonthSelect={() => handleMonthSelect(leftMonth)}
            />
            <MonthView
              month={rightMonth}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              isSelecting={!!selecting}
              onDayClick={handleDayClick}
              onDayHover={(d) => selecting && setHovered(d)}
              onMonthSelect={() => handleMonthSelect(rightMonth)}
            />
          </div>

          {/* 이전 / 다음 월 이동 */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <button
              onClick={() => setLeftMonth((d) => subMonths(d, 1))}
              className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
            >
              ◀ 이전
            </button>
            {selecting ? (
              <span className="text-xs text-muted-foreground">종료일을 선택하세요</span>
            ) : (
              <button
                onClick={() => { setSelecting(null); setHovered(null); setOpen(false); }}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                닫기
              </button>
            )}
            <button
              onClick={() => setLeftMonth((d) => addMonths(d, 1))}
              className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
            >
              다음 ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthView({
  month,
  rangeStart,
  rangeEnd,
  isSelecting,
  onDayClick,
  onDayHover,
  onMonthSelect,
}: {
  month: Date;
  rangeStart: string;
  rangeEnd: string;
  isSelecting: boolean;
  onDayClick: (d: string) => void;
  onDayHover: (d: string) => void;
  onMonthSelect: () => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd   = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="w-52">
      {/* 월 헤더 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{format(month, "yyyy년 M월")}</span>
        <button
          onClick={onMonthSelect}
          className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
        >
          이 달 전체
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-1 text-center text-[11px] font-medium
              ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const isStart = dayStr === rangeStart;
          const isEnd   = dayStr === rangeEnd;
          const inRange = dayStr > rangeStart && dayStr < rangeEnd;
          const dow = day.getDay();

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
