/**
 * PRD metrics - satu sumber rumus untuk web.
 *   Capaian (%)            = Total KM Supir / Target KM Unit * 100
 *   Target berjalan (%)    = ceil(tanggal berjalan * 3,33%)
 *   Total KM               = hanya sel `KM`; B.M / A.M tidak dihitung
 *   Band                   = hijau >= target berjalan, cream 80-99%, merah < 80%
 */

export const DAILY_TARGET_PERCENT = 3.33;

export function dailyTargetPercent(dayOfMonth: number): number {
  return Math.ceil(dayOfMonth * DAILY_TARGET_PERCENT);
}

export function achievementPercent(totalKm: number, targetKm: number): number {
  if (targetKm <= 0) return 0;
  return Number(((totalKm / targetKm) * 100).toFixed(2));
}

export type Band = "green" | "cream" | "red";

export function bandOf(achievement: number, runningTarget: number): Band {
  if (achievement >= runningTarget) return "green";
  if (achievement >= runningTarget * 0.8) return "cream";
  return "red";
}

export const bandColour: Record<Band, string> = {
  green: "var(--success)",
  cream: "var(--warning)",
  red: "var(--danger)",
};

/** Only the `KM` cell counts. B.M / A.M keep their distance as a note. */
export function countsTowardKm(status: string): boolean {
  return status === "KM";
}

/* ------------------------------------------------------------------- types */

export interface UnitKpi {
  unitId: string;
  plateNumber: string;
  driverId: string | null;
  totalKm: number;
  targetKm: number;
  totalTrips: number;
  totalNup: number;
  totalStandby: number;
}

export interface RegionSnapshot {
  date: string;
  regionId: string | null;
  totalKm: number;
  targetKm: number;
  workingUnits: number;
  requestedUnits: number;
  fulfilmentRatio: number | null;
}

export interface RecapLine {
  employeeCode: string;
  fullName: string;
  hadirH: number;
  terlambat: number;
  cutiC: number;
  cdt: number;
  alfa: number;
}

export type PicSource = "Operasional" | "Marketing/Alam";

/** One cell of the 1-31 matrix, the raw source behind every fleet metric. */
export interface MatrixRow {
  unitId: string;
  unitLabel: string;
  date: string;
  status: string;
  km: number | null;
  pic: PicSource;
  info?: string | null;
}

export interface MetricsSnapshot {
  units: UnitKpi[];
  region: RegionSnapshot;
  recap: RecapLine[];
  matrix: MatrixRow[];
}

export interface UnitKpiRow extends UnitKpi {
  achievement: number;
  band: Band;
}

export interface MetricsView {
  day: number;
  month: string;
  runningTarget: number;
  units: UnitKpiRow[];
  totals: {
    km: number;
    targetKm: number;
    trips: number;
    nup: number;
    standby: number;
  };
  achievement: number;
  band: Band;
  gapToTarget: number;
  region: RegionSnapshot & { coverage: number; demandGap: number };
  recap: (RecapLine & { total: number })[];
  statusMix: { key: string; label: string; value: number }[];
}

/** Turn raw API rows (or sample rows) into everything the dashboard renders. */
export function buildMetrics(snapshot: MetricsSnapshot, day: number): MetricsView {
  const units: UnitKpiRow[] = snapshot.units.map((unit) => {
    const achievement = achievementPercent(unit.totalKm, unit.targetKm);
    return { ...unit, achievement, band: bandOf(achievement, dailyTargetPercent(day)) };
  });

  const totals = units.reduce(
    (sum, unit) => ({
      km: sum.km + unit.totalKm,
      targetKm: sum.targetKm + unit.targetKm,
      trips: sum.trips + unit.totalTrips,
      nup: sum.nup + unit.totalNup,
      standby: sum.standby + unit.totalStandby,
    }),
    { km: 0, targetKm: 0, trips: 0, nup: 0, standby: 0 },
  );

  const achievement = achievementPercent(totals.km, totals.targetKm);
  const runningTarget = dailyTargetPercent(day);

  return {
    day,
    month: snapshot.region.date.slice(0, 7),
    runningTarget,
    units,
    totals,
    achievement,
    band: bandOf(achievement, runningTarget),
    gapToTarget: Number((achievement - runningTarget).toFixed(1)),
    region: {
      ...snapshot.region,
      coverage: snapshot.region.requestedUnits
        ? Number(((snapshot.region.workingUnits / snapshot.region.requestedUnits) * 100).toFixed(1))
        : 0,
      demandGap: snapshot.region.requestedUnits - snapshot.region.workingUnits,
    },
    recap: snapshot.recap.map((line) => ({
      ...line,
      total: line.hadirH + line.terlambat + line.cutiC + line.cdt + line.alfa,
    })),
    statusMix: [
      { key: "trips", label: "Trip (KM)", value: totals.trips },
      { key: "nup", label: "Perbaikan", value: totals.nup },
      { key: "standby", label: "Standby", value: totals.standby },
    ].filter((entry) => entry.value > 0),
  };
}

export function emptySnapshot(date = new Date().toISOString().slice(0, 10)): MetricsSnapshot {
  return {
    units: [],
    region: {
      date,
      regionId: null,
      totalKm: 0,
      targetKm: 0,
      workingUnits: 0,
      requestedUnits: 0,
      fulfilmentRatio: null,
    },
    recap: [],
    matrix: [],
  };
}

/* ------------------------------------------------------------ derived views */

export interface DailyPoint {
  key: string;
  label: string;
  axisLabel: string;
  km: number;
  trips: number;
}

/** Daily KM and trip counts, oldest first. Only `KM` cells count. */
export function dailySeries(rows: MatrixRow[]): DailyPoint[] {
  const byDate = new Map<string, { km: number; trips: number }>();
  for (const row of rows) {
    if (!countsTowardKm(row.status)) continue;
    const current = byDate.get(row.date) ?? { km: 0, trips: 0 };
    current.km += row.km ?? 0;
    current.trips += 1;
    byDate.set(row.date, current);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      key: date,
      label: date.slice(8),
      axisLabel: date.slice(8),
      km: value.km,
      trips: value.trips,
    }));
}

/** Frequency mix for a dimension, with the long tail folded into "Lainnya". */
export function countMix(
  rows: MatrixRow[],
  pick: (row: MatrixRow) => string | null | undefined,
  max = 5,
): { key: string; label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = pick(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const data = sorted.slice(0, max).map(([label, value]) => ({ key: label, label, value }));
  const rest = sorted.slice(max).reduce((sum, [, value]) => sum + value, 0);
  if (rest > 0) data.push({ key: "other", label: "Lainnya", value: rest });
  return data;
}

export const statusMixOf = (rows: MatrixRow[]) => countMix(rows, (row) => row.status, 6);
export const picMixOf = (rows: MatrixRow[]) => countMix(rows, (row) => row.pic, 2);