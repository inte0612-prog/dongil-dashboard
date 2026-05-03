"use client";

import { useEffect, useState } from "react";
import { useFilter } from "@/hooks/useFilter";
import { ClientSpecData } from "@/types";

const COATING_COLORS: Record<string, string> = {
  로이: "#3b82f6",
  CL: "#22c55e",
  "CL에칭": "#06b6d4",
  GN: "#f59e0b",
  에칭: "#8b5cf6",
  ML: "#ec4899",
  PLT: "#ef4444",
  XTN: "#f97316",
  투명: "#84cc16",
  기타: "#94a3b8",
};

export default function ClientSpecContent() {
  const { start, end, line } = useFilter();
  const [data, setData] = useState<ClientSpecData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/client-spec?start=${start}&end=${end}&line=${line}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [start, end, line]);

  const clients = [...new Set(data.map((d) => d.client))];
  const coatings = [...new Set(data.map((d) => d.coating))];

  const getCount = (client: string, coating: string) =>
    data.find((d) => d.client === client && d.coating === coating)?.count ?? 0;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="h-80 animate-pulse rounded-xl border bg-muted" />
      ) : data.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">데이터 없음</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <th className="px-4 py-2.5 text-left">거래처 \ 코팅</th>
                {coatings.map((c) => (
                  <th key={c} className="px-3 py-2.5 text-center">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{client}</td>
                  {coatings.map((coating) => {
                    const count = getCount(client, coating);
                    const intensity = count / maxCount;
                    const color = COATING_COLORS[coating] ?? "#94a3b8";
                    return (
                      <td key={coating} className="px-3 py-2 text-center">
                        {count > 0 ? (
                          <span
                            className="inline-block rounded px-1.5 py-0.5 font-medium text-white"
                            style={{
                              backgroundColor: color,
                              opacity: 0.3 + intensity * 0.7,
                            }}
                          >
                            {count.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
