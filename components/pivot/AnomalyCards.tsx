"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SERIES_COLORS } from "./pivotConstants";

type PivotRow = { name: string; values: number[]; total: number };

interface ChangeItem {
  name:       string;
  recent:     number; // 최근 3개월 평균
  prior:      number; // 직전 3개월 평균
  changeRate: number; // (recent - prior) / prior
}

interface Props {
  rows:     PivotRow[];
  periods:  string[];
  metric:   string;
  onSelect: (name: string) => void;
  selected: string[];
}

function computeChanges(rows: PivotRow[]): ChangeItem[] {
  return rows
    .map(row => {
      const n      = row.values.length;
      if (n < 2) return null;
      const slice  = Math.min(3, Math.floor(n / 2));
      const recent = row.values.slice(-slice).reduce((a, b) => a + b, 0) / slice;
      const prior  = row.values.slice(-slice * 2, -slice).reduce((a, b) => a + b, 0) / slice;
      if (prior === 0 && recent === 0) return null;
      const changeRate = prior > 0 ? (recent - prior) / prior : (recent > 0 ? 1 : 0);
      return { name: row.name, recent, prior, changeRate };
    })
    .filter((c): c is ChangeItem => c !== null);
}

function ChangeCard({
  item,
  isSelected,
  colorIdx,
  onClick,
  unit,
  isRising,
}: {
  item:       ChangeItem;
  isSelected: boolean;
  colorIdx:   number;
  onClick:    () => void;
  unit:       string;
  isRising:   boolean;
}) {
  const pct   = (Math.abs(item.changeRate) * 100).toFixed(1);
  const color = isRising ? "#059669" : "#DC2626";

  return (
    <button
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm",
        isSelected ? "border-primary/40 bg-muted/60 shadow-sm" : "bg-background hover:border-border/80",
      ].join(" ")}
    >
      {/* 색상 인디케이터 */}
      <div
        className="h-8 w-1 flex-shrink-0 rounded-full"
        style={{ backgroundColor: isSelected ? SERIES_COLORS[colorIdx] : color }}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{item.name}</p>
        <p className="mt-0.5 tabular-nums text-[11px] text-muted-foreground">
          {item.prior.toFixed(0)} → {item.recent.toFixed(0)}{unit}/기간
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {isRising ? "+" : ""}{(item.changeRate * 100).toFixed(1)}%
        </span>
      </div>
    </button>
  );
}

export function AnomalyCards({ rows, periods, metric, onSelect, selected }: Props) {
  const unit    = metric === "pyung" ? "평" : "건";
  const changes = useMemo(() => computeChanges(rows), [rows]);
  const surging = useMemo(
    () => [...changes].filter(c => c.changeRate > 0).sort((a, b) => b.changeRate - a.changeRate).slice(0, 5),
    [changes],
  );
  const dropping = useMemo(
    () => [...changes].filter(c => c.changeRate < 0).sort((a, b) => a.changeRate - b.changeRate).slice(0, 5),
    [changes],
  );

  if (surging.length === 0 && dropping.length === 0) return null;

  const periodNote = periods.length >= 6
    ? `최근 ${Math.min(3, Math.floor(periods.length / 2))}개 기간 vs 직전`
    : "기간 데이터 부족";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 급증 */}
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold">급증 Top {surging.length}</span>
          <span className="ml-auto text-[11px] text-muted-foreground">{periodNote}</span>
        </div>
        <div className="space-y-2">
          {surging.map(c => (
            <ChangeCard
              key={c.name}
              item={c}
              isSelected={selected.includes(c.name)}
              colorIdx={selected.indexOf(c.name)}
              onClick={() => onSelect(c.name)}
              unit={unit}
              isRising={true}
            />
          ))}
        </div>
      </div>

      {/* 급감 */}
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-semibold">급감 Top {dropping.length}</span>
          <span className="ml-auto text-[11px] text-muted-foreground">{periodNote}</span>
        </div>
        <div className="space-y-2">
          {dropping.map(c => (
            <ChangeCard
              key={c.name}
              item={c}
              isSelected={selected.includes(c.name)}
              colorIdx={selected.indexOf(c.name)}
              onClick={() => onSelect(c.name)}
              unit={unit}
              isRising={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
