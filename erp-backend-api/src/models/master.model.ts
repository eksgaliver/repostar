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

/** Removes a tenant; regions, branches and every company_id row cascade with it. */
export async function deleteCompany(companyId: string) {
  return db.delete(schema.companies).where(eq(schema.companies.id, companyId)).returning();
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

export async function updateDepartment(
  id: string,
  input: { code: string; name: string; isActive?: boolean }
) {
  return db
    .update(schema.departments)
    .set({ code: input.code, name: input.name, isActive: input.isActive ?? true })
    .where(eq(schema.departments.id, id))
    .returning();
}

/** Employees keep their record; only the department pointer is cleared. */
export async function deleteDepartment(id: string) {
  await db.update(schema.employees).set({ departmentId: null }).where(eq(schema.employees.departmentId, id));
  return db.delete(schema.departments).where(eq(schema.departments.id, id)).returning();
}

/** Positions of one department. */
export async function listPositions(departmentId: string) {
  return db.select().from(schema.positions).where(eq(schema.positions.departmentId, departmentId));
}

export async function createPosition(input: { departmentId: string; name: string }) {
  return db
    .insert(schema.positions)
    .values({ departmentId: input.departmentId, name: input.name })
    .returning();
}

export async function updatePosition(id: string, input: { name: string; isActive?: boolean }) {
  return db
    .update(schema.positions)
    .set({ name: input.name, isActive: input.isActive ?? true })
    .where(eq(schema.positions.id, id))
    .returning();
}

/** Employees keep their record; the FK clears position_id on delete. */
export async function deletePosition(id: string) {
  return db.delete(schema.positions).where(eq(schema.positions.id, id)).returning();
}

export async function listDepartmentMembers(departmentId: string) {
  return db
    .select({
      id: schema.employees.id,
      employeeCode: schema.employees.employeeCode,
      fullName: schema.employees.fullName,
      photo: schema.employees.photo,
      type: schema.employees.type,
      status: schema.employees.status,
      positionId: schema.employees.positionId,
      positionName: schema.positions.name,
    })
    .from(schema.employees)
    .leftJoin(schema.positions, eq(schema.employees.positionId, schema.positions.id))
    .where(eq(schema.employees.departmentId, departmentId));
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