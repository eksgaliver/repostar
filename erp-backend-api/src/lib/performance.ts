/**
 * Performance rules from the PRD (section D.4).
 *
 *   Capaian (%)        = Total KM Supir / Target KM Unit * 100
 *   Target berjalan (%) = ceil(tanggal berjalan * 3,33%)
 *
 * Bands: green >= running target, cream 80-99% of it, red below 80%.
 */
export type PerformanceBand = "green" | "cream" | "red";

export function dailyTargetPercent(dayOfMonth: number): number {
  return Math.ceil(dayOfMonth * 3.33);
}

export function achievementPercent(totalKm: number, targetKm: number): number {
  if (targetKm <= 0) return 0;
  return Number(((totalKm / targetKm) * 100).toFixed(2));
}

export function performanceBand(achievement: number, runningTarget: number): PerformanceBand {
  if (achievement >= runningTarget) return "green";
  if (achievement >= runningTarget * 0.8) return "cream";
  return "red";
}

/** Codes whose KM must never be added to the monthly total. */
const KM_EXCLUDED = new Set(["B.M", "A.M"]);

/** Codes that still carry an odometer reading worth showing, but not counting. */
export function countsTowardKm(status: string): boolean {
  return status === "KM" && !KM_EXCLUDED.has(status);
}