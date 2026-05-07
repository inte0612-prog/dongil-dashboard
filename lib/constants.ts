export const LINE_COLORS = {
  "1-LINE": "#3b82f6",
  "2-LINE": "#22c55e",
  전체: "#8b5cf6",
} as const;

export const LINE_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "1-LINE", value: "1-LINE" },
  { label: "2-LINE", value: "2-LINE" },
] as const;

export const TREND_UNITS = [
  { label: "일별", value: "day" },
  { label: "주별", value: "week" },
  { label: "월별", value: "month" },
] as const;

export const ITEM_LIMIT_OPTIONS = [
  { label: "상위 10개", value: 10 },
  { label: "상위 20개", value: 20 },
  { label: "상위 50개", value: 50 },
] as const;

export const SIZE_CLASS = {
  소형: { label: "소형 (10평 미만)", color: "#93c5fd" },
  중형: { label: "중형 (10~30평)", color: "#3b82f6" },
  대형: { label: "대형 (30평 이상)", color: "#1d4ed8" },
} as const;

export const NAV_MENUS = [
  { label: "대시보드 홈", href: "/dashboard",        icon: "LayoutDashboard" },
  { label: "다차원 분석", href: "/dashboard/pivot",  icon: "BarChart2" },
  { label: "데이터 탐색", href: "/dashboard/records", icon: "Table" },
  { label: "데이터 임포트", href: "/dashboard/import", icon: "Upload" },
  { label: "목표 설정",   href: "/dashboard/goals",  icon: "Target" },
  { label: "AI 분석",     href: "/dashboard/ai",     icon: "Sparkles" },
] as const;

export const DEFAULT_PAGE_SIZE = 50;
export const ANOMALY_THRESHOLD = 0.3;
export const SCATTER_SAMPLE_SIZE = 5000;
