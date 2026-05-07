import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
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

export function toStartOfDay(dateStr: string): string {
  return startOfDay(new Date(dateStr)).toISOString();
}

export function toEndOfDay(dateStr: string): string {
  return endOfDay(new Date(dateStr)).toISOString();
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
