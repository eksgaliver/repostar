import { Elysia } from "elysia";
import { guard } from "../middleware/auth";
import * as companyModel from "../models/company.model";
import { wmplView } from "../views";

export const companyController = new Elysia({ prefix: "/company", tags: ["Company"] })
  .get("/", async ({ headers, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { companies: await companyModel.listCompanies() };
  })
  /** Workspace payload for the dedicated WMPL page on web and mobile. */
  .get("/wmpl", async ({ headers, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const overview = await companyModel.wmplOverview();
    if (!overview) {
      set.status = 404;
      return { error: "company_not_found" };
    }

    return wmplView(overview);
  })
  .get("/:code", async ({ headers, params, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const overview = await companyModel.wmplOverview(params.code.toUpperCase());
    if (!overview) {
      set.status = 404;
      return { error: "company_not_found" };
    }

    return wmplView(overview);
  });