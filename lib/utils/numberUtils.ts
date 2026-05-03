export function formatCount(n: number): string {
  return n.toLocaleString("ko-KR") + "건";
}

export function formatPyung(n: number): string {
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + "평";
}

export function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(1) + "%";
}

export function formatRatio(n: number): string {
  return (n * 100).toFixed(1) + "%";
}
