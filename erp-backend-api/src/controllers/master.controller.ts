import { Elysia, t } from "elysia";
import { guard } from "../middleware/auth";
import * as master from "../models/master.model";

const reader = async (headers: Record<string, string | undefined>) => guard(headers);

export const masterController = new Elysia({ prefix: "/master", tags: ["Master Data"] })
  .get("/companies", async ({ headers, set }) => {
    const auth = await reader(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { companies: await master.listCompanies() };
  })
  .post(
    "/companies",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { company: (await master.createCompany(body))[0] };
    },
    {
      body: t.Object({
        code: t.String({ minLength: 2, maxLength: 16 }),
        name: t.String({ minLength: 2 }),
        legalName: t.Optional(t.String()),
        defaultTimezone: t.Optional(t.String()),
      }),
    },
  )
  .get("/regions", async ({ headers, query, set }) => {
    const auth = await reader(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { regions: await master.listRegions(query.companyId) };
  })
  .post(
    "/regions",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin", "hr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { region: (await master.createRegion(body))[0] };
    },
    {
      body: t.Object({
        companyId: t.String(),
        code: t.String({ maxLength: 8 }),
        name: t.String(),
        timezone: t.Optional(t.String()),
      }),
    },
  )
  .get("/branches", async ({ headers, query, set }) => {
    const auth = await reader(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { branches: await master.listBranches(query.regionId) };
  })
  .post(
    "/branches",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin", "hr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { branch: (await master.createBranch(body))[0] };
    },
    {
      body: t.Object({
        regionId: t.String(),
        code: t.String(),
        name: t.String(),
        address: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
      }),
    },
  )
  .get("/departments", async ({ headers, query, set }) => {
    const auth = await reader(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { departments: await master.listDepartments(query.companyId) };
  })
  .post(
    "/departments",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin", "hr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { department: (await master.createDepartment(body))[0] };
    },
    { body: t.Object({ companyId: t.String(), code: t.String(), name: t.String() }) },
  )
  .get("/shifts", async ({ headers, query, set }) => {
    const auth = await reader(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { shifts: await master.listShifts(query.companyId) };
  })
  .post(
    "/shifts",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin", "hr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const shift = await master.createShift(body);
      if (!shift) {
        set.status = 400;
        return { error: "shift_create_failed" };
      }
      return { shift };
    },
    {
      body: t.Object({
        companyId: t.String(),
        name: t.String(),
        days: t.Optional(
          t.Array(
            t.Object({
              dayOfWeek: t.Number({ minimum: 0, maximum: 6 }),
              isWorkDay: t.Optional(t.Boolean()),
              startTime: t.Optional(t.String()),
              endTime: t.Optional(t.String()),
            }),
          ),
        ),
      }),
    },
  )
  .get("/attendance-locations", async ({ headers, set }) => {
    const auth = await reader(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { locations: await master.listAttendanceLocations() };
  })
  .post(
    "/attendance-locations",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin", "hr_admin", "opr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { location: (await master.createAttendanceLocation(body))[0] };
    },
    {
      body: t.Object({
        regionId: t.String(),
        branchId: t.Optional(t.String()),
        name: t.String(),
        latitude: t.String(),
        longitude: t.String(),
        radiusMeters: t.Optional(t.Number()),
        timezone: t.String(),
      }),
    },
  );