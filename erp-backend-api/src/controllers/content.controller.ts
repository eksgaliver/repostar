import { Elysia, t } from "elysia";
import { guard } from "../middleware/auth";
import * as content from "../models/content.model";
import { bulletinView } from "../views";

export const contentController = new Elysia({ prefix: "/content", tags: ["Assets & Bulletin"] })
  .get("/assets", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { assets: await content.listAssets(query.companyId) };
  })
  .post(
    "/assets",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["hr_admin", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { asset: (await content.createAsset(body))[0] };
    },
    {
      body: t.Object({
        companyId: t.String(),
        code: t.String(),
        name: t.String(),
        category: t.Optional(t.String()),
        serialNumber: t.Optional(t.String()),
        assignedEmployeeId: t.Optional(t.String()),
        assignedAt: t.Optional(t.String()),
        condition: t.Optional(t.Union([t.Literal("good"), t.Literal("fair"), t.Literal("damaged")])),
        notes: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/bulletins",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["manager", "hr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { bulletin: bulletinView((await content.createBulletin(body))[0] ?? {}) };
    },
    {
      body: t.Object({
        companyId: t.String(),
        departmentId: t.Optional(t.String()),
        authorId: t.Optional(t.String()),
        title: t.String(),
        body: t.String(),
      }),
    },
  )
  .get("/bulletins", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return {
      bulletins: (await content.listBulletins(query.companyId, query.status)).map(bulletinView),
    };
  })
  /** Only HRD publishes; a department head can never self-approve. */
  .post(
    "/bulletins/:id/approve",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["hr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const row = await content.approveBulletin(params.id, body.approved, body.approvedBy);
      if (!row) {
        set.status = 404;
        return { error: "not_found" };
      }
      return { bulletin: bulletinView(row) };
    },
    { body: t.Object({ approved: t.Boolean(), approvedBy: t.Optional(t.String()) }) },
  );