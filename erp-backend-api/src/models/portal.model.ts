/** Model layer - inter-company portal (PRD module B). */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "../db/client";

export async function membershipsFor(userId: string) {
  return db
    .select({
      id: schema.companyMemberships.id,
      companyId: schema.companies.id,
      code: schema.companies.code,
      name: schema.companies.name,
      legalName: schema.companies.legalName,
      role: schema.companyMemberships.role,
      isDefault: schema.companyMemberships.isDefault,
    })
    .from(schema.companyMemberships)
    .innerJoin(schema.companies, eq(schema.companies.id, schema.companyMemberships.companyId))
    .where(eq(schema.companyMemberships.userId, userId))
    .orderBy(desc(schema.companyMemberships.isDefault));
}

/** Companies allowed to see each other's directory, per the sharing rules. */
export async function directoryCompanies() {
  const rules = await db
    .select({ companyId: schema.dataSharingRules.companyId, partnerCompanyId: schema.dataSharingRules.partnerCompanyId })
    .from(schema.dataSharingRules)
    .where(and(eq(schema.dataSharingRules.isActive, true), eq(schema.dataSharingRules.allowDirectory, true)));

  return [...new Set(rules.flatMap((rule) => [rule.companyId, rule.partnerCompanyId]))];
}

/**
 * Availability directory. Personal data (phone, address, SIM number) is only
 * returned when the pair allows `allowPersonal`; otherwise just availability.
 */
export async function directory(filter: { type?: "S" | "D" | "MK" }) {
  const allowed = await directoryCompanies();
  if (!allowed.length) return [];

  const [personalRules, rows] = await Promise.all([
    db
      .select({ companyId: schema.dataSharingRules.companyId, allowPersonal: schema.dataSharingRules.allowPersonal })
      .from(schema.dataSharingRules)
      .where(eq(schema.dataSharingRules.isActive, true)),
    db
      .select({
        id: schema.employees.id,
        code: schema.employees.employeeCode,
        fullName: schema.employees.fullName,
        type: schema.employees.type,
        status: schema.employees.status,
        isFieldCoordinator: schema.employees.isFieldCoordinator,
        companyId: schema.companies.id,
        companyCode: schema.companies.code,
        companyName: schema.companies.name,
        regionName: schema.regions.name,
        phone: schema.employees.phone,
      })
      .from(schema.employees)
      .innerJoin(schema.companies, eq(schema.companies.id, schema.employees.companyId))
      .innerJoin(schema.regions, eq(schema.regions.id, schema.employees.regionId))
      .where(
        and(
          eq(schema.employees.status, "active"),
          inArray(schema.employees.companyId, allowed),
          filter.type ? eq(schema.employees.type, filter.type) : undefined,
        ),
      )
      .orderBy(schema.employees.employeeCode),
  ]);

  const personal = new Set(personalRules.filter((rule) => rule.allowPersonal).map((rule) => rule.companyId));

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    fullName: row.fullName,
    type: row.type,
    isFieldCoordinator: row.isFieldCoordinator,
    company: { id: row.companyId, code: row.companyCode, name: row.companyName },
    regionName: row.regionName,
    phone: personal.has(row.companyId) ? row.phone : null,
  }));
}

export interface SecondmentInput {
  employeeId: string;
  fromCompanyId: string;
  toCompanyId: string;
  startDate: string;
  endDate?: string;
  reason?: string;
  kind?: "secondment" | "mutation";
}

export async function createSecondment(input: SecondmentInput) {
  const [row] = await db
    .insert(schema.secondments)
    .values({
      employeeId: input.employeeId,
      fromCompanyId: input.fromCompanyId,
      toCompanyId: input.toCompanyId,
      kind: input.kind ?? "secondment",
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
    })
    .returning();
  return row ?? null;
}

export async function listSecondments(companyId?: string) {
  const rows = await db.select().from(schema.secondments).orderBy(desc(schema.secondments.createdAt));
  if (!companyId) return rows;
  return rows.filter((row) => row.fromCompanyId === companyId || row.toCompanyId === companyId);
}

/**
 * Layered approval: HR asal -> HR tujuan -> Super Admin.
 * One call advances one step; rejecting at any step ends the flow.
 */
export async function approveSecondment(id: string, approve: boolean) {
  const [row] = await db.select().from(schema.secondments).where(eq(schema.secondments.id, id));
  if (!row) return null;
  if (row.status === "approved" || row.status === "rejected" || row.status === "cancelled") {
    return { error: "already_closed" as const, secondment: row };
  }

  if (!approve) {
    const [rejected] = await db
      .update(schema.secondments)
      .set({ status: "rejected" })
      .where(eq(schema.secondments.id, id))
      .returning();
    return { secondment: rejected };
  }

  const now = new Date();
  const next =
    row.status === "pending_from"
      ? { status: "pending_to" as const, fromApprovedAt: now }
      : row.status === "pending_to"
        ? { status: "pending_super" as const, toApprovedAt: now }
        : { status: "approved" as const, superApprovedAt: now };

  const [updated] = await db
    .update(schema.secondments)
    .set(next)
    .where(eq(schema.secondments.id, id))
    .returning();
  return { secondment: updated };
}

export async function listSharing() {
  return db.select().from(schema.dataSharingRules);
}

export async function upsertSharing(input: {
  companyId: string;
  partnerCompanyId: string;
  allowSummary?: boolean;
  allowFleet?: boolean;
  allowDirectory?: boolean;
  allowOa?: boolean;
  allowPersonal?: boolean;
}) {
  const [row] = await db
    .insert(schema.dataSharingRules)
    .values({
      companyId: input.companyId,
      partnerCompanyId: input.partnerCompanyId,
      allowSummary: input.allowSummary ?? true,
      allowFleet: input.allowFleet ?? true,
      allowDirectory: input.allowDirectory ?? true,
      allowOa: input.allowOa ?? false,
      allowPersonal: input.allowPersonal ?? false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.dataSharingRules.companyId, schema.dataSharingRules.partnerCompanyId],
      set: {
        allowSummary: input.allowSummary ?? true,
        allowFleet: input.allowFleet ?? true,
        allowDirectory: input.allowDirectory ?? true,
        allowOa: input.allowOa ?? false,
        allowPersonal: input.allowPersonal ?? false,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row ?? null;
}

/** Group consolidation for Super Admin / read-only Admin (PRD B.5). */
export async function consolidation() {
  const date = new Date().toISOString().slice(0, 10);

  const [companiesRows, headcount, fleet, attendance, km] = await Promise.all([
    db.select().from(schema.companies).where(eq(schema.companies.isActive, true)),
    db
      .select({ companyId: schema.employees.companyId, total: sql<number>`count(*)::int` })
      .from(schema.employees)
      .where(eq(schema.employees.status, "active"))
      .groupBy(schema.employees.companyId),
    db
      .select({ companyId: schema.units.companyId, total: sql<number>`count(*)::int` })
      .from(schema.units)
      .groupBy(schema.units.companyId),
    db
      .select({
        companyId: schema.employees.companyId,
        present: sql<number>`(count(*) filter (where ${schema.attendances.status} in ('H', 'LATE')))::int`,
        recorded: sql<number>`count(*)::int`,
      })
      .from(schema.attendances)
      .innerJoin(schema.employees, eq(schema.employees.id, schema.attendances.employeeId))
      .where(eq(schema.attendances.workDate, date))
      .groupBy(schema.employees.companyId),
    db
      .select({
        companyId: schema.units.companyId,
        totalKm: sql<number>`coalesce(sum(case when ${schema.operationMatrices.status} = 'KM' then ${schema.operationMatrices.kmValue} else 0 end), 0)::int`,
      })
      .from(schema.operationMatrices)
      .innerJoin(schema.units, eq(schema.units.id, schema.operationMatrices.unitId))
      .where(eq(schema.operationMatrices.matrixDate, date))
      .groupBy(schema.units.companyId),
  ]);

  return companiesRows.map((company) => {
    const people = headcount.find((row) => row.companyId === company.id)?.total ?? 0;
    const attendanceRow = attendance.find((row) => row.companyId === company.id);

    return {
      id: company.id,
      code: company.code,
      name: company.name,
      legalName: company.legalName,
      timezone: company.defaultTimezone,
      headcount: people,
      fleet: fleet.find((row) => row.companyId === company.id)?.total ?? 0,
      presentToday: attendanceRow?.present ?? 0,
      attendanceRecorded: attendanceRow?.recorded ?? 0,
      attendanceRate: attendanceRow?.recorded
        ? Number(((attendanceRow.present / attendanceRow.recorded) * 100).toFixed(1))
        : null,
      totalKmToday: km.find((row) => row.companyId === company.id)?.totalKm ?? 0,
    };
  });
}