import { format, subDays, subMonths, subYears } from "date-fns";

// Date 객체 → 로컬 날짜 문자열 (UI 표시용)
// UTC 문자열 입력 → UTC 날짜 prefix 슬라이스
export function formatDate(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd HH:mm");
}

export function getDefaultDateRange(): { start: string; end: string } {
  return { start: "2020-01-01", end: formatDate(new Date()) };
}

export function getPresetRanges() {
  const today = new Date();
  const end = formatDate(today);
  return [
    { label: "7일",   start: formatDate(subDays(today, 7)),    end },
    { label: "30일",  start: formatDate(subDays(today, 30)),   end },
    { label: "3개월", start: formatDate(subMonths(today, 3)),  end },
    { label: "6개월", start: formatDate(subMonths(today, 6)),  end },
    { label: "1년",   start: formatDate(subYears(today, 1)),   end },
    { label: "전체",  start: "2020-01-01",                     end },
  ];
}

// UTC 기반 순수 문자열 처리 — date-fns 로컬 타임존 혼용 금지
export function toStartOfDay(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

export function toEndOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

// start~end(inclusive) 사이 모든 UTC 날짜 배열 생성
export function genDays(start: string, end: string): string[] {
  const days: string[] = [];
  const startMs = Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10));
  const endMs   = Date.UTC(+end.slice(0, 4),   +end.slice(5, 7) - 1,   +end.slice(8, 10));
  for (let ms = startMs; ms <= endMs; ms += 86_400_000) {
    const d = new Date(ms);
    days.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
    );
  }
  return days;
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
