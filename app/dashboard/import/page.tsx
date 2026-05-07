"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";

const CHUNK_SIZE = 500;

const COLUMN_MAP: Record<string, string> = {
  "등록일시": "registered_at",
  "PID": "pid", "pid": "pid",
  "공정": "process",
  "품목코드": "item_code",
  "품명": "item_name",
  "너비": "width", "높이": "height",
  "수량": "quantity", "평수": "pyung",
  "의뢰번호": "order_no", "순번": "seq_no",
  "거래처": "client", "현장": "site",
  "라인": "line", "등록자": "registrar",
  "비고": "remark",
};

type ParsedRow = Record<string, unknown>;
type Status = "idle" | "parsed" | "importing" | "done" | "error";

function parseRegisteredAt(val: string): string | null {
  if (!val) return null;
  const num = Number(val);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const ms = Math.round((num - 25569) * 86400 * 1000);
    return new Date(ms).toISOString();
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeRow(raw: Record<string, string>): ParsedRow {
  return {
    registered_at: parseRegisteredAt(raw.registered_at ?? ""),
    pid: raw.pid ?? "",
    process: raw.process ?? "",
    item_code: raw.item_code ?? "",
    item_name: raw.item_name ?? "",
    width: raw.width ? Number(raw.width) : null,
    height: raw.height ? Number(raw.height) : null,
    quantity: raw.quantity ? Number(raw.quantity) : 1,
    pyung: raw.pyung ? Number(raw.pyung) : null,
    order_no: raw.order_no ?? "",
    seq_no: raw.seq_no ? Number(raw.seq_no) : null,
    client: raw.client ?? "",
    site: raw.site ?? "",
    line: raw.line ?? "",
    registrar: raw.registrar ?? "",
    remark: raw.remark ?? "",
  };
}

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === "\t") return line.split("\t").map((v) => v.trim());
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseFileText(text: string, filename: string): ParsedRow[] {
  // BOM 제거 (UTF-8, UTF-16 모두)
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split("\n")[0];
  const isTab = filename.toLowerCase().endsWith(".txt") || firstLine.includes("\t");
  const delimiter = isTab ? "\t" : ",";

  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitLine(lines[0], delimiter).map((h) => h.replace(/^"|"$/g, "").trim());

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i], delimiter).map((v) => v.replace(/^"|"$/g, "").trim());
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const field = COLUMN_MAP[h] ?? h;
      raw[field] = values[idx] ?? "";
    });
    const norm = normalizeRow(raw);
    if (norm.registered_at) rows.push(norm);
  }
  return rows;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ inserted: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > 100 * 1024 * 1024) {
      setErrorMsg("파일 크기가 100MB를 초과합니다.");
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "txt") {
      setErrorMsg("CSV 또는 TXT 파일만 지원합니다.");
      return;
    }
    setErrorMsg(null);
    setFile(f);
    setStatus("idle");
    setRows([]);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      // UTF-8 시도, 실패하거나 깨진 문자 있으면 EUC-KR(CP949) 재시도
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        try {
          text = new TextDecoder("euc-kr").decode(buffer);
        } catch {
          text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        }
      }
      const parsed = parseFileText(text, f.name);
      setRows(parsed);
      setStatus("parsed");
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  async function handleImport() {
    if (!rows.length) return;
    setStatus("importing");
    setProgress(0);

    let totalInserted = 0;
    const totalChunks = Math.ceil(rows.length / CHUNK_SIZE);

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: chunk }),
      });

      if (!res.ok) {
        const body = await res.json();
        setErrorMsg(body.error ?? "가져오기 실패");
        setStatus("error");
        return;
      }

      const { inserted } = await res.json();
      totalInserted += inserted ?? 0;
      const chunkIdx = Math.floor(i / CHUNK_SIZE) + 1;
      setProgress(Math.round((chunkIdx / totalChunks) * 100));
    }

    setResult({ inserted: totalInserted, total: rows.length });
    setStatus("done");
  }

  function reset() {
    setFile(null);
    setRows([]);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setErrorMsg(null);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">데이터 임포트</h1>
        <p className="text-sm text-muted-foreground">
          CSV 또는 TXT 파일을 업로드하여 생산 레코드를 추가합니다.
        </p>
      </div>

      {/* 가이드 */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
        <p className="font-medium">업로드 가이드</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>지원 형식: CSV (쉼표 구분), TXT (탭 구분) · 최대 100MB</li>
          <li>
            첫 번째 행은 헤더 —{" "}
            <span className="font-mono text-xs">
              등록일시, PID, 공정, 품목코드, 품명, 너비, 높이, 수량, 평수, 의뢰번호, 순번, 거래처, 현장, 라인, 등록자, 비고
            </span>
          </li>
          <li>등록일시 + PID 기준 중복 데이터는 자동으로 스킵됩니다</li>
          <li>등록일시가 비어 있는 행은 무시됩니다</li>
          <li>등록일시는 ISO 형식(2024-01-15T09:30:00) 또는 Excel 시리얼 숫자 모두 지원</li>
        </ul>
      </div>

      {/* 드래그앤드롭 */}
      {(status === "idle" || status === "error") && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-14 cursor-pointer transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">파일을 드래그하거나 클릭해서 선택</p>
            <p className="text-xs text-muted-foreground mt-1">CSV, TXT · 최대 100MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* 파싱 완료 — 미리보기 + 가져오기 버튼 */}
      {file && status === "parsed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · 유효 행 {rows.length.toLocaleString()}건
                </p>
              </div>
            </div>
            <button onClick={reset} className="rounded p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border bg-background overflow-x-auto">
            <p className="px-4 py-2 text-xs font-medium text-muted-foreground border-b">미리보기 (상위 3행)</p>
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {["등록일시", "PID", "품명", "라인", "거래처", "평수"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.slice(0, 3).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {String(r.registered_at ?? "").slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="px-3 py-2">{String(r.pid ?? "")}</td>
                    <td className="px-3 py-2">{String(r.item_name ?? "")}</td>
                    <td className="px-3 py-2">{String(r.line ?? "")}</td>
                    <td className="px-3 py-2">{String(r.client ?? "")}</td>
                    <td className="px-3 py-2">{String(r.pyung ?? "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            {rows.length.toLocaleString()}건 가져오기
          </button>
        </div>
      )}

      {/* 진행률 */}
      {status === "importing" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">가져오는 중… ({progress}%)</span>
            <span className="font-medium tabular-nums">{Math.round((progress / 100) * rows.length).toLocaleString()} / {rows.length.toLocaleString()}건</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 완료 */}
      {status === "done" && result && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border bg-emerald-50 px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">가져오기 완료</p>
              <p className="text-xs text-emerald-700 mt-1">
                총 {result.total.toLocaleString()}건 처리 ·{" "}
                <span className="font-medium">{result.inserted.toLocaleString()}건 신규 삽입</span> ·{" "}
                중복 스킵 {(result.total - result.inserted).toLocaleString()}건
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            다시 업로드
          </button>
        </div>
      )}
    </div>
  );
}
