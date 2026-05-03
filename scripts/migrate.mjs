import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { read, utils } from "xlsx";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const XLSX_PATH = resolve(__dirname, "../../dongil.xlsx");
const CHUNK_SIZE = 1000;

function excelSerialToISO(serial) {
  if (typeof serial !== "number") return null;
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(ms).toISOString();
}

console.log("📂 엑셀 파일 읽는 중...");
const fileBuffer = readFileSync(XLSX_PATH);
const wb = read(fileBuffer, { type: "buffer" });
const ws = wb.Sheets["MES"];
const rows = utils.sheet_to_json(ws, { header: 1, defval: "" });

const headers = rows[0];
const dataRows = rows.slice(1);
console.log(`✅ 총 ${dataRows.length}행 파싱 완료`);

const records = dataRows
  .map((row) => ({
    s_flag: row[0] === true,
    registered_at: excelSerialToISO(row[1]),
    pid: String(row[2] || ""),
    process: String(row[3] || ""),
    item_code: String(row[4] || ""),
    item_name: String(row[5] || ""),
    width: typeof row[6] === "number" ? row[6] : null,
    height: typeof row[7] === "number" ? row[7] : null,
    quantity: typeof row[8] === "number" ? row[8] : 1,
    pyung: typeof row[9] === "number" ? row[9] : null,
    order_no: String(row[10] || ""),
    seq_no: typeof row[11] === "number" ? row[11] : null,
    client: String(row[12] || ""),
    site: String(row[13] || ""),
    line: String(row[14] || ""),
    registrar: String(row[15] || ""),
    remark: String(row[16] || ""),
  }))
  .filter((r) => r.registered_at !== null);

// 이미 삽입된 건수 확인 (이어서 진행)
const { count: existingCount, error: countError } = await supabase
  .from("production_records")
  .select("*", { count: "exact", head: true });

if (countError) {
  console.error("❌ 기존 건수 조회 실패:", countError.message);
  process.exit(1);
}

const startIndex = existingCount ?? 0;
console.log(`📊 Supabase 기존 건수: ${startIndex}건`);

if (startIndex >= records.length) {
  console.log("✅ 이미 모든 데이터가 삽입되어 있습니다.");
  process.exit(0);
}

const remaining = records.slice(startIndex);
console.log(`🚀 ${startIndex}건부터 이어서 ${remaining.length}건 삽입 시작...`);

let inserted = startIndex;
for (let i = 0; i < remaining.length; i += CHUNK_SIZE) {
  const chunk = remaining.slice(i, i + CHUNK_SIZE);
  const { error } = await supabase.from("production_records").insert(chunk);
  if (error) {
    console.error(`❌ 청크 ${inserted}~${inserted + chunk.length} 삽입 실패:`, error.message);
    process.exit(1);
  }
  inserted += chunk.length;
  console.log(`  → ${inserted} / ${records.length}건 완료`);
}

console.log("✅ 마이그레이션 완료!");
