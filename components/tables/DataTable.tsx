"use client";

import { RecordRow, SortOrder } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Column {
  key: keyof RecordRow;
  label: string;
  align?: "left" | "right";
}

const COLUMNS: Column[] = [
  { key: "registered_at", label: "등록일시" },
  { key: "line", label: "라인" },
  { key: "item_name", label: "품명" },
  { key: "width", label: "너비", align: "right" },
  { key: "height", label: "높이", align: "right" },
  { key: "pyung", label: "평수", align: "right" },
  { key: "order_no", label: "의뢰번호" },
  { key: "client", label: "거래처" },
  { key: "site", label: "현장" },
  { key: "registrar", label: "등록자" },
];

interface DataTableProps {
  data: RecordRow[];
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (key: string) => void;
}

export default function DataTable({ data, sortBy, sortOrder, onSort }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "cursor-pointer select-none whitespace-nowrap px-4 py-2.5 font-medium hover:text-foreground",
                  col.align === "right" ? "text-right" : "text-left"
                )}
                onClick={() => onSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortBy === col.key &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                {row.registered_at.slice(0, 16).replace("T", " ")}
              </td>
              <td className="px-4 py-2">{row.line}</td>
              <td className="max-w-[200px] truncate px-4 py-2">{row.item_name}</td>
              <td className="px-4 py-2 text-right">{row.width}</td>
              <td className="px-4 py-2 text-right">{row.height}</td>
              <td className="px-4 py-2 text-right">{row.pyung?.toFixed(2)}</td>
              <td className="px-4 py-2">{row.order_no}</td>
              <td className="max-w-[120px] truncate px-4 py-2">{row.client}</td>
              <td className="max-w-[120px] truncate px-4 py-2">{row.site}</td>
              <td className="px-4 py-2">{row.registrar}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
