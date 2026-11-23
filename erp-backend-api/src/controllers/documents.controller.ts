import { Elysia, t } from "elysia";
import { canAccessCompany, guard } from "../middleware/auth";
import type { Headers as RequestHeaders, Role } from "../middleware/auth";
import { listPeers, touchPresence } from "../lib/presence";
import * as documents from "../models/documents.model";
import type { DocumentStatusValue, DocumentTypeValue } from "../models/documents.model";
import { documentView, signerCandidateView } from "../views";

/**
 * TEMPORARY: every signed-in user may write and send letters right now. Set
 * this to `false` to restore the rule below (manager and above only).
 */
const OPEN_TO_ALL_ROLES = true;

/**
 * Everyone above a regular employee may write and send letters. The read-only
 * admin role is excluded on purpose: it only reads reports.
 */
const AUTHOR_ROLES: Role[] = ["manager", "hr_admin", "opr_admin", "kpi_admin"];

/** `undefined` means any authenticated user, which is the temporary rule. */
function authorGuard(headers: RequestHeaders) {
  return guard(headers, OPEN_TO_ALL_ROLES ? undefined : AUTHOR_ROLES);
}

const documentTypeSchema = t.Union([
  t.Literal("internal_memo"),
  t.Literal("announcement"),
  t.Literal("circular"),
  t.Literal("decree"),
  t.Literal("warning"),
  t.Literal("policy"),
]);

const audienceSchema = t.Union([t.Literal("all"), t.Literal("department")]);

/** `<script>` never belongs in a letter; reject it before it reaches storage. */
const looksUnsafe = (html: string) => /<\s*script|javascript:/i.test(html);

const signatureIsPng = (value: string | null | undefined) =>
  !value || value.startsWith("data:image/png;base64,");

/**
 * Optional text: the editor sends `null` for a field that is still empty (no
 * signature, no second department), so the schema has to accept null too.
 */
const nullableText = t.Union([t.String(), t.Null()]);

const attachmentSchema = t.Object({
  name: t.String(),
  type: t.String(),
  size: t.Number(),
  dataUrl: t.String(),
});

/** At most five files, each under ~2 MB once base64-encoded. */
const attachmentsAreValid = (list?: { dataUrl: string }[]) =>
  !list ||
  (list.length <= 5 &&
    list.every((file) => file.dataUrl.startsWith("data:") && file.dataUrl.length <= 3_000_000));

export const documentsController = new Elysia({ prefix: "/documents", tags: ["Documents"] })
  .get("/", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const sentOnly = !OPEN_TO_ALL_ROLES && auth.principal.role === "staff";
    const list = await documents.listDocuments(query.companyId, {
      status: query.status as DocumentStatusValue | undefined,
      type: query.type as DocumentTypeValue | undefined,
      sentOnly,
    });
    return { documents: list.map(documentView) };
  })
  /** Accounts that can be asked to sign; declared before `/:id` on purpose. */
  .get("/signers", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return {
      signers: (await documents.listSignerCandidates(query.companyId)).map(signerCandidateView),
      /** Lets the editor know whether the chosen signer is the caller. */
      currentUserId: auth.principal.userId,
    };
  })
  .get("/:id", async ({ headers, params, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const row = await documents.getDocument(params.id);
    if (!row || !canAccessCompany(auth.principal, row.companyId)) {
      set.status = 404;
      return { error: "document_not_found" };
    }
    if (!OPEN_TO_ALL_ROLES && auth.principal.role === "staff" && row.status !== "sent") {
      set.status = 404;
      return { error: "document_not_found" };
    }
    return { document: documentView(row) };
  })
  .post(
    "/",
    async ({ headers, body, set }) => {
      const auth = await authorGuard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      if (!canAccessCompany(auth.principal, body.companyId)) {
        set.status = 403;
        return { error: "forbidden" };
      }
      if (looksUnsafe(body.body)) {
        set.status = 422;
        return { error: "unsafe_html" };
      }
      if (!signatureIsPng(body.signature)) {
        set.status = 422;
        return { error: "signature_invalid" };
      }
      if (!attachmentsAreValid(body.attachments)) {
        set.status = 422;
        return { error: "attachment_invalid" };
      }

      const row = await documents.createDocument({
        companyId: body.companyId,
        authorId: auth.principal.userId,
        type: body.type,
        title: body.title,
        body: body.body,
        signature: body.signature ?? null,
        signerName: body.signerName ?? null,
        signerTitle: body.signerTitle ?? null,
        audienceType: body.audienceType ?? "all",
        audienceDepartmentId: body.audienceDepartmentId ?? null,
        attachments: body.attachments ?? null,
      });
      return { document: documentView(row) };
    },
    {
      body: t.Object({
        companyId: t.String(),
        type: documentTypeSchema,
        title: t.String({ minLength: 3 }),
        body: t.String({ minLength: 1 }),
        signature: t.Optional(nullableText),
        signerName: t.Optional(nullableText),
        signerTitle: t.Optional(nullableText),
        audienceType: t.Optional(audienceSchema),
        audienceDepartmentId: t.Optional(nullableText),
        attachments: t.Optional(t.Array(attachmentSchema)),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ headers, params, body, set }) => {
      const auth = await authorGuard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const current = await documents.getDocument(params.id);
      if (!current || !canAccessCompany(auth.principal, current.companyId)) {
        set.status = 404;
        return { error: "document_not_found" };
      }
      if (body.body && looksUnsafe(body.body)) {
        set.status = 422;
        return { error: "unsafe_html" };
      }
      if (!signatureIsPng(body.signature)) {
        set.status = 422;
        return { error: "signature_invalid" };
      }
      if (!attachmentsAreValid(body.attachments)) {
        set.status = 422;
        return { error: "attachment_invalid" };
      }

      const result = await documents.updateDocument(params.id, body);
      if ("error" in result) {
        set.status = result.error === "not_found" ? 404 : 409;
        return { error: result.error };
      }
      return { document: documentView(result.document) };
    },
    {
      body: t.Object({
        type: t.Optional(documentTypeSchema),
        title: t.Optional(t.String({ minLength: 3 })),
        body: t.Optional(t.String({ minLength: 1 })),
        signature: t.Optional(nullableText),
        signerName: t.Optional(nullableText),
        signerTitle: t.Optional(nullableText),
        audienceType: t.Optional(audienceSchema),
        audienceDepartmentId: t.Optional(nullableText),
        attachments: t.Optional(t.Array(attachmentSchema)),
      }),
    }
  )
  /** The author invites one reviewer; the invite can be replaced later. */
  .post(
    "/:id/review/invite",
    async ({ headers, params, body, set }) => {
      const auth = await authorGuard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const current = await documents.getDocument(params.id);
      if (!current || !canAccessCompany(auth.principal, current.companyId)) {
        set.status = 404;
        return { error: "document_not_found" };
      }

      const reviewer = await documents.getUserSummary(body.reviewerUserId);
      if (!reviewer) {
        set.status = 404;
        return { error: "reviewer_not_found" };
      }

      const result = await documents.inviteReviewer(params.id, reviewer.id);
      if ("error" in result) {
        set.status = 404;
        return { error: result.error };
      }
      return { document: documentView(result.document) };
    },
    { body: t.Object({ reviewerUserId: t.String() }) }
  )
  /** Only the invited reviewer answers the request. */
  .post(
    "/:id/review/respond",
    async ({ headers, params, body, set }) => {
      const auth = await authorGuard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const current = await documents.getDocument(params.id);
      if (!current || !canAccessCompany(auth.principal, current.companyId)) {
        set.status = 404;
        return { error: "document_not_found" };
      }
      if (
        current.reviewerUserId !== auth.principal.userId &&
        auth.principal.role !== "super_admin"
      ) {
        set.status = 403;
        return { error: "not_invited_reviewer" };
      }

      const result = await documents.respondReview(params.id, body.approved, body.note ?? null);
      if ("error" in result) {
        set.status = result.error === "not_found" ? 404 : 409;
        return { error: result.error };
      }
      return { document: documentView(result.document) };
    },
    { body: t.Object({ approved: t.Boolean(), note: t.Optional(nullableText) }) }
  )
  /**
   * Polled once a second by an open letter. Returns where everyone else is, in
   * percentages of the paper, so both sides can draw two cursors.
   */
  .post(
    "/:id/presence",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const self = touchPresence(params.id, auth.principal.userId, body.name, body.caret ?? null);
      return { color: self.color, peers: listPeers(params.id, auth.principal.userId) };
    },
    {
      body: t.Object({
        name: t.String(),
        caret: t.Optional(
          t.Union([t.Object({ x: t.Number(), y: t.Number() }), t.Null()])
        ),
      }),
    }
  )
  /** Ask one specific user to sign: the letter waits for them, unsigned. */
  .post(
    "/:id/request-signature",
    async ({ headers, params, body, set }) => {
      const auth = await authorGuard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const current = await documents.getDocument(params.id);
      if (!current || !canAccessCompany(auth.principal, current.companyId)) {
        set.status = 404;
        return { error: "document_not_found" };
      }

      const signer = await documents.getUserSummary(body.signerUserId);
      if (!signer) {
        set.status = 404;
        return { error: "signer_not_found" };
      }

      const result = await documents.requestSignature(params.id, signer.id, signer.fullName);
      if ("error" in result) {
        set.status = result.error === "not_found" ? 404 : 409;
        return { error: result.error };
      }
      return { document: documentView(result.document) };
    },
    { body: t.Object({ signerUserId: t.String() }) }
  )
  /** Only the requested signer completes a pending letter. */
  .post(
    "/:id/sign",
    async ({ headers, params, body, set }) => {
      const auth = await authorGuard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const current = await documents.getDocument(params.id);
      if (!current || !canAccessCompany(auth.principal, current.companyId)) {
        set.status = 404;
        return { error: "document_not_found" };
      }
      if (
        current.signerUserId !== auth.principal.userId &&
        auth.principal.role !== "super_admin"
      ) {
        set.status = 403;
        return { error: "not_requested_signer" };
      }
      if (!signatureIsPng(body.signature)) {
        set.status = 422;
        return { error: "signature_invalid" };
      }

      const result = await documents.signDocument(params.id, body.signature);
      if ("error" in result) {
        set.status = result.error === "not_found" ? 404 : 409;
        return { error: result.error };
      }
      return { document: documentView(result.document) };
    },
    { body: t.Object({ signature: t.String() }) }
  )
  /** The author pulls a request back before it is signed. */
  .post("/:id/cancel-signature", async ({ headers, params, set }) => {
    const auth = await authorGuard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const current = await documents.getDocument(params.id);
    if (!current || !canAccessCompany(auth.principal, current.companyId)) {
      set.status = 404;
      return { error: "document_not_found" };
    }

    const result = await documents.cancelSignatureRequest(params.id);
    if ("error" in result) {
      set.status = result.error === "not_found" ? 404 : 409;
      return { error: result.error };
    }
    return { document: documentView(result.document) };
  })
  /** Sending freezes the letter: the signature must already be on it. */
  .post("/:id/send", async ({ headers, params, set }) => {
    const auth = await authorGuard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const current = await documents.getDocument(params.id);
    if (!current || !canAccessCompany(auth.principal, current.companyId)) {
      set.status = 404;
      return { error: "document_not_found" };
    }

    const result = await documents.sendDocument(params.id);
    if ("error" in result) {
      set.status = result.error === "not_found" ? 404 : 422;
      return { error: result.error };
    }
    return { document: documentView(result.document) };
  })
  .delete("/:id", async ({ headers, params, set }) => {
    const auth = await authorGuard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const current = await documents.getDocument(params.id);
    if (!current || !canAccessCompany(auth.principal, current.companyId)) {
      set.status = 404;
      return { error: "document_not_found" };
    }

    const row = await documents.deleteDocument(params.id);
    if (!row) {
      set.status = 404;
      return { error: "document_not_found" };
    }
    return { document: documentView(row) };
  });