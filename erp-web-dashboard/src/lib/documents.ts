/**
 * Outgoing letters. The body is the editor HTML and the signature is a PNG data
 * URL, so a paper view renders one record with no external assets.
 */
import { apiFetch } from "@/lib/api";

export type DocumentTypeValue =
  | "internal_memo"
  | "announcement"
  | "circular"
  | "decree"
  | "warning"
  | "policy";

export type DocumentStatusValue = "draft" | "pending" | "sent" | "archived";
export type ReviewStatusValue = "invited" | "approved" | "revision";

export interface DocumentTypeOption {
  value: DocumentTypeValue;
  label: string;
  /** Prefix in the generated number, e.g. 001/IM/WMPL/XI/2026. */
  code: string;
  hint: string;
}

export const DOCUMENT_TYPES: DocumentTypeOption[] = [
  { value: "internal_memo", label: "Internal memo", code: "IM", hint: "Instruksi singkat ke tim internal" },
  { value: "announcement", label: "Announcement", code: "ANN", hint: "Pengumuman untuk seluruh karyawan" },
  { value: "circular", label: "Surat edaran", code: "SE", hint: "Kebijakan yang berlaku menyeluruh" },
  { value: "decree", label: "Surat keputusan", code: "SK", hint: "Penetapan resmi seperti mutasi atau penugasan" },
  { value: "warning", label: "Surat peringatan", code: "SP", hint: "Teguran tertulis dengan catatan HR" },
  { value: "policy", label: "Kebijakan perusahaan", code: "KBN", hint: "Aturan baru beserta masa berlaku" },
];

export function documentTypeLabel(value: string): string {
  return DOCUMENT_TYPES.find((type) => type.value === value)?.label ?? value;
}

/**
 * Letterhead form of the type, printed bold and centered above the body. A
 * printed letter says INTERNAL MEMO; the app chrome stays sentence case.
 */
const TYPE_HEADING: Record<DocumentTypeValue, string> = {
  internal_memo: "INTERNAL MEMO",
  announcement: "ANNOUNCEMENT",
  circular: "SURAT EDARAN",
  decree: "SURAT KEPUTUSAN",
  warning: "SURAT PERINGATAN",
  policy: "KEBIJAKAN PERUSAHAAN",
};

export function documentTypeHeading(value: string): string {
  return TYPE_HEADING[value as DocumentTypeValue] ?? value.toUpperCase();
}

export function reviewStatusLabel(status?: ReviewStatusValue | null): string {
  if (status === "invited") return "menunggu review";
  if (status === "approved") return "disetujui";
  if (status === "revision") return "minta revisi";
  return "belum ada";
}

/** Pinned to one timezone so the server pass and the browser print the same day. */
const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatDocumentDate(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMAT.format(date);
}

export interface DocumentAttachment {
  name: string;
  type: string;
  /** Bytes before base64 encoding. */
  size: number;
  /** base64 data URL, stored with the letter. */
  dataUrl: string;
}

export interface DocumentRow {
  id: string;
  companyId: string;
  type: DocumentTypeValue;
  number: string;
  title: string;
  body?: string | null;
  signature?: string | null;
  signerName?: string | null;
  signerTitle?: string | null;
  /** Account asked to sign this letter. */
  signerUserId?: string | null;
  signatureRequestedAt?: string | null;
  signedAt?: string | null;
  reviewerUserId?: string | null;
  reviewerName?: string | null;
  reviewStatus?: ReviewStatusValue | null;
  reviewRequestedAt?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  attachments?: DocumentAttachment[];
  audienceType: "all" | "department";
  audienceDepartmentId?: string | null;
  audienceDepartmentName?: string | null;
  status: DocumentStatusValue;
  authorId?: string | null;
  authorName?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentInput {
  companyId: string;
  type: DocumentTypeValue;
  title: string;
  body: string;
  signature?: string | null;
  signerName?: string | null;
  signerTitle?: string | null;
  audienceType?: "all" | "department";
  audienceDepartmentId?: string | null;
  attachments?: DocumentAttachment[];
}

export interface DocumentFilters {
  status?: DocumentStatusValue;
  type?: DocumentTypeValue;
}

export interface SignerCandidate {
  id: string;
  fullName: string;
  role: string;
  employeeId?: string | null;
  employeeCode?: string | null;
  /** Position that prints under the name; falls back to the role label. */
  positionName?: string | null;
  departmentName?: string | null;
}

export interface SignerDirectory {
  signers: SignerCandidate[];
  /** Who is signed in; used to tell "sign myself" from "request a signature". */
  currentUserId: string | null;
}

export async function fetchSignerDirectory(companyId: string): Promise<SignerDirectory> {
  const data = await apiFetch<{ signers?: SignerCandidate[]; currentUserId?: string | null }>(
    `/documents/signers?companyId=${companyId}`
  );
  return { signers: data.signers ?? [], currentUserId: data.currentUserId ?? null };
}

export async function fetchDocuments(
  companyId: string,
  filters: DocumentFilters = {}
): Promise<DocumentRow[]> {
  const params = new URLSearchParams({ companyId });
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  const data = await apiFetch<{ documents?: DocumentRow[] }>(`/documents?${params.toString()}`);
  return data.documents ?? [];
}

export async function fetchDocument(id: string): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}`);
  return data.document;
}

export async function createDocument(input: DocumentInput): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>("/documents", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.document;
}

export async function updateDocument(
  id: string,
  input: Partial<DocumentInput>
): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.document;
}

/** Sending freezes the letter; the signature must already be on it. */
export async function sendDocument(id: string): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}/send`, {
    method: "POST",
  });
  return data.document;
}

export async function deleteDocument(id: string): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}`, {
    method: "DELETE",
  });
  return data.document;
}

/** Hands the letter to someone else; it waits for them, unsigned. */
export async function requestSignature(id: string, signerUserId: string): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}/request-signature`, {
    method: "POST",
    body: JSON.stringify({ signerUserId }),
  });
  return data.document;
}

/** The author invites one reviewer; the invite can be replaced later. */
export async function inviteReviewer(id: string, reviewerUserId: string): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}/review/invite`, {
    method: "POST",
    body: JSON.stringify({ reviewerUserId }),
  });
  return data.document;
}

/** The invited reviewer approves or asks for a revision. */
export async function respondReview(
  id: string,
  input: { approved: boolean; note?: string | null }
): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}/review/respond`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.document;
}

/** A cursor on the letter, in percentages of the paper so both screens agree. */
export interface DocumentPeer {
  userId: string;
  name: string;
  color: string;
  caret: { x: number; y: number } | null;
}

export async function sendPresence(
  id: string,
  input: { name: string; caret?: { x: number; y: number } | null }
): Promise<{ color: string; peers: DocumentPeer[] }> {
  const data = await apiFetch<{ color: string; peers: DocumentPeer[] }>(`/documents/${id}/presence`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { color: data.color, peers: data.peers ?? [] };
}

/** The requested signer signs; the letter is sent at once. */
export async function signDocumentAs(id: string, signature: string): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}/sign`, {
    method: "POST",
    body: JSON.stringify({ signature }),
  });
  return data.document;
}

/** The author pulls a request back before it is signed. */
export async function cancelSignatureRequest(id: string): Promise<DocumentRow> {
  const data = await apiFetch<{ document: DocumentRow }>(`/documents/${id}/cancel-signature`, {
    method: "POST",
  });
  return data.document;
}

/**
 * The editor only writes formatting tags. Before the paper view injects the HTML
 * we drop the tags and attributes that could execute, as a second line of
 * defence behind the server's rejection of `<script>`.
 */
export function sanitizeDocumentHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}