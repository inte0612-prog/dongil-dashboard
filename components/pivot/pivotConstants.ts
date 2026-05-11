// 스펙 기반 시리즈 색상 (최대 10개 항목 개별 색상)
export const SERIES_COLORS = [
  "#0A0A0A", // 1
  "#2563EB", // 2
  "#DC2626", // 3
  "#059669", // 4
  "#D97706", // 5
  "#7C3AED", // 6
  "#DB2777", // 7
  "#0891B2", // 8
  "#65A30D", // 9
  "#B45309", // 10
] as const;

export const SERIES_OTHERS = "#D4D4D4"; // 기타 그룹 색상 (회색)
export const SERIES_GHOST  = "#D4D4D4"; // Focus Mode 비선택 라인 색상

export const TOPN_OPTS   = [5, 10, 15, 20] as const;
export const SORT_OPTS   = [
  { label: "누적 총량",      value: "total"  },
  { label: "최근 3개월",    value: "recent" },
  { label: "증감률 (MoM)", value: "growth" },
] as const;
export const TREND_TABS  = ["Focus Mode", "Sparkline Grid"] as const;
