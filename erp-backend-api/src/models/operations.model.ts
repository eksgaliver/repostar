/** Model layer - fleet: units, mutations, targets, routes, DO, matrix, KPI, FIFO. */
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "../db/client";
import { achievementPercent, dailyTargetPercent, performanceBand } from "../lib/performance";

export type MatrixStatus = (typeof schema.matrixStatusEnum.enumValues)[number];
export type PicSource = "Operasional" | "Marketing/Alam";
export type InfoSource = "Korlap" | "Manajemen";

export const NEEDS_INFO: ReadonlySet<string> = new Set(["NUP", "NUPL", "REJECT", "INSIDEN", "B.M", "A.M"]);

/* ------------------------------------------------------------------- units */

export async function listUnits(companyId?: string) {
  const query = db.select().from(schema.units);
  if (companyId) return query.where(eq(schema.units.companyId, companyId));
  return query;
}

export async function createUnit(input: {
  companyId: string;
  regionId: string;
  branchId?: string;
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  specification?: string;
  korlapId?: string;
}) {
  return db.insert(schema.units).values(input).returning();
}

/**
 * Driver mutation: the running month's records follow the driver to the new
 * unit, the previous assignment is closed and the old unit is flagged TAS.
 */
export async function assignDriver(input: {
  unitId: string;
  driverId: string;
  fromDate: string;
  approvedBy?: string;
  previousUnitId?: string;
}) {
  const [unit] = await db.select().from(schema.units).where(eq(schema.units.id, input.unitId));
  if (!unit) return null;

  await db
    .update(schema.unitAssignments)
    .set({ isActive: false, toDate: input.fromDate })
    .where(and(eq(schema.unitAssignments.unitId, input.unitId), eq(schema.unitAssignments.isActive, true)));

  if (unit.currentDriverId) {
    await db
      .update(schema.operationMatrices)
      .set({ driverId: input.driverId })
      .where(
        and(
          eq(schema.operationMatrices.unitId, input.unitId),
          gte(schema.operationMatrices.matrixDate, `${input.fromDate.slice(0, 7)}-01`),
        ),
      );
  }

  await db.insert(schema.unitAssignments).values({
    unitId: input.unitId,
    driverId: input.driverId,
    fromDate: input.fromDate,
    approvedBy: input.approvedBy,
    approvedAt: new Date(),
  });

  const [updated] = await db
    .update(schema.units)
    .set({ currentDriverId: input.driverId, status: "active" })
    .where(eq(schema.units.id, input.unitId))
    .returning();

  if (input.previousUnitId && input.previousUnitId !== input.unitId) {
    await db.update(schema.units).set({ status: "tas" }).where(eq(schema.units.id, input.previousUnitId));
  }

  return updated;
}

export async function listUnitTargets(unitId: string) {
  return db.select().from(schema.unitTargets).where(eq(schema.unitTargets.unitId, unitId));
}

export async function upsertUnitTarget(input: { unitId: string; periodMonth: string; targetKm: number; setBy?: string }) {
  const [row] = await db
    .insert(schema.unitTargets)
    .values({
      unitId: input.unitId,
      periodMonth: `${input.periodMonth}-01`,
      targetKm: input.targetKm,
      setBy: input.setBy,
    })
    .onConflictDoUpdate({
      target: [schema.unitTargets.unitId, schema.unitTargets.periodMonth],
      set: { targetKm: input.targetKm, setBy: input.setBy },
    })
    .returning();
  return row;
}

/* ------------------------------------------------------------------ routes */

export async function listRoutes(companyId?: string) {
  const rows = companyId
    ? await db.select().from(schema.routes).where(eq(schema.routes.companyId, companyId))
    : await db.select().from(schema.routes);
  const versions = await db.select().from(schema.routeVersions);
  return rows.map((route) => ({
    route,
    versions: versions.filter((version) => version.routeId === route.id),
  }));
}

export async function createRoute(input: {
  companyId: string;
  customerId?: string;
  code: string;
  originLabel: string;
  destinationLabel: string;
  originRegionId?: string;
  destinationRegionId?: string;
  cargoType?: string;
}) {
  return db.insert(schema.routes).values(input).returning();
}

/** A monthly OA update always creates a new version with its own unique code. */
export async function createRouteVersion(input: {
  routeId: string;
  periodMonth: string;
  distanceKm: number;
  oaAmount: number;
  createdBy?: string;
}) {
  const [route] = await db.select().from(schema.routes).where(eq(schema.routes.id, input.routeId));
  if (!route) return null;

  const [row] = await db
    .insert(schema.routeVersions)
    .values({
      routeId: route.id,
      uniqueCode: `${route.code}-${input.periodMonth}`,
      periodMonth: `${input.periodMonth}-01`,
      distanceKm: String(input.distanceKm),
      oaAmount: String(input.oaAmount),
      effectiveFrom: `${input.periodMonth}-01`,
      createdBy: input.createdBy,
    })
    .returning();
  return row;
}

export async function listRouteFilters(routeVersionId: string) {
  return db
    .select()
    .from(schema.routeFilters)
    .where(eq(schema.routeFilters.routeVersionId, routeVersionId));
}

export async function createRouteFilter(input: {
  routeVersionId: string;
  allowPlates?: string[];
  minYear?: number;
  requiredSpec?: string;
  notes?: string;
}) {
  return db
    .insert(schema.routeFilters)
    .values({
      routeVersionId: input.routeVersionId,
      allowPlates: input.allowPlates ?? [],
      minYear: input.minYear,
      requiredSpec: input.requiredSpec,
      notes: input.notes,
    })
    .returning();
}

/* ---------------------------------------------------------- delivery orders */

export async function listDeliveryOrders(companyId?: string) {
  const query = db.select().from(schema.deliveryOrders);
  if (companyId) return query.where(eq(schema.deliveryOrders.companyId, companyId));
  return query;
}

export async function createDeliveryOrder(input: {
  companyId: string;
  doNumber: string;
  routeVersionId: string;
  cargoType?: string;
  requestedUnits: number;
  relationUserId?: string;
  requestDate: string;
  notes?: string;
}) {
  return db
    .insert(schema.deliveryOrders)
    .values({
      companyId: input.companyId,
      doNumber: input.doNumber,
      routeVersionId: input.routeVersionId,
      cargoType: input.cargoType,
      requestedUnits: input.requestedUnits,
      relationUserId: input.relationUserId,
      requestDate: input.requestDate,
      status: "pending",
      notes: input.notes,
    })
    .returning();
}

export async function fillDeliveryOrderOa(id: string, oaAmount: number, marketingUserId?: string) {
  const [row] = await db
    .update(schema.deliveryOrders)
    .set({
      oaAmount: String(oaAmount),
      oaFilledBy: marketingUserId,
      oaFilledAt: new Date(),
      marketingUserId,
      status: "priced",
    })
    .where(eq(schema.deliveryOrders.id, id))
    .returning();
  return row ?? null;
}

/* ----------------------------------------------------------------- matrix */

/**
 * First and last day of a `YYYY-MM` month as ISO dates.
 * A literal `-31` suffix breaks in PostgreSQL for 30-day months (November,
 * April, ...), so the last day is computed instead of hard-coded.
 */
function monthRange(month: string): { first: string; last: string } {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return { first: `${month}-01`, last: `${month}-${String(lastDay).padStart(2, "0")}` };
}

export async function listMatrix(query: { unitId?: string; month?: string; date?: string }) {
  if (query.unitId && query.month) {
    return db
      .select()
      .from(schema.operationMatrices)
      .where(
        and(
          eq(schema.operationMatrices.unitId, query.unitId),
          gte(schema.operationMatrices.matrixDate, monthRange(query.month).first),
          lte(schema.operationMatrices.matrixDate, monthRange(query.month).last),
        ),
      )
      .orderBy(asc(schema.operationMatrices.matrixDate));
  }
  if (query.date) {
    return db
      .select()
      .from(schema.operationMatrices)
      .where(eq(schema.operationMatrices.matrixDate, query.date));
  }
  return db.select().from(schema.operationMatrices);
}

export interface MatrixInput {
  unitId: string;
  driverId?: string;
  matrixDate: string;
  status: MatrixStatus;
  kmValue?: number;
  noteKm?: number;
  pic?: PicSource;
  info?: string;
  infoSource?: InfoSource;
  problem?: string;
  solution?: string;
  sop?: string;
  korlapId?: string;
  updatedBy?: string;
  actingRole?: string;
}

export async function upsertMatrix(input: MatrixInput) {
  if (NEEDS_INFO.has(input.status) && !input.info) {
    return { error: "info_required" as const, status: input.status };
  }

  // PIC is Operasional whenever the Korlap updates; only an admin may switch it.
  const isAdmin = input.actingRole === "super_admin" || input.actingRole === "admin";
  const pic: PicSource = isAdmin && input.pic ? input.pic : "Operasional";

  const [row] = await db
    .insert(schema.operationMatrices)
    .values({
      unitId: input.unitId,
      driverId: input.driverId,
      matrixDate: input.matrixDate,
      status: input.status,
      kmValue: input.status === "KM" ? input.kmValue : null,
      noteKm: input.noteKm,
      pic,
      info: input.info,
      infoSource: input.infoSource ?? (isAdmin ? "Manajemen" : "Korlap"),
      problem: isAdmin ? input.problem : undefined,
      solution: isAdmin ? input.solution : undefined,
      sop: isAdmin ? input.sop : undefined,
      korlapId: input.korlapId,
      updatedBy: input.updatedBy,
    })
    .onConflictDoUpdate({
      target: [schema.operationMatrices.unitId, schema.operationMatrices.matrixDate],
      set: {
        status: input.status,
        kmValue: input.status === "KM" ? input.kmValue : null,
        noteKm: input.noteKm,
        pic,
        info: input.info,
        driverId: input.driverId,
        updatedAt: new Date(),
      },
    })
    .returning();

  return { row };
}

/* -------------------------------------------------------------------- KPI */

export async function kpi(query: { unitId?: string; month?: string; day?: string }) {
  const month = query.month ?? new Date().toISOString().slice(0, 7);
  const range = monthRange(month);
  const rows = await db
    .select()
    .from(schema.operationMatrices)
    .where(
      and(
        query.unitId ? eq(schema.operationMatrices.unitId, query.unitId) : undefined,
        gte(schema.operationMatrices.matrixDate, range.first),
        lte(schema.operationMatrices.matrixDate, range.last),
      ),
    );

  const units = query.unitId
    ? await db.select().from(schema.units).where(eq(schema.units.id, query.unitId))
    : await db.select().from(schema.units);

  const targets = await db
    .select()
    .from(schema.unitTargets)
    .where(eq(schema.unitTargets.periodMonth, `${month}-01`));

  const day = Number(query.day ?? new Date().toISOString().slice(8, 10));
  const runningTarget = dailyTargetPercent(day);

  return units.map((unit) => {
    const own = rows.filter((row) => row.unitId === unit.id);
    const totalKm = own.reduce((sum, row) => sum + (row.status === "KM" ? (row.kmValue ?? 0) : 0), 0);
    const targetKm = targets.find((target) => target.unitId === unit.id)?.targetKm ?? 0;
    const achievement = achievementPercent(totalKm, targetKm);

    return {
      unitId: unit.id,
      plateNumber: unit.plateNumber,
      driverId: unit.currentDriverId,
      month,
      totalKm,
      targetKm,
      totalTrips: own.filter((row) => row.status === "KM").length,
      totalNup: own.filter((row) => row.status === "NUP").length,
      totalStandby: own.filter((row) => row.status === "S.T").length,
      achievement,
      runningTarget,
      band: performanceBand(achievement, runningTarget),
    };
  });
}

/* ------------------------------------------------------------------- FIFO */

export async function fifo(query: { routeVersionId?: string; date?: string }) {
  const date = query.date ?? new Date().toISOString().slice(0, 10);
  const standby = await db
    .select({
      unitId: schema.operationMatrices.unitId,
      driverId: schema.operationMatrices.driverId,
      plateNumber: schema.units.plateNumber,
      year: schema.units.year,
      specification: schema.units.specification,
      finishedAt: schema.operationMatrices.updatedAt,
    })
    .from(schema.operationMatrices)
    .innerJoin(schema.units, eq(schema.units.id, schema.operationMatrices.unitId))
    .where(and(eq(schema.operationMatrices.status, "S.T"), eq(schema.operationMatrices.matrixDate, date)))
    .orderBy(asc(schema.operationMatrices.updatedAt));

  if (!query.routeVersionId) return standby;

  const [filter] = await db
    .select()
    .from(schema.routeFilters)
    .where(eq(schema.routeFilters.routeVersionId, query.routeVersionId));

  if (!filter) return standby;

  const allow = filter.allowPlates ?? [];
  return standby.filter((unit) => {
    if (allow.length && !allow.includes(unit.plateNumber)) return false;
    if (filter.minYear && (unit.year ?? 0) < filter.minYear) return false;
    if (filter.requiredSpec && unit.specification !== filter.requiredSpec) return false;
    return true;
  });
}

/* ------------------------------------------------------- region dashboard */

export async function regionDashboard(query: { regionId?: string; date?: string }) {
  const date = query.date ?? new Date().toISOString().slice(0, 10);
  const month = date.slice(0, 7);

  const [kmRow] = await db
    .select({
      totalKm: sql<number>`coalesce(sum(case when ${schema.operationMatrices.status} = 'KM' then ${schema.operationMatrices.kmValue} else 0 end), 0)::int`,
    })
    .from(schema.operationMatrices)
    .innerJoin(schema.units, eq(schema.units.id, schema.operationMatrices.unitId))
    .where(
      and(
        eq(schema.operationMatrices.matrixDate, date),
        query.regionId ? eq(schema.units.regionId, query.regionId) : undefined,
      ),
    );

  const [workingRow] = await db
    .select({ workingUnits: sql<number>`count(distinct ${schema.operationMatrices.unitId})::int` })
    .from(schema.operationMatrices)
    .innerJoin(schema.units, eq(schema.units.id, schema.operationMatrices.unitId))
    .where(
      and(
        eq(schema.operationMatrices.matrixDate, date),
        query.regionId ? eq(schema.units.regionId, query.regionId) : undefined,
      ),
    );

  const [requestedRow] = await db
    .select({ requestedUnits: sql<number>`coalesce(sum(${schema.deliveryOrders.requestedUnits}), 0)::int` })
    .from(schema.deliveryOrders)
    .where(eq(schema.deliveryOrders.requestDate, date));

  const targets = await db
    .select({ targetKm: sql<number>`coalesce(sum(${schema.unitTargets.targetKm}), 0)::int` })
    .from(schema.unitTargets)
    .innerJoin(schema.units, eq(schema.units.id, schema.unitTargets.unitId))
    .where(
      and(
        eq(schema.unitTargets.periodMonth, `${month}-01`),
        query.regionId ? eq(schema.units.regionId, query.regionId) : undefined,
      ),
    );

  const totalKm = kmRow?.totalKm ?? 0;
  const workingUnits = workingRow?.workingUnits ?? 0;
  const requestedUnits = requestedRow?.requestedUnits ?? 0;

  return {
    date,
    regionId: query.regionId ?? null,
    totalKm,
    targetKm: targets[0]?.targetKm ?? 0,
    workingUnits,
    requestedUnits,
    fulfilmentRatio: requestedUnits ? Number((workingUnits / requestedUnits).toFixed(2)) : null,
  };
}