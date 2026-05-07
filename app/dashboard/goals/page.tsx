"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { ProductionGoal } from "@/types";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

type FormState = {
  year: number;
  month: number;
  target_quantity: string;
  target_area: string;
  memo: string;
};

const EMPTY_FORM: FormState = {
  year: currentYear,
  month: new Date().getMonth() + 1,
  target_quantity: "",
  target_area: "",
  memo: "",
};

function fmt(n: number | null | undefined, unit = "") {
  if (n == null) return "—";
  return n.toLocaleString() + unit;
}

export default function GoalsPage() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [goals, setGoals] = useState<ProductionGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductionGoal | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/goals?year=${selectedYear}`);
    const data = await res.json();
    setGoals(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [selectedYear]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  function openAdd() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, year: selectedYear });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(g: ProductionGoal) {
    setEditTarget(g);
    setForm({
      year: g.year,
      month: g.month,
      target_quantity: g.target_quantity != null ? String(g.target_quantity) : "",
      target_area: g.target_area != null ? String(g.target_area) : "",
      memo: g.memo ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    fetchGoals();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      year: Number(form.year),
      month: Number(form.month),
      target_quantity: form.target_quantity !== "" ? Number(form.target_quantity) : null,
      target_area: form.target_area !== "" ? Number(form.target_area) : null,
      memo: form.memo || null,
    };

    const isEdit = editTarget != null;
    const res = await fetch("/api/goals", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editTarget.id, ...payload } : payload),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "저장 실패");
      setSubmitting(false);
      return;
    }

    setModalOpen(false);
    setSubmitting(false);
    fetchGoals();
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">목표 설정</h1>
          <p className="text-sm text-muted-foreground">연월별 생산 목표 수량·평수를 입력하고 관리합니다.</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          목표 추가
        </button>
      </div>

      {/* 연도 선택 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">연도</span>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">연월</th>
              <th className="px-4 py-3 text-right font-medium">목표 수량 (건)</th>
              <th className="px-4 py-3 text-right font-medium">목표 평수 (평)</th>
              <th className="px-4 py-3 text-left font-medium">메모</th>
              <th className="px-4 py-3 text-center font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  불러오는 중…
                </td>
              </tr>
            ) : goals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {selectedYear}년 목표 데이터가 없습니다. 목표 추가 버튼을 눌러 입력하세요.
                </td>
              </tr>
            ) : (
              goals.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {g.year}년 {g.month}월
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmt(g.target_quantity, "건")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmt(g.target_area, "평")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{g.memo ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(g)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="수정"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {editTarget ? "목표 수정" : "목표 추가"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">연도</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    disabled={!!editTarget}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">월</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                    disabled={!!editTarget}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">목표 수량 (건)</label>
                <input
                  type="number"
                  min={0}
                  value={form.target_quantity}
                  onChange={(e) => setForm((f) => ({ ...f, target_quantity: e.target.value }))}
                  placeholder="예: 5000"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">목표 평수 (평)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.target_area}
                  onChange={(e) => setForm((f) => ({ ...f, target_area: e.target.value }))}
                  placeholder="예: 12000.00"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">메모</label>
                <input
                  type="text"
                  value={form.memo}
                  onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  placeholder="선택 사항"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "저장 중…" : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
