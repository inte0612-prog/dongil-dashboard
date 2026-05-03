const COATING_KEYWORDS = ["로이", "CL에칭", "CL", "GN", "에칭", "ML", "PLT", "XTN", "투명"] as const;
const GAP_PATTERN = /(\d+)A/g;

export function parseCoating(itemName: string): string {
  for (const kw of COATING_KEYWORDS) {
    if (itemName.includes(kw)) return kw;
  }
  return "기타";
}

export function parseGap(itemName: string): string {
  const matches = [...itemName.matchAll(GAP_PATTERN)];
  if (matches.length === 0) return "기타";
  const sizes = matches.map((m) => parseInt(m[1], 10));
  return sizes.join("+") + "A";
}

export function hasArgon(itemName: string): boolean {
  return itemName.includes("Ar.");
}

export function parseSizeClass(pyung: number): "소형" | "중형" | "대형" {
  if (pyung < 10) return "소형";
  if (pyung < 30) return "중형";
  return "대형";
}
