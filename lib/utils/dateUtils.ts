import { format, subMonths, subYears, startOfDay, endOfDay } from "date-fns";

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
  return [
    { label: "3개월", start: formatDate(subMonths(today, 3)), end: formatDate(today) },
    { label: "1년", start: formatDate(subYears(today, 1)), end: formatDate(today) },
    { label: "3년", start: formatDate(subYears(today, 3)), end: formatDate(today) },
    { label: "전체", start: "2020-01-01", end: formatDate(today) },
  ] as const;
}

export function toStartOfDay(dateStr: string): string {
  return startOfDay(new Date(dateStr)).toISOString();
}

export function toEndOfDay(dateStr: string): string {
  return endOfDay(new Date(dateStr)).toISOString();
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
