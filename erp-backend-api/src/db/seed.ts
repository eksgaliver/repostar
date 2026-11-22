/**
 * Seeds the WMPL baseline from the PRD: one company, four regions, eight
 * operational branches, the eleven standard departments, one Mon-Sat shift,
 * geofence points, admin accounts, and a small fleet so the dashboard is not
 * empty on first run.
 *
 * Run with: bun run db:seed
 */
import { eq } from "drizzle-orm";
import { db, queryClient } from "./client";
import {
  assets,
  attendanceLocations,
  branches,
  companies,
  companyMemberships,
  dataSharingRules,
  departments,
  deliveryOrders,
  driverProfiles,
  employees,
  leaveBalances,
  operationMatrices,
  regions,
  routeVersions,
  routes,
  shiftDays,
  shifts,
  unitTargets,
  units,
  users,
} from "./schema";

const REGIONS = [
  { code: "PK", name: "Riau", timezone: "Asia/Jakarta", branches: ["Pekanbaru", "Dumai"] },
  { code: "KT", name: "Kalimantan Timur", timezone: "Asia/Makassar", branches: ["Bontang", "Melak", "Labanan"] },
  { code: "KH", name: "Kalimantan Tengah", timezone: "Asia/Jakarta", branches: ["Sampit"] },
  { code: "KB", name: "Kalimantan Barat", timezone: "Asia/Jakarta", branches: ["Sambas", "Ketapang"] },
];

const DEPARTMENTS: ReadonlyArray<readonly [string, string]> = [
  ["ACC", "Akunting"],
  ["FIN", "Finance"],
  ["LGL", "Legal"],
  ["PJK", "Pajak"],
  ["HRD", "HRD"],
  ["REL", "Relation"],
  ["MKT", "Marketing"],
  ["OPR", "Operasional"],
  ["PUR", "Pembelian"],
  ["GDG", "Gudang"],
  ["MNT", "Maintenance"],
];

const COORDS: Record<string, { lat: string; lng: string }> = {
  Pekanbaru: { lat: "0.5070677", lng: "101.4477793" },
  Dumai: { lat: "1.6666667", lng: "101.4500000" },
  Bontang: { lat: "0.1333333", lng: "117.5000000" },
  Melak: { lat: "-0.2333333", lng: "115.8333333" },
  Labanan: { lat: "0.3500000", lng: "117.1833333" },
  Sampit: { lat: "-2.5333333", lng: "112.9500000" },
  Sambas: { lat: "1.3666667", lng: "109.3000000" },
  Ketapang: { lat: "-1.8500000", lng: "109.9833333" },
};

async function main() {
  console.log("Seeding WMPL baseline...");

  const [company] = await db
    .insert(companies)
    .values({
      code: "WMPL",
      name: "WMPL",
      legalName: "Wijaya Manggala Premier Lestari",
      defaultTimezone: "Asia/Jakarta",
    })
    .onConflictDoUpdate({ target: companies.code, set: { name: "WMPL" } })
    .returning();
  if (!company) throw new Error("company seed failed");

  const regionIds: Record<string, string> = {};
  const branchIds: Record<string, string> = {};

  for (const region of REGIONS) {
    const [row] = await db
      .insert(regions)
      .values({ companyId: company.id, code: region.code, name: region.name, timezone: region.timezone })
      .onConflictDoUpdate({
        target: [regions.companyId, regions.code],
        set: { name: region.name, timezone: region.timezone },
      })
      .returning();
    if (!row) continue;
    regionIds[region.code] = row.id;

    for (const branchName of region.branches) {
      const [branch] = await db
        .insert(branches)
        .values({
          regionId: row.id,
          code: branchName.slice(0, 3).toUpperCase(),
          name: branchName,
          timezone: region.timezone,
          address: `${branchName}, ${region.name}`,
        })
        .onConflictDoUpdate({
          target: [branches.regionId, branches.code],
          set: { name: branchName },
        })
        .returning();
      if (!branch) continue;
      branchIds[branchName] = branch.id;

      const coord = COORDS[branchName];
      if (coord) {
        const existing = await db.select().from(attendanceLocations);
        if (!existing.some((loc) => loc.name === `Pool ${branchName}`)) {
          await db.insert(attendanceLocations).values({
            regionId: row.id,
            branchId: branch.id,
            name: `Pool ${branchName}`,
            latitude: coord.lat,
            longitude: coord.lng,
            radiusMeters: 150,
            timezone: region.timezone,
          });
        }
      }
    }
  }

  for (const [code, name] of DEPARTMENTS) {
    await db
      .insert(departments)
      .values({ companyId: company.id, code, name })
      .onConflictDoUpdate({ target: [departments.companyId, departments.code], set: { name } });
  }

  const [shift] = await db
    .insert(shifts)
    .values({ companyId: company.id, name: "Reguler Senin-Sabtu" })
    .returning();
  if (shift) {
    for (let day = 0; day < 7; day += 1) {
      const isSunday = day === 0;
      const isSaturday = day === 6;
      await db
        .insert(shiftDays)
        .values({
          shiftId: shift.id,
          dayOfWeek: day,
          isWorkDay: !isSunday,
          startTime: isSunday ? null : "08:00",
          endTime: isSunday ? null : isSaturday ? "12:00" : "17:00",
        })
        .onConflictDoUpdate({
          target: [shiftDays.shiftId, shiftDays.dayOfWeek],
          set: { isWorkDay: !isSunday, startTime: isSunday ? null : "08:00" },
        });
    }
  }

  const adminAccounts = [
    { email: "superadmin@stars.local", fullName: "Super Admin", role: "super_admin" as const },
    { email: "admin@stars.local", fullName: "Admin Sistem", role: "admin" as const },
    { email: "hrd@stars.local", fullName: "Admin HRD", role: "hr_admin" as const },
    { email: "operasional@stars.local", fullName: "Admin Operasional", role: "opr_admin" as const },
    { email: "manager@stars.local", fullName: "Kepala Divisi", role: "manager" as const },
  ];
  for (const account of adminAccounts) {
    await db
      .insert(users)
      .values({
        companyId: company.id,
        email: account.email,
        passwordHash: await Bun.password.hash("Admin#12345"),
        fullName: account.fullName,
        role: account.role,
      })
      .onConflictDoNothing({ target: users.email });
  }

  /* ----------------------------------------------------------- sample fleet */
  const pekanbaru = regionIds.PK;
  if (!pekanbaru) throw new Error("region PK missing");

  const sampleDrivers = [
    { code: "PK.D.001", name: "Raihan Rivana", sim: "1401-2024-0001" },
    { code: "PK.D.002", name: "Andi Saputra", sim: "1401-2024-0002" },
  ];

  const driverIds: string[] = [];
  for (const driver of sampleDrivers) {
    const [row] = await db
      .insert(employees)
      .values({
        companyId: company.id,
        regionId: pekanbaru,
        branchId: branchIds.Pekanbaru,
        departmentId: null,
        shiftId: shift?.id,
        employeeCode: driver.code,
        type: "D",
        fullName: driver.name,
        joinDate: "2024-01-02",
      })
      .onConflictDoNothing({ target: employees.employeeCode })
      .returning();
    if (!row) continue;
    driverIds.push(row.id);
    await db
      .insert(driverProfiles)
      .values({ employeeId: row.id, simNumber: driver.sim, simType: "B2", homeBaseBranchId: branchIds.Pekanbaru })
      .onConflictDoNothing();
    await db.insert(leaveBalances).values({
      employeeId: row.id,
      periodStart: `${new Date().toISOString().slice(0, 7)}-01`,
      periodEnd: `${new Date().toISOString().slice(0, 7)}-28`,
      entitled: 12,
    });
  }

  const plateSeed = ["BM 8842 RA", "BM 9011 RA"];
  const unitIds: string[] = [];
  for (const [index, plate] of plateSeed.entries()) {
    const [row] = await db
      .insert(units)
      .values({
        companyId: company.id,
        regionId: pekanbaru,
        branchId: branchIds.Pekanbaru,
        plateNumber: plate,
        brand: "Hino",
        model: "FM 260 JD",
        year: 2021 + index,
        specification: "Dump Truck",
        currentDriverId: driverIds[index] ?? null,
      })
      .onConflictDoNothing({ target: units.plateNumber })
      .returning();
    if (!row) continue;
    unitIds.push(row.id);
    await db
      .insert(unitTargets)
      .values({
        unitId: row.id,
        periodMonth: `${new Date().toISOString().slice(0, 7)}-01`,
        targetKm: 9000,
      })
      .onConflictDoNothing();
  }

  const [route] = await db
    .insert(routes)
    .values({
      companyId: company.id,
      code: "PKU-DMI",
      originLabel: "Pekanbaru",
      destinationLabel: "Dumai",
      originRegionId: pekanbaru,
      destinationRegionId: pekanbaru,
      cargoType: "CPO",
    })
    .returning();

  if (route) {
    const [version] = await db
      .insert(routeVersions)
      .values({
        routeId: route.id,
        uniqueCode: `${route.code}-${new Date().toISOString().slice(0, 7)}`,
        periodMonth: `${new Date().toISOString().slice(0, 7)}-01`,
        distanceKm: "132.00",
        oaAmount: "1850000.00",
        effectiveFrom: `${new Date().toISOString().slice(0, 7)}-01`,
      })
      .onConflictDoNothing({ target: [routeVersions.routeId, routeVersions.periodMonth] })
      .returning();

    if (version) {
      await db.insert(deliveryOrders).values({
        companyId: company.id,
        doNumber: `DO-${new Date().toISOString().slice(0, 7).replace("-", "")}-001`,
        routeVersionId: version.id,
        cargoType: "CPO",
        requestedUnits: 4,
        requestDate: new Date().toISOString().slice(0, 10),
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayStatuses = ["P.M", "KM", "P.B", "S.T"] as const;
  for (const [index, unitId] of unitIds.entries()) {
    const day = Number(today.slice(8, 10));
    await db
      .insert(operationMatrices)
      .values({
        unitId,
        driverId: driverIds[index] ?? null,
        matrixDate: today,
        status: todayStatuses[index % todayStatuses.length] ?? "S.T",
        kmValue: 132,
        pic: "Operasional",
        info: "Seed data harian",
        infoSource: "Korlap",
      })
      .onConflictDoNothing({ target: [operationMatrices.unitId, operationMatrices.matrixDate] });

    void day;
  }

  await db.insert(assets).values([
    { companyId: company.id, code: "AST-HP-001", name: "Handphone Operasional", category: "Elektronik" },
    { companyId: company.id, code: "AST-GPS-001", name: "GPS Tracker", category: "Perangkat" },
  ]);

  /* ------------------------------------------- inter-company portal (PRD B) */
  const [affiliate] = await db
    .insert(companies)
    .values({
      code: "MNU",
      name: "PT Mitra Nusantara",
      legalName: "PT Mitra Nusantara Logistik",
      defaultTimezone: "Asia/Jakarta",
    })
    .onConflictDoUpdate({ target: companies.code, set: { name: "PT Mitra Nusantara" } })
    .returning();

  const [superAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, "superadmin@stars.local"))
    .limit(1);

  if (superAdmin) {
    const tenants: { companyId: string; isDefault: boolean }[] = [
      { companyId: company.id, isDefault: true },
    ];
    if (affiliate) tenants.push({ companyId: affiliate.id, isDefault: false });

    for (const tenant of tenants) {
      await db
        .insert(companyMemberships)
        .values({ userId: superAdmin.id, companyId: tenant.companyId, role: "super_admin", isDefault: tenant.isDefault })
        .onConflictDoNothing();
    }
  }

  if (affiliate) {
    // Summary / fleet / directory shared; OA and personal data stay locked.
    await db
      .insert(dataSharingRules)
      .values({
        companyId: company.id,
        partnerCompanyId: affiliate.id,
        allowSummary: true,
        allowFleet: true,
        allowDirectory: true,
        allowOa: false,
        allowPersonal: false,
      })
      .onConflictDoNothing();
  }

  console.log("Seed complete.");
  console.log("  company : WMPL - Wijaya Manggala Premier Lestari");
  console.log("  login   : superadmin@stars.local / Admin#12345");
  await queryClient.end({ timeout: 5 });
}

main().catch(async (error) => {
  console.error(error);
  await queryClient.end({ timeout: 5 });
  process.exit(1);
});