/**
 * Employee records for the HR screens. Reads go through `/people/employees`;
 * the onboarding write creates the biodata row and the login account together,
 * and that account starts on the `onboarding` password.
 */
import { apiFetch } from "@/lib/api";

export type EmployeeType = "S" | "D" | "MK";
export type EmployeeStatus = "active" | "inactive" | "resigned";

export interface EmployeeRow {
  id: string;
  employeeCode: string;
  fullName: string;
  nickname?: string | null;
  nik?: string | null;
  birthDate?: string | null;
  gender?: "male" | "female" | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  /** Data URL of the employee photo. */
  photo?: string | null;
  type: EmployeeType;
  status: EmployeeStatus;
  companyId: string;
  regionId: string;
  branchId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  /** Position name, present on the detail endpoint. */
  position?: string | null;
  shiftId?: string | null;
  joinDate: string;
  resignDate?: string | null;
  contractType?: string | null;
  contractEndDate?: string | null;
  tier?: string | null;
  level?: number | null;
  isDepartmentHead?: boolean;
  isFieldCoordinator?: boolean;
  /** Login account, present on the detail endpoint only. */
  account?: { id: string; email: string; role: string; isActive: boolean } | null;
}

export const TYPE_LABEL: Record<EmployeeType, string> = {
  S: "Staff",
  D: "Supir",
  MK: "Mekanik",
};

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "aktif",
  inactive: "nonaktif",
  resigned: "resign",
};

export interface Option {
  id: string;
  label: string;
}

export async function fetchEmployees(companyId: string): Promise<EmployeeRow[]> {
  const data = await apiFetch<{ employees?: EmployeeRow[] }>(`/people/employees?companyId=${companyId}`);
  return data.employees ?? [];
}

export async function fetchEmployee(employeeId: string): Promise<EmployeeRow | null> {
  const data = await apiFetch<{ employee?: EmployeeRow }>(`/people/employees/${employeeId}`);
  return data.employee ?? null;
}

/** Provinsi, cabang, departemen, dan shift untuk pilihan di form onboarding. */
export async function fetchDirectoryOptions(companyId: string): Promise<{
  regions: Option[];
  branches: Option[];
  departments: Option[];
  shifts: Option[];
}> {
  const [regions, branches, departments, shifts] = await Promise.all([
    apiFetch<{ regions?: Row[] }>(`/master/regions?companyId=${companyId}`).catch(() => ({ regions: [] as Row[] })),
    apiFetch<{ branches?: Row[] }>(`/master/branches`).catch(() => ({ branches: [] as Row[] })),
    apiFetch<{ departments?: Row[] }>(`/master/departments?companyId=${companyId}`).catch(() => ({ departments: [] as Row[] })),
    apiFetch<{ shifts?: Row[] }>(`/master/shifts?companyId=${companyId}`).catch(() => ({ shifts: [] as Row[] })),
  ]);

  return {
    regions: toOptions(regions.regions, (row) => `${row.code} · ${row.name}`),
    branches: toOptions(branches.branches, (row) => String(row.name)),
    departments: toOptions(departments.departments, (row) => String(row.name)),
    shifts: toOptions(shifts.shifts, (row) => String(row.name)),
  };
}

type Row = { id: string; [key: string]: unknown };

function toOptions(rows: Row[] | undefined, label: (row: Row) => string): Option[] {
  return (rows ?? []).map((row) => ({ id: row.id, label: label(row) }));
}

export interface OnboardPayload {
  account: { email: string; role: string };
  profile: {
    companyId: string;
    regionId: string;
    branchId?: string;
    departmentId?: string;
    positionId?: string;
    shiftId?: string;
    type: EmployeeType;
    fullName: string;
    nickname?: string;
    nik?: string;
    birthDate?: string;
    gender?: "male" | "female";
    phone?: string;
    address?: string;
    photo?: string;
    joinDate: string;
    contractType?: string;
    contractEndDate?: string;
    isDepartmentHead?: boolean;
    isFieldCoordinator?: boolean;
  };
}

/** POST /people/employees/onboard — biodata plus the login, one transaction of intent. */
export async function onboardEmployee(payload: OnboardPayload): Promise<{
  employee: EmployeeRow;
  account: { email: string; role: string; onboardingPassword: string };
}> {
  return apiFetch("/people/employees/onboard", {
    method: "POST",
    body: JSON.stringify({ ...payload.profile, account: payload.account }),
  });
}

/** Moves one employee into a department and, at the same time, into a position. */
export async function assignDepartment(
  employeeId: string,
  departmentId: string | null,
  positionId: string | null = null
): Promise<EmployeeRow> {
  const data = await apiFetch<{ employee: EmployeeRow }>(`/people/employees/${employeeId}/department`, {
    method: "PATCH",
    body: JSON.stringify({ departmentId, positionId }),
  });
  return data.employee;
}

/** Super-admin only: changes the role on the linked login account. */
export async function setEmployeeRole(employeeId: string, role: string): Promise<{ role: string }> {
  const data = await apiFetch<{ account: { role: string } }>(`/people/employees/${employeeId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return data.account;
}

export async function resignEmployee(employeeId: string, resignDate: string): Promise<EmployeeRow> {
  const data = await apiFetch<{ employee: EmployeeRow }>(`/people/employees/${employeeId}/resign`, {
    method: "PATCH",
    body: JSON.stringify({ resignDate }),
  });
  return data.employee;
}