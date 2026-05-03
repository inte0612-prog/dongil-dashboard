export interface KpiData {
  totalCount: number;
  totalPyung: number;
  avgDailyPyung: number;
  line1Ratio: number;
  line2Ratio: number;
  momChange: number | null;
}

export interface TrendDataPoint {
  period: string;
  count: number;
  pyung: number;
  line1Count?: number;
  line2Count?: number;
  line1Pyung?: number;
  line2Pyung?: number;
}

export interface ItemData {
  itemCode: string;
  itemName: string;
  count: number;
  totalPyung: number;
  avgPyung: number;
}

export interface ClientData {
  client: string;
  count: number;
  totalPyung: number;
}

export interface SiteData {
  site: string;
  count: number;
}

export interface RegistrarData {
  registrar: string;
  line: string;
  count: number;
  totalPyung: number;
}

export interface HeatmapDataPoint {
  hour: number;
  weekday: number;
  count: number;
}

export interface SpecData {
  coating: { name: string; count: number }[];
  gap: { name: string; count: number }[];
  argon: { yes: number; no: number };
}

export interface DimensionScatterPoint {
  width: number;
  height: number;
  pyung: number;
}

export interface SizeClassData {
  소형: number;
  중형: number;
  대형: number;
}

export interface TopDimension {
  width: number;
  height: number;
  count: number;
}

export interface OrderData {
  orderNo: string;
  count: number;
  totalPyung: number;
  firstDate: string;
  lastDate: string;
  leadDays: number;
}

export interface ClientSpecData {
  client: string;
  coating: string;
  count: number;
}

export interface AnomalyPoint {
  date: string;
  actual: number;
  movingAvg: number;
  deviationRate: number;
}

export interface RecordRow {
  id: number;
  registered_at: string;
  pid: string;
  process: string;
  item_code: string;
  item_name: string;
  width: number;
  height: number;
  quantity: number;
  pyung: number;
  order_no: string;
  seq_no: number;
  client: string;
  site: string;
  line: string;
  registrar: string;
  remark: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type TrendUnit = "day" | "week" | "month";
export type LineFilter = "all" | "1-LINE" | "2-LINE";
export type SortOrder = "asc" | "desc";
