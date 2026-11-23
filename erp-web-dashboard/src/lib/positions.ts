/**
 * Positions per department. A position only exists inside one department, and
 * the employee form offers exactly that department's positions.
 */
import { apiFetch } from "@/lib/api";

export interface PositionRow {
  id: string;
  departmentId: string;
  name: string;
  isActive: boolean;
}

export async function fetchPositions(departmentId: string): Promise<PositionRow[]> {
  const data = await apiFetch<{ positions?: PositionRow[] }>(`/master/departments/${departmentId}/positions`);
  return data.positions ?? [];
}

export async function createPosition(departmentId: string, name: string): Promise<PositionRow> {
  const data = await apiFetch<{ position: PositionRow }>("/master/positions", {
    method: "POST",
    body: JSON.stringify({ departmentId, name }),
  });
  return data.position;
}

export async function updatePosition(
  positionId: string,
  input: { name: string; isActive: boolean }
): Promise<PositionRow> {
  const data = await apiFetch<{ position: PositionRow }>(`/master/positions/${positionId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.position;
}

export async function deletePosition(positionId: string): Promise<PositionRow> {
  const data = await apiFetch<{ position: PositionRow }>(`/master/positions/${positionId}`, {
    method: "DELETE",
  });
  return data.position;
}