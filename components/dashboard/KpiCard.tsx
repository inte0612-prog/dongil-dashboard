import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: number | null;
  className?: string;
}

export default function KpiCard({ label, value, sub, trend, className }: KpiCardProps) {
  const trendColor =
    trend == null ? "" : trend >= 0 ? "text-blue-500" : "text-red-500";
  const trendText =
    trend == null ? null : `${trend >= 0 ? "▲" : "▼"} ${Math.abs(trend).toFixed(1)}%`;

  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        {trendText && (
          <span className={cn("text-xs font-medium", trendColor)}>{trendText} 전기 대비</span>
        )}
      </div>
    </div>
  );
}
