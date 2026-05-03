"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import { ClientData, SiteData } from "@/types";
import { ITEM_LIMIT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function ClientsContent() {
  const { start, end, line } = useFilter();
  const [limit, setLimit] = useState(10);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients?start=${start}&end=${end}&line=${line}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setClients(d.clients ?? []);
        setSites(d.sites ?? []);
      })
      .finally(() => setLoading(false));
  }, [start, end, line, limit]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex rounded-md border bg-background">
          {ITEM_LIMIT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLimit(opt.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md",
                limit === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="거래처별 생산 건수" loading={loading}>
          <HorizontalBarChart
            data={clients.map((d) => ({ label: d.client, value: d.count }))}
            color="#3b82f6"
            formatter={(v) => v.toLocaleString() + "건"}
          />
        </Section>

        <Section title="현장별 생산 건수" loading={loading}>
          <HorizontalBarChart
            data={sites.map((d) => ({ label: d.site, value: d.count }))}
            color="#22c55e"
            formatter={(v) => v.toLocaleString() + "건"}
          />
        </Section>
      </div>

      {!loading && clients.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">거래처</th>
                <th className="px-4 py-2.5 text-right">건수</th>
                <th className="px-4 py-2.5 text-right">총 평수</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((d, i) => (
                <tr key={d.client} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{d.client}</td>
                  <td className="px-4 py-2 text-right">{d.count.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{d.totalPyung.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : (
        children
      )}
    </div>
  );
}
