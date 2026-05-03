"use client";

import { useEffect, useState, useCallback } from "react";
import { useFilter } from "@/hooks/useFilter";
import { useDebounce } from "@/hooks/useDebounce";
import DataTable from "@/components/tables/DataTable";
import { RecordRow, PaginatedResponse, SortOrder } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Download, Search } from "lucide-react";

export default function RecordsContent() {
  const { start, end, line } = useFilter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("registered_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [result, setResult] = useState<PaginatedResponse<RecordRow> | null>(null);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      start, end, line,
      page: String(page),
      pageSize: String(DEFAULT_PAGE_SIZE),
      sortBy, sortOrder,
      search: debouncedSearch,
    });
    fetch(`/api/records?${params}`)
      .then((r) => r.json())
      .then((d) => setResult(d))
      .finally(() => setLoading(false));
  }, [start, end, line, page, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [start, end, line, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const totalPages = result ? Math.ceil(result.total / DEFAULT_PAGE_SIZE) : 1;

  const exportUrl = () => {
    const params = new URLSearchParams({ start, end, line, search: debouncedSearch });
    return `/api/export?${params}`;
  };

  return (
    <div className="space-y-4">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="품명 / 거래처 검색"
            className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <a
          href={exportUrl()}
          download
          className="flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          CSV 다운로드
        </a>

        {result && (
          <span className="ml-auto text-xs text-muted-foreground">
            총 {result.total.toLocaleString()}건
          </span>
        )}
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="h-96 animate-pulse rounded-xl border bg-muted" />
      ) : result && result.data.length > 0 ? (
        <DataTable
          data={result.data}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      ) : (
        <p className="py-20 text-center text-sm text-muted-foreground">데이터 없음</p>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-7 rounded-md border bg-background px-3 text-xs disabled:opacity-40 hover:bg-accent"
          >
            이전
          </button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-7 rounded-md border bg-background px-3 text-xs disabled:opacity-40 hover:bg-accent"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
