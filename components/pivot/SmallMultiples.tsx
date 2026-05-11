"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SERIES_COLORS } from "./pivotConstants";

type PivotRow = { name: string; values: number[]; total: number };

interface Props {
  rows:     PivotRow[];
  periods:  string[];
  metric:   string;
  onSelect: (name: string) => void;
  selected: string[];
}

function buildPath(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const nonZero = values.filter(v => v > 0);
  const max     = nonZero.length > 0 ? Math.max(...nonZero) : 1;
  const min     = Math.min(...values, 0);
  const range   = max - min || 1;

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h * 0.85 - h * 0.05;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

interface SparkCardProps {
  row:        PivotRow;
  metric:     string;
  isSelected: boolean;
  colorIdx:   number;
  isDisabled: boolean;
  onSelect:   () => void;
}

function SparkCard({ row, metric, isSelected, colorIdx, isDisabled, onSelect }: SparkCardProps) {
  const lastVal = row.values[row.values.length - 1] ?? 0;
  const prevVal = row.values[row.values.length - 2] ?? 0;
  const mom     = prevVal > 0 ? (lastVal - prevVal) / prevVal : 0;
  const lineColor = isSelected ? SERIES_COLORS[colorIdx] : "#94A3B8";
  const path    = useMemo(() => buildPath(row.values, 100, 28), [row.values]);

  const momColor = mom > 0.005
    ? "text-emerald-600"
    : mom < -0.005
    ? "text-rose-600"
    : "text-muted-foreground";

  const MomIcon = mom > 0.005 ? TrendingUp : mom < -0.005 ? TrendingDown : Minus;

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={[
        "group rounded-lg border p-3 text-left transition-all",
        isSelected
          ? "border-primary/50 bg-muted/50 shadow-sm ring-1 ring-primary/20"
          : "bg-background hover:border-border/80 hover:shadow-sm",
        isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      {/* 거래처명 */}
      <p
        className="truncate text-[11px] font-semibold leading-tight"
        title={row.name}
      >
        {row.name}
      </p>

      {/* 최근값 */}
      <p className="mt-1 font-bold tabular-nums text-base leading-none">
        {metric === "pyung" ? lastVal.toFixed(1) : lastVal.toLocaleString()}
        <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
          {metric === "pyung" ? "평" : "건"}
        </span>
      </p>

      {/* 스파크라인 */}
      <div className="my-2 w-full">
        <svg
          viewBox="0 0 100 28"
          className="h-7 w-full"
          preserveAspectRatio="none"
        >
          {path && (
            <path
              d={path}
              fill="none"
              stroke={lineColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      {/* MoM 변화율 */}
      <div className={`flex items-center gap-1 text-[11px] font-medium tabular-nums ${momColor}`}>
        <MomIcon className="h-3 w-3 flex-shrink-0" />
        {Math.abs(mom) > 0.001
          ? `${mom > 0 ? "+" : ""}${(mom * 100).toFixed(1)}%`
          : "변동 없음"}
      </div>
    </button>
  );
}

export function SmallMultiples({ rows, periods, metric, onSelect, selected }: Props) {
  const display = rows.slice(0, 20); // 4×5 grid = 20개

  if (display.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        상위 {display.length}개 — 클릭하면 Focus Mode에서 강조됩니다 (최대 5개)
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {display.map(row => {
          const isSelected = selected.includes(row.name);
          const colorIdx   = selected.indexOf(row.name);
          const isDisabled = !isSelected && selected.length >= 5;
          return (
            <SparkCard
              key={row.name}
              row={row}
              metric={metric}
              isSelected={isSelected}
              colorIdx={colorIdx}
              isDisabled={isDisabled}
              onSelect={() => onSelect(row.name)}
            />
          );
        })}
      </div>
      {rows.length > 20 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          상위 20개 표시 중 (전체 {rows.length}개)
        </p>
      )}
    </div>
  );
}
