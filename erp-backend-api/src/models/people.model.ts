/** Model layer - employees (biodata + driver/mechanic profiles). */
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import { nextEmployeeCode } from "../lib/employee-code";

export async function listEmployees(companyId?: string) {
  const query = db.select().from(schema.employees);
  if (companyId) return query.where(eq(schema.employees.companyId, companyId));
  return query;
}

export async function getEmployee(id: string) {
  const [employee] = await db.select().from(schema.employees).where(eq(schema.employees.id, id));
  if (!employee) return null;

  const [driver] = await db
    .select()
    .from(schema.driverProfiles)
    .where(eq(schema.driverProfiles.employeeId, id));
  const [mechanic] = await db
    .select()
    .from(schema.mechanicProfiles)
    .where(eq(schema.mechanicProfiles.employeeId, id));

  return { ...employee, driverProfile: driver ?? null, mechanicProfile: mechanic ?? null };
}

export interface CreateEmployeeInput {
  companyId: string;
  regionId: string;
  branchId?: string;
  departmentId?: string;
  shiftId?: string;
  type: "S" | "D" | "MK";
  fullName: string;
  nickname?: string;
  nik?: string;
  birthDate?: string;
  gender?: "male" | "female";
  phone?: string;
  email?: string;
  address?: string;
  joinDate: string;
  managerId?: string;
  isDepartmentHead?: boolean;
  employeeCode?: string;
  simNumber?: string;
  simType?: string;
  simExpiry?: string;
  specialization?: string;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const [region] = await db.select().from(schema.regions).where(eq(schema.regions.id, input.regionId));
  if (!region) return null;

  const employeeCode =
    input.employeeCode ?? (await nextEmployeeCode(input.companyId, region.code, input.type));

  const [employee] = await db
    .insert(schema.employees)
    .values({
      companyId: input.companyId,
      regionId: input.regionId,
      branchId: input.branchId,
      departmentId: input.departmentId,
      shiftId: input.shiftId,
      employeeCode,
      type: input.type,
      fullName: input.fullName,
      nickname: input.nickname,
      nik: input.nik,
      birthDate: input.birthDate,
      gender: input.gender,
      phone: input.phone,
      email: input.email,
      address: input.address,
      joinDate: input.joinDate,
      managerId: input.managerId,
      isDepartmentHead: input.isDepartmentHead ?? false,
    })
    .returning();

  if (!employee) return null;

  if (input.type === "D") {
    await db.insert(schema.driverProfiles).values({
      employeeId: employee.id,
      simNumber: input.simNumber,
      simType: input.simType,
      simExpiry: input.simExpiry,
      homeBaseBranchId: input.branchId,
    });
  }

  if (input.type === "MK") {
    await db.insert(schema.mechanicProfiles).values({
      employeeId: employee.id,
      specialization: input.specialization,
    });
  }

  return employee;
}

export async function assignLocation(employeeId: string, locationId: string) {
  await db
    .insert(schema.employeeLocations)
    .values({ employeeId, locationId })
    .onConflictDoNothing();
  return { ok: true };
}

/** Active driver attached to a unit, used by the matrix and FIFO rules. */
export async function findActiveDriver(unitId: string) {
  const [assignment] = await db
    .select()
    .from(schema.unitAssignments)
    .where(and(eq(schema.unitAssignments.unitId, unitId), eq(schema.unitAssignments.isActive, true)))
    .limit(1);
  return assignment ?? null;
}