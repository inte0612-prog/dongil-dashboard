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
  { label: "대시보드 홈", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "생산 추이", href: "/dashboard/trend", icon: "TrendingUp" },
  { label: "품목 분석", href: "/dashboard/items", icon: "Package" },
  { label: "거래처 / 현장", href: "/dashboard/clients", icon: "Building2" },
  { label: "등록자 / 라인", href: "/dashboard/registrars", icon: "Users" },
  { label: "시간대 패턴", href: "/dashboard/heatmap", icon: "Clock" },
  { label: "유리 사양 분석", href: "/dashboard/spec", icon: "Layers" },
  { label: "치수 분포", href: "/dashboard/dimensions", icon: "Ruler" },
  { label: "수주 추적", href: "/dashboard/orders", icon: "ClipboardList" },
  { label: "거래처 × 사양", href: "/dashboard/client-spec", icon: "Grid" },
  { label: "데이터 탐색", href: "/dashboard/records", icon: "Table" },
  { label: "다차원 분석", href: "/dashboard/pivot", icon: "BarChart2" },
  { label: "데이터 임포트", href: "/dashboard/import", icon: "Upload" },
  { label: "목표 설정", href: "/dashboard/goals", icon: "Target" },
] as const;

export const DEFAULT_PAGE_SIZE = 50;
export const ANOMALY_THRESHOLD = 0.3;
export const SCATTER_SAMPLE_SIZE = 5000;
