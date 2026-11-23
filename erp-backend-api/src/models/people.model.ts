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
  const [account] = await db
    .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role, isActive: schema.users.isActive })
    .from(schema.users)
    .where(eq(schema.users.employeeId, id));
  const [position] = employee.positionId
    ? await db
        .select({ name: schema.positions.name })
        .from(schema.positions)
        .where(eq(schema.positions.id, employee.positionId))
    : [];

  return {
    ...employee,
    driverProfile: driver ?? null,
    mechanicProfile: mechanic ?? null,
    position: position?.name ?? null,
    account: account ?? null,
  };
}

export interface CreateEmployeeInput {
  companyId: string;
  regionId: string;
  branchId?: string;
  departmentId?: string;
  positionId?: string;
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
  /** Data URL; the HR form sends the picked file as base64. */
  photo?: string;
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
      positionId: input.positionId,
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
      photo: input.photo,
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

/** Temporary password every new account starts with; changed on first login. */
export const ONBOARDING_PASSWORD = "onboarding";

export type OnboardRole =
  | "staff"
  | "manager"
  | "hr_admin"
  | "opr_admin"
  | "kpi_admin"
  | "admin"
  | "super_admin";

export interface OnboardEmployeeInput extends CreateEmployeeInput {
  account: { email: string; role: OnboardRole };
}

/**
 * One HR action writes the two halves of a person: the employee biodata row and
 * the login account. The account starts on the onboarding password and the
 * email is checked first, so a clash fails before any biodata is written.
 */
export async function onboardEmployee(input: OnboardEmployeeInput) {
  const email = input.account.email.trim().toLowerCase();
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing) return { error: "email_taken" as const };

  const employee = await createEmployee(input);
  if (!employee) return { error: "region_not_found" as const };

  const [user] = await db
    .insert(schema.users)
    .values({
      companyId: input.companyId,
      employeeId: employee.id,
      email,
      passwordHash: await Bun.password.hash(ONBOARDING_PASSWORD),
      fullName: employee.fullName,
      role: input.account.role,
      isActive: true,
    })
    .returning();

  return { employee, user };
}

/** Moves one employee into a department, or out of it with null. The position is
 * dropped when the department changes, since positions belong to a department. */
export async function assignDepartment(
  employeeId: string,
  departmentId: string | null,
  positionId: string | null = null
) {
  const [employee] = await db
    .update(schema.employees)
    .set({ departmentId, positionId })
    .where(eq(schema.employees.id, employeeId))
    .returning();
  return employee ?? null;
}

/** Only a super admin calls this; the controller enforces the guard. */
export async function setEmployeeRole(employeeId: string, role: OnboardRole) {
  const [user] = await db
    .update(schema.users)
    .set({ role })
    .where(eq(schema.users.employeeId, employeeId))
    .returning();
  return user ?? null;
}

/** Resigning closes the record and disables the login in one step. */
export async function resignEmployee(employeeId: string, resignDate: string) {
  const [employee] = await db
    .update(schema.employees)
    .set({ status: "resigned", resignDate })
    .where(eq(schema.employees.id, employeeId))
    .returning();
  if (!employee) return null;

  await db.update(schema.users).set({ isActive: false }).where(eq(schema.users.employeeId, employeeId));
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