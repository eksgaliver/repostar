/**
 * S.T.A.R.S ERP - Drizzle schema.
 *
 * Every business table carries `company_id` (multi-tenant rule from the PRD):
 * a company can never read another company's rows. Cross-company reads are
 * only possible through the super_admin role.
 */
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ enums */

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "hr_admin",
  "opr_admin",
  "kpi_admin",
  "manager",
  "staff",
]);

export const employeeTypeEnum = pgEnum("employee_type", ["S", "D", "MK"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive", "resigned"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "H",
  "ALFA",
  "C",
  "CDT",
  "WFH",
  "DINAS",
  "SAKIT",
  "LATE",
]);

export const requestTypeEnum = pgEnum("request_type", [
  "cuti",
  "wfh",
  "dinas_luar",
  "sakit",
  "koreksi_absen",
  "lembur",
  "reimbursement",
]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected", "cancelled"]);

/** Harian matrix codes, exactly as the field team writes them. */
export const matrixStatusEnum = pgEnum("matrix_status", [
  "P.M",
  "P.B",
  "KM",
  "TPR",
  "TR",
  "A.B",
  "S.T",
  "NUP",
  "NUPL",
  "PART",
  "REJECT",
  "INSIDEN",
  "C",
  "TAS",
  "B.M",
  "A.M",
  "HUJAN",
  "BUBUT",
  "RJ",
  "PR",
]);

export const picSourceEnum = pgEnum("pic_source", ["Operasional", "Marketing/Alam"]);
export const infoSourceEnum = pgEnum("info_source", ["Korlap", "Manajemen"]);
export const unitStatusEnum = pgEnum("unit_status", ["active", "tas"]);
export const bulletinStatusEnum = pgEnum("bulletin_status", ["draft", "pending", "published", "rejected"]);
export const doStatusEnum = pgEnum("do_status", ["pending", "priced", "scheduled", "completed", "cancelled"]);
export const assetConditionEnum = pgEnum("asset_condition", ["good", "fair", "damaged"]);

/** Inter-company secondment moves through three approvals, in this order. */
export const secondmentStatusEnum = pgEnum("secondment_status", [
  "pending_from",
  "pending_to",
  "pending_super",
  "approved",
  "rejected",
  "cancelled",
]);

/* -------------------------------------------------------------- master data */

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  legalName: varchar("legal_name", { length: 200 }),
  defaultTimezone: varchar("default_timezone", { length: 64 }).notNull().default("Asia/Jakarta"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const regions = pgTable(
  "regions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    /** PK, KT, KH, KB ... */
    code: varchar("code", { length: 8 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Jakarta"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("regions_company_code_idx").on(t.companyId, t.code)],
);

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 16 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    address: text("address"),
    timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Jakarta"),
    isOperational: boolean("is_operational").notNull().default(true),
  },
  (t) => [uniqueIndex("branches_region_code_idx").on(t.regionId, t.code)],
);

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 16 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("departments_company_code_idx").on(t.companyId, t.code)],
);

export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

/** One row per weekday: 0 = Sunday ... 6 = Saturday. */
export const shiftDays = pgTable(
  "shift_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    isWorkDay: boolean("is_work_day").notNull().default(true),
    startTime: time("start_time"),
    endTime: time("end_time"),
  },
  (t) => [uniqueIndex("shift_days_shift_day_idx").on(t.shiftId, t.dayOfWeek)],
);

/** Geofence points. One employee may be attached to several of them. */
export const attendanceLocations = pgTable("attendance_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  regionId: uuid("region_id")
    .notNull()
    .references(() => regions.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  radiusMeters: integer("radius_meters").notNull().default(150),
  timezone: varchar("timezone", { length: 64 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

/* ------------------------------------------------------------------- people */

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id),
    branchId: uuid("branch_id").references(() => branches.id),
    departmentId: uuid("department_id").references(() => departments.id),
    shiftId: uuid("shift_id").references(() => shifts.id),
    /** [RegionCode].[Type].[Seq] -> PK.D.001 */
    employeeCode: varchar("employee_code", { length: 24 }).notNull().unique(),
    type: employeeTypeEnum("type").notNull().default("S"),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    nickname: varchar("nickname", { length: 80 }),
    nik: varchar("nik", { length: 32 }),
    birthDate: date("birth_date"),
    gender: genderEnum("gender"),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 160 }),
    address: text("address"),
    joinDate: date("join_date").notNull(),
    resignDate: date("resign_date"),
    status: employeeStatusEnum("status").notNull().default("active"),
    isDepartmentHead: boolean("is_department_head").notNull().default(false),
    /** Korlap: field coordinator for the operational division. */
    isFieldCoordinator: boolean("is_field_coordinator").notNull().default(false),
    /** HRIS classification, maintained by Admin KPI; shown as "Front - Level 2". */
    tier: varchar("tier", { length: 16 }),
    level: integer("level"),
    /** Contract watch: PKWT / PKWTT / Probation plus its end date. */
    contractType: varchar("contract_type", { length: 24 }),
    contractEndDate: date("contract_end_date"),
    /** Kepala Divisi / atasan langsung. */
    managerId: uuid("manager_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("employees_company_idx").on(t.companyId, t.status),
    index("employees_region_idx").on(t.regionId),
  ],
);

/** Biodata stays in `employees`; driver specifics live here (query speed rule). */
export const driverProfiles = pgTable("driver_profiles", {
  employeeId: uuid("employee_id")
    .primaryKey()
    .references(() => employees.id, { onDelete: "cascade" }),
  simNumber: varchar("sim_number", { length: 40 }),
  simType: varchar("sim_type", { length: 8 }),
  simExpiry: date("sim_expiry"),
  experienceYears: integer("experience_years"),
  homeBaseBranchId: uuid("home_base_branch_id").references(() => branches.id),
});

export const mechanicProfiles = pgTable("mechanic_profiles", {
  employeeId: uuid("employee_id")
    .primaryKey()
    .references(() => employees.id, { onDelete: "cascade" }),
  specialization: varchar("specialization", { length: 120 }),
  certification: varchar("certification", { length: 120 }),
  level: varchar("level", { length: 40 }),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    email: varchar("email", { length: 160 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    role: userRoleEnum("role").notNull().default("staff"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_company_role_idx").on(t.companyId, t.role)],
);

/**
 * Reset tokens are stored as a SHA-256 hash, never in clear text. A token is
 * single use (`usedAt`) and expires 30 minutes after it was requested.
 */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("password_reset_tokens_hash_idx").on(t.tokenHash)],
);

export const employeeLocations = pgTable(
  "employee_locations",
  {
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => attendanceLocations.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("employee_locations_pk").on(t.employeeId, t.locationId)],
);

/* --------------------------------------------------------------- attendance */

/** 26th -> 25th cycle. */
export const cutoffPeriods = pgTable(
  "cutoff_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    isClosed: boolean("is_closed").notNull().default(false),
  },
  (t) => [uniqueIndex("cutoff_periods_company_start_idx").on(t.companyId, t.periodStart)],
);

export const attendances = pgTable(
  "attendances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    locationId: uuid("location_id").references(() => attendanceLocations.id),
    workDate: date("work_date").notNull(),
    /** IANA zone of the location where the punch happened. */
    timezone: varchar("timezone", { length: 64 }).notNull(),
    clockInAt: timestamp("clock_in_at", { withTimezone: true }),
    clockOutAt: timestamp("clock_out_at", { withTimezone: true }),
    status: attendanceStatusEnum("status").notNull().default("ALFA"),
    lateMinutes: integer("late_minutes").notNull().default(0),
    /** Anti-fake GPS + selfie watermark, per PRD C.2. */
    selfieUrl: text("selfie_url"),
    isMockLocation: boolean("is_mock_location").notNull().default(false),
    source: varchar("source", { length: 16 }).notNull().default("web"),
    /** Offline queue from expo-sqlite stamps this when it finally syncs. */
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("attendances_employee_date_idx").on(t.employeeId, t.workDate)],
);

export const attendanceRequests = pgTable(
  "attendance_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    type: requestTypeEnum("type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    leaveDays: integer("leave_days").notNull().default(1),
    reason: text("reason"),
    attachmentUrl: text("attachment_url"),
    /** Overtime: hours + reason, raw data for Finance (no rupiah here). */
    overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2 }),
    /** Reimbursement: amount + receipt photo. */
    amount: numeric("amount", { precision: 14, scale: 2 }),
    receiptUrl: text("receipt_url"),
    status: requestStatusEnum("status").notNull().default("pending"),
    approverId: uuid("approver_id").references(() => employees.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    /** Final HR validation after the department head approves. */
    hrValidatorId: uuid("hr_validator_id").references(() => employees.id),
    hrValidatedAt: timestamp("hr_validated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attendance_requests_employee_idx").on(t.employeeId, t.status)],
);

export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    entitled: integer("entitled").notNull().default(12),
    used: integer("used").notNull().default(0),
  },
  (t) => [uniqueIndex("leave_balances_employee_period_idx").on(t.employeeId, t.periodStart)],
);

/* -------------------------------------------------------------------- fleet */

export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id),
    branchId: uuid("branch_id").references(() => branches.id),
    plateNumber: varchar("plate_number", { length: 24 }).notNull().unique(),
    brand: varchar("brand", { length: 80 }),
    model: varchar("model", { length: 80 }),
    year: integer("year"),
    specification: varchar("specification", { length: 160 }),
    status: unitStatusEnum("status").notNull().default("active"),
    /** 1:1 rule - one unit, one driver. */
    currentDriverId: uuid("current_driver_id").references(() => employees.id),
    korlapId: uuid("korlap_id").references(() => employees.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("units_company_region_idx").on(t.companyId, t.regionId)],
);

export const unitAssignments = pgTable(
  "unit_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => employees.id),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("unit_assignments_unit_idx").on(t.unitId, t.isActive)],
);

/** Monthly KM target per unit, set by the system admin. */
export const unitTargets = pgTable(
  "unit_targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    /** Always the 1st of the month. */
    periodMonth: date("period_month").notNull(),
    targetKm: integer("target_km").notNull(),
    setBy: uuid("set_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("unit_targets_unit_period_idx").on(t.unitId, t.periodMonth)],
);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 24 }),
  name: varchar("name", { length: 160 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id),
  code: varchar("code", { length: 32 }).notNull(),
  originLabel: varchar("origin_label", { length: 120 }).notNull(),
  destinationLabel: varchar("destination_label", { length: 120 }).notNull(),
  originRegionId: uuid("origin_region_id").references(() => regions.id),
  destinationRegionId: uuid("destination_region_id").references(() => regions.id),
  cargoType: varchar("cargo_type", { length: 80 }),
  isActive: boolean("is_active").notNull().default(true),
});

/**
 * OA changes every month, so every monthly update creates a brand-new row with
 * its own unique route code. Old months keep pointing at their old row.
 */
export const routeVersions = pgTable(
  "route_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    /** e.g. RTE-PKU-DMI-2026-11 */
    uniqueCode: varchar("unique_code", { length: 64 }).notNull().unique(),
    periodMonth: date("period_month").notNull(),
    distanceKm: numeric("distance_km", { precision: 8, scale: 2 }).notNull().default("0"),
    oaAmount: numeric("oa_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    effectiveFrom: date("effective_from").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("route_versions_route_period_idx").on(t.routeId, t.periodMonth)],
);

/** FIFO special filters per route version. */
export const routeFilters = pgTable("route_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  routeVersionId: uuid("route_version_id")
    .notNull()
    .references(() => routeVersions.id, { onDelete: "cascade" }),
  allowPlates: jsonb("allow_plates").$type<string[]>().default([]),
  minYear: integer("min_year"),
  requiredSpec: varchar("required_spec", { length: 160 }),
  notes: text("notes"),
});

export const deliveryOrders = pgTable(
  "delivery_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    doNumber: varchar("do_number", { length: 48 }).notNull(),
    routeVersionId: uuid("route_version_id")
      .notNull()
      .references(() => routeVersions.id),
    cargoType: varchar("cargo_type", { length: 80 }),
    requestedUnits: integer("requested_units").notNull().default(0),
    /** Filled by Marketing, never by Relation. */
    oaAmount: numeric("oa_amount", { precision: 14, scale: 2 }),
    oaFilledBy: uuid("oa_filled_by").references(() => users.id),
    oaFilledAt: timestamp("oa_filled_at", { withTimezone: true }),
    relationUserId: uuid("relation_user_id").references(() => users.id),
    marketingUserId: uuid("marketing_user_id").references(() => users.id),
    requestDate: date("request_date").notNull(),
    status: doStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("delivery_orders_company_do_idx").on(t.companyId, t.doNumber)],
);

/* -------------------------------------------- operational matrix (day 1-31) */

export const operationMatrices = pgTable(
  "operation_matrices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id").references(() => employees.id),
    matrixDate: date("matrix_date").notNull(),
    status: matrixStatusEnum("status").notNull(),
    /** Only `KM` counts. B.M / A.M keep their distance in `noteKm`. */
    kmValue: integer("km_value"),
    noteKm: integer("note_km"),
    pic: picSourceEnum("pic").notNull().default("Operasional"),
    info: text("info"),
    infoSource: infoSourceEnum("info_source"),
    problem: text("problem"),
    solution: text("solution"),
    sop: text("sop"),
    korlapId: uuid("korlap_id").references(() => employees.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("operation_matrices_unit_date_idx").on(t.unitId, t.matrixDate),
    index("operation_matrices_date_idx").on(t.matrixDate),
  ],
);

/* ------------------------------------------------------------ assets & news */

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }),
  serialNumber: varchar("serial_number", { length: 80 }),
  assignedEmployeeId: uuid("assigned_employee_id").references(() => employees.id, { onDelete: "set null" }),
  assignedAt: date("assigned_at"),
  condition: assetConditionEnum("condition").notNull().default("good"),
  notes: text("notes"),
});

export const bulletins = pgTable("bulletins", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").references(() => departments.id),
  authorId: uuid("author_id").references(() => employees.id),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  status: bulletinStatusEnum("status").notNull().default("draft"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------ inter-company portal (B) */

/** A user can belong to several tenants and switch workspace without re-login. */
export const companyMemberships = pgTable(
  "company_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull().default("staff"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("company_memberships_user_company_idx").on(t.userId, t.companyId)],
);

/** Secondment / mutation: HR asal -> HR tujuan -> Super Admin. */
export const secondments = pgTable(
  "secondments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    fromCompanyId: uuid("from_company_id")
      .notNull()
      .references(() => companies.id),
    toCompanyId: uuid("to_company_id")
      .notNull()
      .references(() => companies.id),
    kind: varchar("kind", { length: 16 }).notNull().default("secondment"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    reason: text("reason"),
    status: secondmentStatusEnum("status").notNull().default("pending_from"),
    fromApprovedAt: timestamp("from_approved_at", { withTimezone: true }),
    toApprovedAt: timestamp("to_approved_at", { withTimezone: true }),
    superApprovedAt: timestamp("super_approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("secondments_employee_idx").on(t.employeeId, t.status)],
);

/** Granular sharing between two tenants; OA and personal data are separately gated. */
export const dataSharingRules = pgTable(
  "data_sharing_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    partnerCompanyId: uuid("partner_company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    allowSummary: boolean("allow_summary").notNull().default(true),
    allowFleet: boolean("allow_fleet").notNull().default(true),
    allowDirectory: boolean("allow_directory").notNull().default(true),
    allowOa: boolean("allow_oa").notNull().default(false),
    allowPersonal: boolean("allow_personal").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("data_sharing_pair_idx").on(t.companyId, t.partnerCompanyId)],
);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Company = typeof companies.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type OperationMatrix = typeof operationMatrices.$inferSelect;
export type MatrixStatus = (typeof matrixStatusEnum.enumValues)[number];