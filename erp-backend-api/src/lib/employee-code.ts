import { and, like } from "drizzle-orm";
import { db, schema } from "../db/client";

/**
 * Employee id format: [RegionCode].[Type].[3-digit sequence] -> PK.D.001
 * The sequence is per region + per type and is assigned manually by HR.
 */
export async function nextEmployeeCode(
  companyId: string,
  regionCode: string,
  type: "S" | "D" | "MK",
): Promise<string> {
  const prefix = `${regionCode}.${type}.`;
  const rows = await db
    .select({ code: schema.employees.employeeCode })
    .from(schema.employees)
    .where(and(like(schema.employees.employeeCode, `${prefix}%`)));

  const highest = rows.reduce((max, row) => {
    const seq = Number(row.code.slice(prefix.length));
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);

  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}