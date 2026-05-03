"use client";

import { useFilter } from "@/hooks/useFilter";
import KpiGrid from "@/components/dashboard/KpiGrid";
import AnomalyBanner from "@/components/dashboard/AnomalyBanner";

export default function DashboardHome() {
  const { start, end, line } = useFilter();

  return (
    <div className="space-y-5">
      <AnomalyBanner start={start} end={end} line={line} />
      <KpiGrid start={start} end={end} line={line} />
    </div>
  );
}
