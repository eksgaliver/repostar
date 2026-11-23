/**
 * Model layer - outgoing letters (memo, announcement, decree, ...).
 *
 * A document owns its own number, its editor HTML, and the PNG signature, so a
 * sent letter never depends on another module to render. Drafts stay editable;
 * once sent the row is frozen and the guard refuses further changes.
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, schema } from "../db/client";

/** Second join onto users: the invited reviewer, not the author. */
const reviewerUsers = alias(schema.users, "reviewer");

export type DocumentTypeValue =
  | "internal_memo"
  | "announcement"
  | "circular"
  | "decree"
  | "warning"
  | "policy";

export type DocumentStatusValue = "draft" | "pending" | "sent" | "archived";

/** The type doubles as the number prefix: 001/IM/WMPL/XI/2026. */
const TYPE_CODE: Record<DocumentTypeValue, string> = {
  internal_memo: "IM",
  announcement: "ANN",
  circular: "SE",
  decree: "SK",
  warning: "SP",
  policy: "KBN",
};

const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

export interface DocumentAttachment {
  name: string;
  type: string;
  size: number;
  /** base64 data URL, e.g. data:application/pdf;base64,... */
  dataUrl: string;
}

export interface DocumentInput {
  companyId: string;
  authorId?: string | null;
  type: DocumentTypeValue;
  title: string;
  body: string;
  signature?: string | null;
  signerName?: string | null;
  signerTitle?: string | null;
  audienceType?: "all" | "department";
  audienceDepartmentId?: string | null;
  attachments?: DocumentAttachment[] | null;
}

export interface DocumentFilters {
  status?: DocumentStatusValue;
  type?: DocumentTypeValue;
  /** Staff never sees drafts: only letters already sent to them. */
  sentOnly?: boolean;
}

async function nextNumber(companyId: string, type: DocumentTypeValue): Promise<string> {
  const [company] = await db
    .select({ code: schema.companies.code })
    .from(schema.companies)
    .where(eq(schema.companies.id, companyId));

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.documents)
    .where(
      and(
        eq(schema.documents.companyId, companyId),
        eq(schema.documents.type, type),
        gte(schema.documents.createdAt, startOfYear)
      )
    );

  const sequence = String((row?.total ?? 0) + 1).padStart(3, "0");
  return `${sequence}/${TYPE_CODE[type]}/${company?.code ?? "STARS"}/${ROMAN_MONTHS[now.getMonth()]}/${now.getFullYear()}`;
}

export async function listDocuments(companyId?: string, filters: DocumentFilters = {}) {
  const conditions = [];
  if (companyId) conditions.push(eq(schema.documents.companyId, companyId));
  if (filters.sentOnly) conditions.push(eq(schema.documents.status, "sent"));
  else if (filters.status) conditions.push(eq(schema.documents.status, filters.status));
  if (filters.type) conditions.push(eq(schema.documents.type, filters.type));

  const query = db
    .select({
      id: schema.documents.id,
      companyId: schema.documents.companyId,
      type: schema.documents.type,
      number: schema.documents.number,
      title: schema.documents.title,
      status: schema.documents.status,
      audienceType: schema.documents.audienceType,
      audienceDepartmentId: schema.documents.audienceDepartmentId,
      departmentName: schema.departments.name,
      authorId: schema.documents.authorId,
      authorName: schema.users.fullName,
      signerName: schema.documents.signerName,
      signerTitle: schema.documents.signerTitle,
      signerUserId: schema.documents.signerUserId,
      signatureRequestedAt: schema.documents.signatureRequestedAt,
      signedAt: schema.documents.signedAt,
      reviewStatus: schema.documents.reviewStatus,
      reviewerUserId: schema.documents.reviewerUserId,
      reviewerName: reviewerUsers.fullName,
      sentAt: schema.documents.sentAt,
      updatedAt: schema.documents.updatedAt,
      createdAt: schema.documents.createdAt,
    })
    .from(schema.documents)
    .leftJoin(schema.users, eq(schema.users.id, schema.documents.authorId))
    .leftJoin(reviewerUsers, eq(reviewerUsers.id, schema.documents.reviewerUserId))
    .leftJoin(schema.departments, eq(schema.departments.id, schema.documents.audienceDepartmentId))
    .orderBy(desc(schema.documents.createdAt));

  return conditions.length ? query.where(and(...conditions)) : query;
}

export async function getDocument(id: string) {
  const [row] = await db
    .select({
      id: schema.documents.id,
      companyId: schema.documents.companyId,
      type: schema.documents.type,
      number: schema.documents.number,
      title: schema.documents.title,
      body: schema.documents.body,
      signature: schema.documents.signature,
      signerName: schema.documents.signerName,
      signerTitle: schema.documents.signerTitle,
      signerUserId: schema.documents.signerUserId,
      signatureRequestedAt: schema.documents.signatureRequestedAt,
      signedAt: schema.documents.signedAt,
      attachments: schema.documents.attachments,
      reviewerUserId: schema.documents.reviewerUserId,
      reviewerName: reviewerUsers.fullName,
      reviewStatus: schema.documents.reviewStatus,
      reviewRequestedAt: schema.documents.reviewRequestedAt,
      reviewedAt: schema.documents.reviewedAt,
      reviewNote: schema.documents.reviewNote,
      audienceType: schema.documents.audienceType,
      audienceDepartmentId: schema.documents.audienceDepartmentId,
      departmentName: schema.departments.name,
      status: schema.documents.status,
      authorId: schema.documents.authorId,
      authorName: schema.users.fullName,
      sentAt: schema.documents.sentAt,
      createdAt: schema.documents.createdAt,
      updatedAt: schema.documents.updatedAt,
    })
    .from(schema.documents)
    .leftJoin(schema.users, eq(schema.users.id, schema.documents.authorId))
    .leftJoin(reviewerUsers, eq(reviewerUsers.id, schema.documents.reviewerUserId))
    .leftJoin(schema.departments, eq(schema.departments.id, schema.documents.audienceDepartmentId))
    .where(eq(schema.documents.id, id));

  return row ?? null;
}

export async function createDocument(input: DocumentInput) {
  const number = await nextNumber(input.companyId, input.type);
  const [row] = await db
    .insert(schema.documents)
    .values({
      companyId: input.companyId,
      authorId: input.authorId ?? null,
      type: input.type,
      number,
      title: input.title.trim(),
      body: input.body,
      signature: input.signature ?? null,
      signerName: input.signerName ?? null,
      signerTitle: input.signerTitle ?? null,
      audienceType: input.audienceType ?? "all",
      audienceDepartmentId:
        input.audienceType === "department" ? (input.audienceDepartmentId ?? null) : null,
      attachments: input.attachments?.length ? JSON.stringify(input.attachments) : null,
    })
    .returning();

  return row!;
}

export type UpdateDocumentResult =
  | { document: NonNullable<Awaited<ReturnType<typeof getDocument>>>; error?: never }
  | { error: "not_found" | "document_locked"; document?: never };

export async function updateDocument(
  id: string,
  patch: Partial<Omit<DocumentInput, "companyId" | "authorId">>
): Promise<UpdateDocumentResult> {
  const [existing] = await db
    .select({ status: schema.documents.status })
    .from(schema.documents)
    .where(eq(schema.documents.id, id));

  if (!existing) return { error: "not_found" };
  if (existing.status !== "draft") return { error: "document_locked" };

  await db
    .update(schema.documents)
    .set({
      ...(patch.type ? { type: patch.type } : {}),
      ...(patch.title ? { title: patch.title.trim() } : {}),
      ...(patch.body ? { body: patch.body } : {}),
      ...(patch.signature !== undefined ? { signature: patch.signature } : {}),
      ...(patch.signerName !== undefined ? { signerName: patch.signerName } : {}),
      ...(patch.signerTitle !== undefined ? { signerTitle: patch.signerTitle } : {}),
      ...(patch.audienceType
        ? {
            audienceType: patch.audienceType,
            audienceDepartmentId:
              patch.audienceType === "department" ? (patch.audienceDepartmentId ?? null) : null,
          }
        : {}),
      ...(patch.attachments !== undefined
        ? { attachments: patch.attachments?.length ? JSON.stringify(patch.attachments) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.documents.id, id));

  const document = await getDocument(id);
  return document ? { document } : { error: "not_found" };
}

export async function sendDocument(id: string) {
  const [existing] = await db
    .select({ status: schema.documents.status, signature: schema.documents.signature })
    .from(schema.documents)
    .where(eq(schema.documents.id, id));

  if (!existing) return { error: "not_found" as const };
  if (existing.status !== "draft") return { error: "already_sent" as const };
  if (!existing.signature) return { error: "signature_required" as const };

  await db
    .update(schema.documents)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.documents.id, id));

  const document = await getDocument(id);
  return document ? { document } : { error: "not_found" as const };
}

export async function deleteDocument(id: string) {
  const [row] = await db.delete(schema.documents).where(eq(schema.documents.id, id)).returning();
  return row ?? null;
}

/** Name and role of the account that will be asked to sign. */
export async function getUserSummary(userId: string) {
  const [row] = await db
    .select({ id: schema.users.id, fullName: schema.users.fullName, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  return row ?? null;
}

/** Accounts that can be asked to sign, with the position that prints on the letter. */
export async function listSignerCandidates(companyId?: string) {
  const conditions = [eq(schema.users.isActive, true)];
  if (companyId) conditions.push(eq(schema.users.companyId, companyId));

  return db
    .select({
      id: schema.users.id,
      fullName: schema.users.fullName,
      role: schema.users.role,
      employeeId: schema.users.employeeId,
      employeeCode: schema.employees.employeeCode,
      positionName: schema.positions.name,
      departmentName: schema.departments.name,
    })
    .from(schema.users)
    .leftJoin(schema.employees, eq(schema.employees.id, schema.users.employeeId))
    .leftJoin(schema.positions, eq(schema.positions.id, schema.employees.positionId))
    .leftJoin(schema.departments, eq(schema.departments.id, schema.employees.departmentId))
    .where(and(...conditions))
    .orderBy(schema.users.fullName);
}

/**
 * Hands the letter to someone else: it becomes `pending`, drops any signature it
 * carried, and only the requested account can complete it.
 */
export async function requestSignature(id: string, signerUserId: string, signerName: string) {
  const [existing] = await db
    .select({ status: schema.documents.status })
    .from(schema.documents)
    .where(eq(schema.documents.id, id));

  if (!existing) return { error: "not_found" as const };
  if (existing.status !== "draft") return { error: "document_locked" as const };

  await db
    .update(schema.documents)
    .set({
      status: "pending",
      signerUserId,
      signerName,
      signature: null,
      signatureRequestedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.documents.id, id));

  const document = await getDocument(id);
  return document ? { document } : { error: "not_found" as const };
}

/** The author can pull back a request before it is signed. */
export async function cancelSignatureRequest(id: string) {
  const [existing] = await db
    .select({ status: schema.documents.status })
    .from(schema.documents)
    .where(eq(schema.documents.id, id));

  if (!existing) return { error: "not_found" as const };
  if (existing.status !== "pending") return { error: "not_pending" as const };

  await db
    .update(schema.documents)
    .set({ status: "draft", signerUserId: null, signatureRequestedAt: null, updatedAt: new Date() })
    .where(eq(schema.documents.id, id));

  const document = await getDocument(id);
  return document ? { document } : { error: "not_found" as const };
}

/** The author invites one reviewer; the invitation can be replaced later. */
export async function inviteReviewer(id: string, reviewerUserId: string) {
  const [existing] = await db
    .select({ id: schema.documents.id })
    .from(schema.documents)
    .where(eq(schema.documents.id, id));
  if (!existing) return { error: "not_found" as const };

  await db
    .update(schema.documents)
    .set({
      reviewerUserId,
      reviewStatus: "invited",
      reviewRequestedAt: new Date(),
      reviewedAt: null,
      reviewNote: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.documents.id, id));

  const document = await getDocument(id);
  return document ? { document } : { error: "not_found" as const };
}

/** The invited reviewer approves or asks for a revision, with an optional note. */
export async function respondReview(id: string, approved: boolean, note: string | null) {
  const [existing] = await db
    .select({ status: schema.documents.reviewStatus })
    .from(schema.documents)
    .where(eq(schema.documents.id, id));

  if (!existing) return { error: "not_found" as const };
  if (existing.status !== "invited") return { error: "not_invited" as const };

  await db
    .update(schema.documents)
    .set({
      reviewStatus: approved ? "approved" : "revision",
      reviewNote: note,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.documents.id, id));

  const document = await getDocument(id);
  return document ? { document } : { error: "not_found" as const };
}

/** The requested signer signs; the letter is sent at once. */
export async function signDocument(id: string, signature: string) {
  const [existing] = await db
    .select({ status: schema.documents.status })
    .from(schema.documents)
    .where(eq(schema.documents.id, id));

  if (!existing) return { error: "not_found" as const };
  if (existing.status === "sent") return { error: "already_sent" as const };
  if (existing.status !== "pending") return { error: "not_pending" as const };

  const now = new Date();
  await db
    .update(schema.documents)
    .set({ signature, status: "sent", signedAt: now, sentAt: now, updatedAt: now })
    .where(eq(schema.documents.id, id));

  const document = await getDocument(id);
  return document ? { document } : { error: "not_found" as const };
}