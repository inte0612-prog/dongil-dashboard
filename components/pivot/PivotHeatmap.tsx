"use client";

import { useState, useMemo } from "react";

type PivotRow = { name: string; values: number[]; total: number };

interface TooltipState {
  name:   string;
  period: string;
  value:  number;
}

interface Props {
  rows:    PivotRow[];
  periods: string[];
  metric:  string;
}

// 값 → 셀 배경색 (낮음=흰색, 높음=진한 남색)
function cellStyle(intensity: number): string {
  const lightness = Math.round((1 - intensity) * 88 + 6); // 6 ~ 94%
  return `hsl(220, 65%, ${lightness}%)`;
}

export function PivotHeatmap({ rows, periods, metric }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const top30 = rows.slice(0, 30);
  const unit  = metric === "pyung" ? "평" : "건";

  const maxVal = useMemo(
    () => Math.max(...top30.flatMap(r => r.values), 1),
    [top30],
  );

  // 스케일: 제곱근으로 중간값 시인성 향상
  const intensity = (v: number) => Math.sqrt(v / maxVal);

  const CELL_W = 32; // px
  const CELL_H = 22; // px
  const ROW_LABEL_W = 160; // px

  if (top30.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        상위 {top30.length}개 거래처 × {periods.length}개 기간 — 색상 강도 = {metric === "pyung" ? "평수" : "건수"}
      </p>

      {/* 스크롤 가능한 히트맵 */}
      <div className="overflow-auto rounded-lg border">
        <div
          className="inline-block min-w-full"
          style={{ paddingBottom: 8 }}
        >
          {/* 기간 헤더 */}
          <div
            className="flex"
            style={{ paddingLeft: ROW_LABEL_W, paddingTop: 4, marginBottom: 2 }}
          >
            {periods.map(p => (
              <div
                key={p}
                className="flex-shrink-0 text-center"
                style={{ width: CELL_W }}
              >
                <span
                  className="inline-block text-[9px] text-muted-foreground"
                  style={{
                    writingMode: "vertical-rl",
                    transform:   "rotate(180deg)",
                    lineHeight:  1,
                    height:      48,
                  }}
                >
                  {p}
                </span>
              </div>
            ))}
          </div>

          {/* 행 */}
          {top30.map(row => (
            <div
              key={row.name}
              className="flex items-center"
              style={{ height: CELL_H + 2 }}
            >
              {/* 행 레이블 */}
              <div
                className="flex-shrink-0 truncate pr-2 text-right text-[11px] font-medium text-muted-foreground"
                style={{ width: ROW_LABEL_W }}
                title={row.name}
              >
                {row.name}
              </div>

              {/* 셀들 */}
              <div className="flex gap-px">
                {row.values.map((val, pi) => (
                  <div
                    key={pi}
                    className="flex-shrink-0 cursor-pointer rounded-sm transition-transform hover:scale-110 hover:z-10 relative"
                    style={{
                      width:           CELL_W - 2,
                      height:          CELL_H,
                      backgroundColor: cellStyle(intensity(val)),
                    }}
                    onMouseEnter={() =>
                      setTooltip({ name: row.name, period: periods[pi], value: val })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 인라인 툴팁 (호버 정보 표시줄) */}
      <div className="mt-3 flex h-8 items-center rounded-md border bg-muted/40 px-4 text-xs">
        {tooltip ? (
          <>
            <span className="font-semibold text-foreground">{tooltip.name}</span>
            <span className="mx-2 text-muted-foreground">{tooltip.period}</span>
            <span className="font-medium tabular-nums text-foreground">
              {metric === "pyung"
                ? tooltip.value.toFixed(1)
                : tooltip.value.toLocaleString()}
              {unit}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">셀 위에 마우스를 올리면 값이 표시됩니다</span>
        )}
      </div>

      {/* 색상 범례 */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>낮음</span>
        <div className="flex gap-px">
          {[0, 0.14, 0.29, 0.43, 0.57, 0.71, 0.86, 1].map(t => (
            <div
              key={t}
              className="h-3 w-6 rounded-sm"
              style={{ backgroundColor: cellStyle(t) }}
            />
          ))}
        </div>
        <span>높음</span>
        <span className="ml-3 text-muted-foreground/60">
          최대값: {metric === "pyung" ? maxVal.toFixed(1) + "평" : maxVal.toLocaleString() + "건"}
        </span>
      </div>

      {rows.length > 30 && (
        <p className="mt-2 text-xs text-muted-foreground">
          상위 30개 표시 중 (전체 {rows.length}개)
        </p>
      )}
    </div>
  );
}
