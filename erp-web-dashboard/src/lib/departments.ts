/**
 * Departments and their members. Departments come from `/master/departments`;
 * the member list is the employee rows that point at the department, so the
 * avatar group and the table always agree.
 */
import { apiFetch } from "@/lib/api";

export interface DepartmentRow {
  id: string;
  companyId: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface DepartmentMember {
  id: string;
  employeeCode: string;
  fullName: string;
  photo?: string | null;
  type: "S" | "D" | "MK";
  status: "active" | "inactive" | "resigned";
  positionId?: string | null;
  /** Position name, joined server-side. */
  positionName?: string | null;
}

export async function fetchDepartments(companyId: string): Promise<DepartmentRow[]> {
  const data = await apiFetch<{ departments?: DepartmentRow[] }>(`/master/departments?companyId=${companyId}`);
  return data.departments ?? [];
}

export async function fetchDepartmentMembers(departmentId: string): Promise<DepartmentMember[]> {
  const data = await apiFetch<{ members?: DepartmentMember[] }>(`/master/departments/${departmentId}/members`);
  return data.members ?? [];
}

export async function createDepartment(input: { companyId: string; code: string; name: string }): Promise<DepartmentRow> {
  const data = await apiFetch<{ department: DepartmentRow }>("/master/departments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.department;
}

export async function updateDepartment(
  departmentId: string,
  input: { code: string; name: string; isActive: boolean }
): Promise<DepartmentRow> {
  const data = await apiFetch<{ department: DepartmentRow }>(`/master/departments/${departmentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.department;
}

/** Members keep their record; the department pointer is cleared server-side. */
export async function deleteDepartment(departmentId: string): Promise<DepartmentRow> {
  const data = await apiFetch<{ department: DepartmentRow }>(`/master/departments/${departmentId}`, {
    method: "DELETE",
  });
  return data.department;
}