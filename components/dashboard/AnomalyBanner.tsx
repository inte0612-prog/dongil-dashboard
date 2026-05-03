"use client";

import { useEffect, useState } from "react";
import { AnomalyPoint } from "@/types";
import { AlertTriangle } from "lucide-react";
import { formatPercent } from "@/lib/utils/numberUtils";

interface AnomalyBannerProps {
  start: string;
  end: string;
  line: string;
}

export default function AnomalyBanner({ start, end, line }: AnomalyBannerProps) {
  const [anomalies, setAnomalies] = useState<AnomalyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/anomaly?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setAnomalies(d.anomalies ?? []))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  if (loading || anomalies.length === 0) return null;

  const recent = anomalies.slice(-3).reverse();

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-semibold">
          이상 탐지 — 기간 내 {anomalies.length}건 감지
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {recent.map((a) => (
          <li key={a.date} className="text-xs text-amber-700 dark:text-amber-400">
            <span className="font-medium">{a.date}</span>
            &nbsp;실적 {a.actual.toLocaleString()}건 (이동평균 대비{" "}
            <span className={a.deviationRate > 0 ? "text-blue-600" : "text-red-600"}>
              {formatPercent(a.deviationRate * 100)}
            </span>
            )
          </li>
        ))}
        {anomalies.length > 3 && (
          <li className="text-xs text-amber-600">외 {anomalies.length - 3}건 더...</li>
        )}
      </ul>
    </div>
  );
}
