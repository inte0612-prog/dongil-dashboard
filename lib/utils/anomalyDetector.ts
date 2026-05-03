import { AnomalyPoint } from "@/types";

export function detectAnomalies(
  dailyData: { date: string; count: number }[],
  windowSize = 7,
  threshold = 0.3
): AnomalyPoint[] {
  const anomalies: AnomalyPoint[] = [];

  for (let i = windowSize; i < dailyData.length; i++) {
    const window = dailyData.slice(i - windowSize, i);
    const movingAvg = window.reduce((s, d) => s + d.count, 0) / windowSize;
    if (movingAvg === 0) continue;

    const actual = dailyData[i].count;
    const deviationRate = (actual - movingAvg) / movingAvg;

    if (Math.abs(deviationRate) >= threshold) {
      anomalies.push({
        date: dailyData[i].date,
        actual,
        movingAvg: Math.round(movingAvg),
        deviationRate,
      });
    }
  }

  return anomalies;
}
