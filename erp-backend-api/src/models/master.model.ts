/** Model layer - master data (regions, branches, departments, shifts, geofences). */
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";

export { listCompanies } from "./company.model";

export async function createCompany(input: {
  code: string;
  name: string;
  legalName?: string;
  defaultTimezone?: string;
}) {
  return db
    .insert(schema.companies)
    .values({
      code: input.code,
      name: input.name,
      legalName: input.legalName,
      defaultTimezone: input.defaultTimezone ?? "Asia/Jakarta",
    })
    .returning();
}

export async function listRegions(companyId?: string) {
  const query = db.select().from(schema.regions);
  if (companyId) return query.where(eq(schema.regions.companyId, companyId));
  return query;
}

export async function createRegion(input: {
  companyId: string;
  code: string;
  name: string;
  timezone?: string;
}) {
  return db
    .insert(schema.regions)
    .values({
      companyId: input.companyId,
      code: input.code,
      name: input.name,
      timezone: input.timezone ?? "Asia/Jakarta",
    })
    .returning();
}

export async function listBranches(regionId?: string) {
  const query = db.select().from(schema.branches);
  if (regionId) return query.where(eq(schema.branches.regionId, regionId));
  return query;
}

export async function createBranch(input: {
  regionId: string;
  code: string;
  name: string;
  address?: string;
  timezone?: string;
}) {
  return db
    .insert(schema.branches)
    .values({
      regionId: input.regionId,
      code: input.code,
      name: input.name,
      address: input.address,
      timezone: input.timezone ?? "Asia/Jakarta",
    })
    .returning();
}

export async function listDepartments(companyId?: string) {
  const query = db.select().from(schema.departments);
  if (companyId) return query.where(eq(schema.departments.companyId, companyId));
  return query;
}

export async function createDepartment(input: { companyId: string; code: string; name: string }) {
  return db
    .insert(schema.departments)
    .values({ companyId: input.companyId, code: input.code, name: input.name })
    .returning();
}

export async function listShifts(companyId?: string) {
  const rows = companyId
    ? await db.select().from(schema.shifts).where(eq(schema.shifts.companyId, companyId))
    : await db.select().from(schema.shifts);
  const days = await db.select().from(schema.shiftDays);
  return rows.map((shift) => ({ ...shift, days: days.filter((day) => day.shiftId === shift.id) }));
}

export async function createShift(input: {
  companyId: string;
  name: string;
  days?: {
    dayOfWeek: number;
    isWorkDay?: boolean;
    startTime?: string;
    endTime?: string;
  }[];
}) {
  const [shift] = await db
    .insert(schema.shifts)
    .values({ companyId: input.companyId, name: input.name })
    .returning();
  if (!shift) return null;

  if (input.days?.length) {
    await db.insert(schema.shiftDays).values(
      input.days.map((day) => ({
        shiftId: shift.id,
        dayOfWeek: day.dayOfWeek,
        isWorkDay: day.isWorkDay ?? true,
        startTime: day.startTime ?? null,
        endTime: day.endTime ?? null,
      })),
    );
  }

  return shift;
}

export async function listAttendanceLocations() {
  return db.select().from(schema.attendanceLocations);
}

export async function createAttendanceLocation(input: {
  regionId: string;
  branchId?: string;
  name: string;
  latitude: string;
  longitude: string;
  radiusMeters?: number;
  timezone: string;
}) {
  return db
    .insert(schema.attendanceLocations)
    .values({
      regionId: input.regionId,
      branchId: input.branchId,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters ?? 150,
      timezone: input.timezone,
    })
    .returning();
}