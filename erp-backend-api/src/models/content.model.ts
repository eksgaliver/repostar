/** Model layer - company assets and internal bulletins. */
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";

export async function listAssets(companyId?: string) {
  const query = db.select().from(schema.assets);
  if (companyId) return query.where(eq(schema.assets.companyId, companyId));
  return query;
}

export async function createAsset(input: {
  companyId: string;
  code: string;
  name: string;
  category?: string;
  serialNumber?: string;
  assignedEmployeeId?: string;
  assignedAt?: string;
  condition?: "good" | "fair" | "damaged";
  notes?: string;
}) {
  return db.insert(schema.assets).values(input).returning();
}

/** Department head posts; HRD approval is required before it goes live. */
export async function createBulletin(input: {
  companyId: string;
  departmentId?: string;
  authorId?: string;
  title: string;
  body: string;
}) {
  return db
    .insert(schema.bulletins)
    .values({
      companyId: input.companyId,
      departmentId: input.departmentId,
      authorId: input.authorId,
      title: input.title,
      body: input.body,
      status: "pending",
    })
    .returning();
}

export async function listBulletins(companyId?: string, status?: string) {
  const rows = companyId
    ? await db.select().from(schema.bulletins).where(eq(schema.bulletins.companyId, companyId))
    : await db.select().from(schema.bulletins);
  return status ? rows.filter((row) => row.status === status) : rows;
}

export async function approveBulletin(id: string, approved: boolean, approvedBy?: string) {
  const [row] = await db
    .update(schema.bulletins)
    .set({
      status: approved ? "published" : "rejected",
      approvedBy,
      approvedAt: new Date(),
      publishedAt: approved ? new Date() : null,
    })
    .where(eq(schema.bulletins.id, id))
    .returning();
  return row ?? null;
}