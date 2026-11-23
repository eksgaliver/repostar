/**
 * View layer: the only place that decides what leaves the API.
 * Controllers hand a model result to a view and return it untouched.
 */
import type { Principal } from "../middleware/auth";

type Row = Record<string, unknown>;

/** Never let a hash or a reset token reach the client. */
function stripSecrets<RowType extends Row>(row: RowType): Omit<RowType, "passwordHash" | "tokenHash"> {
  const { passwordHash, tokenHash, ...safe } = row as Row & { passwordHash?: unknown; tokenHash?: unknown };
  void passwordHash;
  void tokenHash;
  return safe as Omit<RowType, "passwordHash" | "tokenHash">;
}

export const principalView = (principal: Principal) => ({
  userId: principal.userId,
  companyId: principal.companyId,
  role: principal.role,
  email: principal.email,
});

export const userView = (row: Row) => stripSecrets(row);

export const profileView = (row: Row) => ({
  id: row.id,
  email: row.email,
  fullName: row.fullName,
  role: row.role,
  isActive: row.isActive,
  lastLoginAt: row.lastLoginAt,
  createdAt: row.createdAt,
  company:
    row.companyId || row.companyCode
      ? { id: row.companyId, code: row.companyCode, name: row.companyName }
      : null,
  employee: row.employeeId
    ? {
        id: row.employeeId,
        code: row.employeeCode,
        type: row.employeeType,
        nickname: row.nickname,
        phone: row.phone,
        address: row.address,
        joinDate: row.joinDate,
        isDepartmentHead: row.isDepartmentHead,
        region: row.regionCode ? { code: row.regionCode, name: row.regionName } : null,
        department: row.departmentName ?? null,
      }
    : null,
  // Flat mirrors keep the current web form working while the nested shape lands.
  employeeCode: row.employeeCode,
  employeeType: row.employeeType,
  nickname: row.nickname,
  phone: row.phone,
  address: row.address,
  joinDate: row.joinDate,
  isDepartmentHead: row.isDepartmentHead,
  regionCode: row.regionCode,
  regionName: row.regionName,
  departmentName: row.departmentName,
  companyId: row.companyId,
  companyCode: row.companyCode,
  companyName: row.companyName,
});

export const employeeView = (row: Row) => row;

export const attendanceView = (row: Row) => ({
  id: row.id,
  employeeId: row.employeeId,
  locationId: row.locationId,
  workDate: row.workDate,
  timezone: row.timezone,
  clockInAt: row.clockInAt,
  clockOutAt: row.clockOutAt,
  status: row.status,
  lateMinutes: row.lateMinutes,
  note: row.note,
});

export const recapView = (row: Row) => ({
  employeeId: row.employeeId,
  employeeCode: row.employeeCode,
  fullName: row.fullName,
  periodStart: row.periodStart,
  periodEnd: row.periodEnd,
  hadirH: row.hadirH,
  terlambat: row.terlambat,
  cutiC: row.cutiC,
  cdt: row.cdt,
  alfa: row.alfa,
  wfh: row.wfh,
  dinas: row.dinas,
  sakit: row.sakit,
});

export const matrixView = (row: Row) => ({
  id: row.id,
  unitId: row.unitId,
  driverId: row.driverId,
  date: row.matrixDate,
  status: row.status,
  km: row.kmValue,
  noteKm: row.noteKm,
  pic: row.pic,
  info: row.info,
  infoSource: row.infoSource,
  followUp: { problem: row.problem, solution: row.solution, sop: row.sop },
  updatedAt: row.updatedAt,
});

export const kpiView = (row: Row) => ({ ...row });

export const fifoView = (row: Row, index: number) => ({
  queue: index + 1,
  unitId: row.unitId,
  plateNumber: row.plateNumber,
  driverId: row.driverId,
  year: row.year,
  specification: row.specification,
  finishedAt: row.finishedAt,
});

/** Relation never sees the OA nominal; Marketing and admins do. */
export const deliveryOrderView = (row: Row, role: Principal["role"]) => {
  const canSeeOa = role !== "staff" || row.marketingUserId != null;
  return {
    id: row.id,
    doNumber: row.doNumber,
    routeVersionId: row.routeVersionId,
    cargoType: row.cargoType,
    requestedUnits: row.requestedUnits,
    requestDate: row.requestDate,
    status: row.status,
    notes: row.notes,
    ...(canSeeOa
      ? { oaAmount: row.oaAmount, oaFilledAt: row.oaFilledAt }
      : { oaAmount: null, oaHidden: true }),
  };
};

export const routeView = (row: Row, versions: Row[]) => ({
  id: row.id,
  code: row.code,
  customerId: row.customerId,
  origin: row.originLabel,
  destination: row.destinationLabel,
  cargoType: row.cargoType,
  isActive: row.isActive,
  versions: versions.map((version) => ({
    id: version.id,
    uniqueCode: version.uniqueCode,
    periodMonth: version.periodMonth,
    distanceKm: version.distanceKm,
    oaAmount: version.oaAmount,
    effectiveFrom: version.effectiveFrom,
  })),
});

export const regionDashboardView = (row: Row) => ({
  date: row.date,
  regionId: row.regionId,
  totalKm: row.totalKm,
  targetKm: row.targetKm,
  workingUnits: row.workingUnits,
  requestedUnits: row.requestedUnits,
  fulfilmentRatio: row.fulfilmentRatio,
});

export const bulletinView = (row: Row) => ({
  id: row.id,
  title: row.title,
  body: row.body,
  status: row.status,
  departmentId: row.departmentId,
  authorId: row.authorId,
  publishedAt: row.publishedAt,
});

/** Attachments live as JSON text so one letter row carries its own files. */
function parseAttachments(raw: unknown): Row[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Row[];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? (parsed as Row[]) : [];
  } catch {
    return [];
  }
}

/** A letter: the paper view reads the same shape as the list row. */
export const documentView = (row: Row) => ({
  id: row.id,
  companyId: row.companyId,
  type: row.type,
  number: row.number,
  title: row.title,
  body: row.body ?? null,
  signature: row.signature ?? null,
  signerName: row.signerName ?? null,
  signerTitle: row.signerTitle ?? null,
  signerUserId: row.signerUserId ?? null,
  signatureRequestedAt: row.signatureRequestedAt ?? null,
  signedAt: row.signedAt ?? null,
  reviewerUserId: row.reviewerUserId ?? null,
  reviewerName: row.reviewerName ?? null,
  reviewStatus: row.reviewStatus ?? null,
  reviewRequestedAt: row.reviewRequestedAt ?? null,
  reviewedAt: row.reviewedAt ?? null,
  reviewNote: row.reviewNote ?? null,
  attachments: parseAttachments(row.attachments),
  audienceType: row.audienceType ?? "all",
  audienceDepartmentId: row.audienceDepartmentId ?? null,
  audienceDepartmentName: row.departmentName ?? null,
  status: row.status,
  authorId: row.authorId ?? null,
  authorName: row.authorName ?? null,
  sentAt: row.sentAt ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/** An account that can be asked to sign a letter, with its printed position. */
export const signerCandidateView = (row: Row) => ({
  id: row.id,
  fullName: row.fullName,
  role: row.role,
  employeeId: row.employeeId ?? null,
  employeeCode: row.employeeCode ?? null,
  positionName: row.positionName ?? null,
  departmentName: row.departmentName ?? null,
});

/** WMPL workspace payload used by the dedicated /wmpl page on web and mobile. */
export const wmplView = (data: Row) => ({
  company: data.company,
  regions: data.regions,
  departments: data.departments,
  headcount: data.headcount,
  fleet: data.fleet,
  operations: data.operations,
  bulletins: (data.bulletins as Row[]).map(bulletinView),
  generatedAt: new Date().toISOString(),
});