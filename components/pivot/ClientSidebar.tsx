"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Pin } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { SERIES_COLORS } from "./pivotConstants";

interface SidebarItem {
  name: string;
  total: number;
}

interface Props {
  items: SidebarItem[];
  selected: string[];
  onToggle: (name: string) => void;
  onClear: () => void;
  metric: string;
}

export function ClientSidebar({ items, selected, onToggle, onClear, metric }: Props) {
  const [query, setQuery]       = useState("");
  const [sortBy, setSortBy]     = useState<"total" | "name">("total");
  const [topOnly, setTopOnly]   = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);
  const debouncedQuery          = useDebounce(query, 200);

  // 키보드: / 로 검색창 포커스
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const maxTotal = useMemo(() => Math.max(...items.map(i => i.total), 1), [items]);

  const filtered = useMemo(() => {
    let list = topOnly ? items.slice(0, 10) : items;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q));
    }

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }

    // 선택 항목 상단 고정
    const pinned = list.filter(i => selected.includes(i.name));
    const rest   = list.filter(i => !selected.includes(i.name));
    return [...pinned, ...rest];
  }, [items, selected, debouncedQuery, sortBy, topOnly]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 헤더 */}
      <div className="border-b p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">
            거래처 선택
            <span className="ml-1 text-muted-foreground font-normal">(최대 5개)</span>
          </span>
          {selected.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              전체 해제
            </button>
          )}
        </div>

        {/* 선택된 항목 칩 */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selected.map((name, i) => (
              <button
                key={name}
                onClick={() => onToggle(name)}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
              >
                <span className="max-w-[80px] truncate">{name}</span>
                <X className="h-2.5 w-2.5 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="거래처 검색… (/)"
            className="w-full rounded-md border bg-background py-1.5 pl-7 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* 컨트롤 */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={topOnly}
              onChange={e => setTopOnly(e.target.checked)}
              className="h-3 w-3 accent-primary"
            />
            Top 10만
          </label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "total" | "name")}
            className="rounded border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="total">총량순</option>
            <option value="name">이름순</option>
          </select>
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            검색 결과 없음
          </div>
        ) : (
          filtered.map(item => {
            const isSelected  = selected.includes(item.name);
            const colorIdx    = selected.indexOf(item.name);
            const isPinned    = isSelected;
            const barWidth    = (item.total / maxTotal) * 100;
            const isDisabled  = !isSelected && selected.length >= 5;

            return (
              <button
                key={item.name}
                onClick={() => !isDisabled && onToggle(item.name)}
                disabled={isDisabled}
                className={[
                  "relative w-full border-b px-3 py-2 text-left transition-colors last:border-0",
                  isSelected  ? "bg-muted/60"         : "hover:bg-muted/30",
                  isDisabled  ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                ].join(" ")}
              >
                {isPinned && (
                  <Pin className="absolute right-2 top-2 h-2.5 w-2.5 text-muted-foreground/60" />
                )}

                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-sm border transition-colors"
                    style={{
                      backgroundColor: isSelected ? SERIES_COLORS[colorIdx] : "transparent",
                      borderColor:     isSelected ? SERIES_COLORS[colorIdx] : "#D4D4D4",
                    }}
                  />
                  <span className="flex-1 truncate text-[11px] font-medium leading-tight">
                    {item.name}
                  </span>
                  <span className="flex-shrink-0 tabular-nums text-[11px] text-muted-foreground">
                    {metric === "pyung"
                      ? item.total.toFixed(1)
                      : item.total.toLocaleString()}
                  </span>
                </div>

                {/* 미니 막대 */}
                <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width:           `${barWidth}%`,
                      backgroundColor: isSelected ? SERIES_COLORS[colorIdx] : "#D4D4D4",
                    }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 푸터 */}
      <div className="border-t px-3 py-2 text-center text-[11px] text-muted-foreground">
        전체 <span className="font-medium text-foreground">{items.length}</span>개 ·
        선택 <span className="font-medium text-foreground">{selected.length}</span>/5
      </div>
    </div>
  );
}
