"use client";

import { useFilter } from "@/hooks/useFilter";
import KpiGrid from "@/components/dashboard/KpiGrid";
import DashboardTrend from "@/components/dashboard/DashboardTrend";
import DashboardTop from "@/components/dashboard/DashboardTop";
import DashboardYoy from "@/components/dashboard/DashboardYoy";
import DashboardConcentration from "@/components/dashboard/DashboardConcentration";

export default function DashboardHome() {
  const { start, end, line } = useFilter();

  return (
    <div className="space-y-8">
      <KpiGrid start={start} end={end} line={line} />
      <DashboardTrend start={start} end={end} line={line} />
      <DashboardTop start={start} end={end} line={line} />
      <DashboardYoy start={start} end={end} line={line} />
      <DashboardConcentration start={start} end={end} line={line} />
    </div>
  );
}
