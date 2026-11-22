/**
 * Model layer - company domain.
 * `wmplOverview()` is the single query bundle behind the dedicated /wmpl
 * workspace page on web and mobile.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/client";

export const WMPL_CODE = "WMPL";

export async function findCompanyByCode(code = WMPL_CODE) {
  const [company] = await db.select().from(schema.companies).where(eq(schema.companies.code, code)).limit(1);
  return company ?? null;
}

export async function listCompanies() {
  return db.select().from(schema.companies).orderBy(schema.companies.name);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function wmplOverview(code = WMPL_CODE) {
  const company = await findCompanyByCode(code);
  if (!company) return null;

  const [regionRows, branchRows, departmentRows, bulletinRows] = await Promise.all([
    db.select().from(schema.regions).where(eq(schema.regions.companyId, company.id)),
    db
      .select({
        id: schema.branches.id,
        regionId: schema.branches.regionId,
        code: schema.branches.code,
        name: schema.branches.name,
        timezone: schema.branches.timezone,
        isOperational: schema.branches.isOperational,
      })
      .from(schema.branches)
      .innerJoin(schema.regions, eq(schema.regions.id, schema.branches.regionId))
      .where(eq(schema.regions.companyId, company.id)),
    db.select().from(schema.departments).where(eq(schema.departments.companyId, company.id)),
    db
      .select()
      .from(schema.bulletins)
      .where(and(eq(schema.bulletins.companyId, company.id), eq(schema.bulletins.status, "published")))
      .orderBy(desc(schema.bulletins.publishedAt))
      .limit(5),
  ]);

  const date = todayISO();

  const [headcountRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      staff: sql<number>`(count(*) filter (where ${schema.employees.type} = 'S'))::int`,
      drivers: sql<number>`(count(*) filter (where ${schema.employees.type} = 'D'))::int`,
      mechanics: sql<number>`(count(*) filter (where ${schema.employees.type} = 'MK'))::int`,
    })
    .from(schema.employees)
    .where(and(eq(schema.employees.companyId, company.id), eq(schema.employees.status, "active")));

  const [fleetRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`(count(*) filter (where ${schema.units.status} = 'active'))::int`,
      tas: sql<number>`(count(*) filter (where ${schema.units.status} = 'tas'))::int`,
      regionsCovered: sql<number>`count(distinct ${schema.units.regionId})::int`,
    })
    .from(schema.units)
    .where(eq(schema.units.companyId, company.id));

  const [operationRow] = await db
    .select({
      totalKm: sql<number>`coalesce(sum(case when ${schema.operationMatrices.status} = 'KM' then ${schema.operationMatrices.kmValue} else 0 end), 0)::int`,
      workingUnits: sql<number>`count(distinct ${schema.operationMatrices.unitId})::int`,
      standby: sql<number>`(count(*) filter (where ${schema.operationMatrices.status} = 'S.T'))::int`,
      workshop: sql<number>`(count(*) filter (where ${schema.operationMatrices.status} in ('NUP', 'NUPL')))::int`,
    })
    .from(schema.operationMatrices)
    .innerJoin(schema.units, eq(schema.units.id, schema.operationMatrices.unitId))
    .where(and(eq(schema.units.companyId, company.id), eq(schema.operationMatrices.matrixDate, date)));

  const [demandRow] = await db
    .select({
      requestedUnits: sql<number>`coalesce(sum(${schema.deliveryOrders.requestedUnits}), 0)::int`,
      orders: sql<number>`count(*)::int`,
      pendingOa: sql<number>`(count(*) filter (where ${schema.deliveryOrders.oaAmount} is null))::int`,
    })
    .from(schema.deliveryOrders)
    .where(and(eq(schema.deliveryOrders.companyId, company.id), eq(schema.deliveryOrders.requestDate, date)));

  const regions = regionRows.map((region) => ({
    id: region.id,
    code: region.code,
    name: region.name,
    timezone: region.timezone,
    isActive: region.isActive,
    branches: branchRows
      .filter((branch) => branch.regionId === region.id)
      .map((branch) => ({
        id: branch.id,
        code: branch.code,
        name: branch.name,
        timezone: branch.timezone,
        isOperational: branch.isOperational,
      })),
  }));

  return {
    company: {
      id: company.id,
      code: company.code,
      name: company.name,
      legalName: company.legalName,
      defaultTimezone: company.defaultTimezone,
      isActive: company.isActive,
    },
    regions,
    departments: departmentRows.map((department) => ({
      id: department.id,
      code: department.code,
      name: department.name,
    })),
    headcount: {
      total: headcountRow?.total ?? 0,
      staff: headcountRow?.staff ?? 0,
      drivers: headcountRow?.drivers ?? 0,
      mechanics: headcountRow?.mechanics ?? 0,
    },
    fleet: {
      total: fleetRow?.total ?? 0,
      active: fleetRow?.active ?? 0,
      tas: fleetRow?.tas ?? 0,
      regionsCovered: fleetRow?.regionsCovered ?? 0,
    },
    operations: {
      date,
      totalKm: operationRow?.totalKm ?? 0,
      workingUnits: operationRow?.workingUnits ?? 0,
      standby: operationRow?.standby ?? 0,
      workshop: operationRow?.workshop ?? 0,
      deliveryOrders: demandRow?.orders ?? 0,
      requestedUnits: demandRow?.requestedUnits ?? 0,
      pendingOa: demandRow?.pendingOa ?? 0,
    },
    bulletins: bulletinRows,
  };
}