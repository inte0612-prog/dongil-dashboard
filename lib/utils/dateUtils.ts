import { format, subMonths, startOfDay, endOfDay } from "date-fns";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd HH:mm");
}

export function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = subMonths(end, 3);
  return { start: formatDate(start), end: formatDate(end) };
}

export function toStartOfDay(dateStr: string): string {
  return startOfDay(new Date(dateStr)).toISOString();
}

export function toEndOfDay(dateStr: string): string {
  return endOfDay(new Date(dateStr)).toISOString();
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
