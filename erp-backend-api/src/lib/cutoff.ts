/**
 * Attendance cutoff window: 26th of the running month -> 25th of the next month.
 * Example: 2026-11-28 falls in the 2026-11-26 .. 2026-12-25 cycle.
 */
export interface CutoffWindow {
  periodStart: string;
  periodEnd: string;
  monthKey: string;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function cutoffFor(dateISO: string, startDay = 26, endDay = 25): CutoffWindow {
  const d = new Date(`${dateISO}T00:00:00Z`);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  const start =
    day >= startDay ? new Date(Date.UTC(year, month, startDay)) : new Date(Date.UTC(year, month - 1, startDay));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, endDay));

  return { periodStart: iso(start), periodEnd: iso(end), monthKey: iso(start).slice(0, 7) };
}

/** Inclusive weekday count between two ISO dates, skipping Sunday unless `workSaturday` is false. */
export function workingDays(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00Z`);
  const to = new Date(`${toISO}T00:00:00Z`);
  let count = 0;
  for (const d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 0) count += 1;
  }
  return count;
}

/** 0 lateness tolerance: anything after the shift start is late, to the second. */
export function lateMinutes(clockIn: Date, shiftStart: string, timezone: string): number {
  const [hh = "0", mm = "0"] = shiftStart.split(":");
  const local = new Date(clockIn.toLocaleString("en-US", { timeZone: timezone }));
  const start = new Date(local);
  start.setHours(Number(hh), Number(mm), 0, 0);
  const diff = Math.floor((local.getTime() - start.getTime()) / 60000);
  return diff > 0 ? diff : 0;
}