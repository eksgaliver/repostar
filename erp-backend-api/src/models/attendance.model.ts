/** Model layer - attendance, requests, leave balances, cutoff recap. */
import { and, between, eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import { cutoffFor, lateMinutes } from "../lib/cutoff";

async function shiftStartFor(shiftId: string | null, dateISO: string): Promise<string | null> {
  if (!shiftId) return null;
  const dayOfWeek = new Date(`${dateISO}T00:00:00Z`).getUTCDay();
  const [row] = await db
    .select()
    .from(schema.shiftDays)
    .where(and(eq(schema.shiftDays.shiftId, shiftId), eq(schema.shiftDays.dayOfWeek, dayOfWeek)));
  return row?.isWorkDay ? row.startTime : null;
}

export type ClockInError = "employee_not_found" | "location_not_found";

export async function clockIn(input: {
  employeeId: string;
  locationId: string;
  workDate: string;
  clockInAt?: string;
  selfieUrl?: string;
  isMockLocation?: boolean;
  source?: string;
  syncedAt?: string;
}) {
  const [employee] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.id, input.employeeId));
  if (!employee) return { error: "employee_not_found" as ClockInError };

  const [location] = await db
    .select()
    .from(schema.attendanceLocations)
    .where(eq(schema.attendanceLocations.id, input.locationId));
  if (!location) return { error: "location_not_found" as ClockInError };

  const clockInAt = input.clockInAt ? new Date(input.clockInAt) : new Date();
  const start = await shiftStartFor(employee.shiftId, input.workDate);
  // 0-minute tolerance: one second late already counts as LATE.
  const late = start ? lateMinutes(clockInAt, start, location.timezone) : 0;
  const status = late > 0 ? "LATE" : "H";

  const [row] = await db
    .insert(schema.attendances)
    .values({
      employeeId: employee.id,
      locationId: location.id,
      workDate: input.workDate,
      timezone: location.timezone,
      clockInAt,
      status,
      lateMinutes: late,
      selfieUrl: input.selfieUrl,
      isMockLocation: input.isMockLocation ?? false,
      source: input.source ?? "web",
      syncedAt: input.syncedAt ? new Date(input.syncedAt) : null,
    })
    .onConflictDoUpdate({
      target: [schema.attendances.employeeId, schema.attendances.workDate],
      set: {
        clockInAt,
        locationId: location.id,
        status,
        lateMinutes: late,
        selfieUrl: input.selfieUrl,
        isMockLocation: input.isMockLocation ?? false,
        source: input.source ?? "web",
        syncedAt: input.syncedAt ? new Date(input.syncedAt) : null,
      },
    })
    .returning();

  return { row };
}

export async function clockOut(input: { employeeId: string; workDate: string; clockOutAt?: string }) {
  const [row] = await db
    .update(schema.attendances)
    .set({ clockOutAt: input.clockOutAt ? new Date(input.clockOutAt) : new Date() })
    .where(
      and(
        eq(schema.attendances.employeeId, input.employeeId),
        eq(schema.attendances.workDate, input.workDate),
      ),
    )
    .returning();
  return row ?? null;
}

export async function listDaily(date?: string) {
  const query = db.select().from(schema.attendances);
  if (date) return query.where(eq(schema.attendances.workDate, date));
  return query;
}

export async function createRequest(input: {
  employeeId: string;
  type: "cuti" | "wfh" | "dinas_luar" | "sakit" | "koreksi_absen" | "lembur" | "reimbursement";
  startDate: string;
  endDate: string;
  leaveDays?: number;
  reason?: string;
  attachmentUrl?: string;
  overtimeHours?: number;
  amount?: number;
  receiptUrl?: string;
}) {
  return db
    .insert(schema.attendanceRequests)
    .values({
      employeeId: input.employeeId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      leaveDays: input.leaveDays ?? 1,
      reason: input.reason,
      attachmentUrl: input.attachmentUrl,
      overtimeHours: input.overtimeHours != null ? String(input.overtimeHours) : undefined,
      amount: input.amount != null ? String(input.amount) : undefined,
      receiptUrl: input.receiptUrl,
    })
    .returning();
}

export async function listRequests(query: { status?: string; employeeId?: string }) {
  const filters = [
    query.status ? eq(schema.attendanceRequests.status, query.status as "pending") : undefined,
    query.employeeId ? eq(schema.attendanceRequests.employeeId, query.employeeId) : undefined,
  ].filter(Boolean);

  return db
    .select()
    .from(schema.attendanceRequests)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(schema.attendanceRequests.createdAt);
}

/** Final HR validation after the department head has approved. */
export async function validateByHr(id: string, validatorId?: string) {
  const [row] = await db
    .update(schema.attendanceRequests)
    .set({ hrValidatorId: validatorId, hrValidatedAt: new Date() })
    .where(eq(schema.attendanceRequests.id, id))
    .returning();
  return row ?? null;
}

/**
 * Approving paid leave with a balance left marks `C` and burns the balance;
 * without a balance it becomes `CDT`. Other request types map to SAKIT/DINAS.
 */
export async function approveRequest(id: string, approved: boolean, approverId?: string) {
  const [request] = await db
    .select()
    .from(schema.attendanceRequests)
    .where(eq(schema.attendanceRequests.id, id));
  if (!request) return null;
  if (request.status !== "pending") return { error: "already_processed" as const };

  const cycle = cutoffFor(request.startDate);
  const [balance] = await db
    .select()
    .from(schema.leaveBalances)
    .where(
      and(
        eq(schema.leaveBalances.employeeId, request.employeeId),
        eq(schema.leaveBalances.periodStart, cycle.periodStart),
      ),
    );

  const remaining = balance ? balance.entitled - balance.used : 0;
  const isLeave = request.type === "cuti";
  const paid = isLeave ? remaining >= request.leaveDays : true;
  const attendanceStatus = isLeave ? (paid ? "C" : "CDT") : request.type === "sakit" ? "SAKIT" : "DINAS";

  if (isLeave && paid && balance) {
    await db
      .update(schema.leaveBalances)
      .set({ used: balance.used + request.leaveDays })
      .where(eq(schema.leaveBalances.id, balance.id));
  }

  const [updated] = await db
    .update(schema.attendanceRequests)
    .set({
      status: approved ? "approved" : "rejected",
      approverId,
      approvedAt: new Date(),
    })
    .where(eq(schema.attendanceRequests.id, id))
    .returning();

  return { request: updated, attendanceStatus: approved ? attendanceStatus : "ALFA" };
}

export async function listLeaveBalances(employeeId?: string) {
  const query = db.select().from(schema.leaveBalances);
  if (employeeId) return query.where(eq(schema.leaveBalances.employeeId, employeeId));
  return query;
}

export async function recap(input: { period?: string; periodStart?: string; periodEnd?: string; employeeId?: string }) {
  const cycle = input.period
    ? cutoffFor(`${input.period}-15`)
    : cutoffFor(new Date().toISOString().slice(0, 10));
  const start = input.periodStart ?? cycle.periodStart;
  const end = input.periodEnd ?? cycle.periodEnd;

  const rows = await db
    .select()
    .from(schema.attendances)
    .where(between(schema.attendances.workDate, start, end));

  const employees = input.employeeId
    ? await db.select().from(schema.employees).where(eq(schema.employees.id, input.employeeId))
    : await db.select().from(schema.employees);

  return employees.map((employee) => {
    const own = rows.filter((row) => row.employeeId === employee.id);
    const count = (status: string) => own.filter((row) => row.status === status).length;
    return {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      periodStart: start,
      periodEnd: end,
      hadirH: count("H"),
      terlambat: count("LATE"),
      cutiC: count("C"),
      cdt: count("CDT"),
      alfa: count("ALFA"),
      wfh: count("WFH"),
      dinas: count("DINAS"),
      sakit: count("SAKIT"),
    };
  });
}