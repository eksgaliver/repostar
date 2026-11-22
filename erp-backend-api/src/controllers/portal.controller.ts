import { Elysia, t } from "elysia";
import { guard } from "../middleware/auth";
import * as portal from "../models/portal.model";

export const portalController = new Elysia({ prefix: "/portal", tags: ["Inter-Company Portal"] })
  /** Company switcher + SSO: the tenants this user may enter without re-login. */
  .get("/companies", async ({ headers, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { companies: await portal.membershipsFor(auth.principal.userId) };
  })
  /** Limited HR directory across companies that allow it. */
  .get("/directory", async ({ headers, query, set }) => {
    const auth = await guard(headers, ["hr_admin", "manager"]);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { directory: await portal.directory({ type: query.type as "D" | "MK" | "S" | undefined }) };
  })
  .get("/secondments", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { secondments: await portal.listSecondments(query.companyId) };
  })
  .post(
    "/secondments",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["hr_admin", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const row = await portal.createSecondment(body);
      if (!row) {
        set.status = 400;
        return { error: "secondment_not_created" };
      }
      return { secondment: row };
    },
    {
      body: t.Object({
        employeeId: t.String(),
        fromCompanyId: t.String(),
        toCompanyId: t.String(),
        startDate: t.String(),
        endDate: t.Optional(t.String()),
        reason: t.Optional(t.String()),
        kind: t.Optional(t.Union([t.Literal("secondment"), t.Literal("mutation")])),
      }),
    },
  )
  /** One call advances one approval step (asal -> tujuan -> super admin). */
  .post(
    "/secondments/:id/approve",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["hr_admin", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const result = await portal.approveSecondment(params.id, body.approved);
      if (!result) {
        set.status = 404;
        return { error: "secondment_not_found" };
      }
      if ("error" in result) {
        set.status = 409;
        return { error: result.error, secondment: result.secondment };
      }
      return { secondment: result.secondment };
    },
    { body: t.Object({ approved: t.Boolean() }) },
  )
  /** Granular sharing: OA and personal data are locked by default. */
  .get("/sharing", async ({ headers, set }) => {
    const auth = await guard(headers, ["super_admin", "admin"]);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { rules: await portal.listSharing() };
  })
  .post(
    "/sharing",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["super_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const rule = await portal.upsertSharing(body);
      if (!rule) {
        set.status = 400;
        return { error: "rule_not_saved" };
      }
      return { rule };
    },
    {
      body: t.Object({
        companyId: t.String(),
        partnerCompanyId: t.String(),
        allowSummary: t.Optional(t.Boolean()),
        allowFleet: t.Optional(t.Boolean()),
        allowDirectory: t.Optional(t.Boolean()),
        allowOa: t.Optional(t.Boolean()),
        allowPersonal: t.Optional(t.Boolean()),
      }),
    },
  )
  /** Group consolidation for the executive view. */
  .get("/consolidation", async ({ headers, set }) => {
    const auth = await guard(headers, ["super_admin", "admin"]);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { companies: await portal.consolidation() };
  });