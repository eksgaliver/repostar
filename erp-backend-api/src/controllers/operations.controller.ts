import { Elysia, t } from "elysia";
import { guard } from "../middleware/auth";
import * as operations from "../models/operations.model";
import {
  deliveryOrderView,
  fifoView,
  kpiView,
  matrixView,
  regionDashboardView,
  routeView,
} from "../views";

const statusUnion = t.Union([
  t.Literal("P.M"),
  t.Literal("P.B"),
  t.Literal("KM"),
  t.Literal("TPR"),
  t.Literal("TR"),
  t.Literal("A.B"),
  t.Literal("S.T"),
  t.Literal("NUP"),
  t.Literal("NUPL"),
  t.Literal("PART"),
  t.Literal("REJECT"),
  t.Literal("INSIDEN"),
  t.Literal("C"),
  t.Literal("TAS"),
  t.Literal("B.M"),
  t.Literal("A.M"),
  t.Literal("HUJAN"),
  t.Literal("BUBUT"),
  t.Literal("RJ"),
  t.Literal("PR"),
]);

export const operationsController = new Elysia({ prefix: "/operations", tags: ["Operations"] })
  /* ------------------------------------------------------------------ units */
  .get("/units", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { units: await operations.listUnits(query.companyId) };
  })
  .post(
    "/units",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin", "opr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { unit: (await operations.createUnit(body))[0] };
    },
    {
      body: t.Object({
        companyId: t.String(),
        regionId: t.String(),
        branchId: t.Optional(t.String()),
        plateNumber: t.String(),
        brand: t.Optional(t.String()),
        model: t.Optional(t.String()),
        year: t.Optional(t.Number()),
        specification: t.Optional(t.String()),
        korlapId: t.Optional(t.String()),
      }),
    },
  )
  /** Driver mutation requires an admin, exactly as the PRD states. */
  .post(
    "/units/:id/assign-driver",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const unit = await operations.assignDriver({ unitId: params.id, ...body });
      if (!unit) {
        set.status = 404;
        return { error: "unit_not_found" };
      }
      return { unit };
    },
    {
      body: t.Object({
        driverId: t.String(),
        fromDate: t.String(),
        approvedBy: t.Optional(t.String()),
        previousUnitId: t.Optional(t.String()),
      }),
    },
  )
  .get("/units/:id/targets", async ({ headers, params, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { targets: await operations.listUnitTargets(params.id) };
  })
  .post(
    "/units/:id/targets",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { target: await operations.upsertUnitTarget({ unitId: params.id, ...body }) };
    },
    {
      body: t.Object({
        periodMonth: t.String({ pattern: "^\\d{4}-\\d{2}$" }),
        targetKm: t.Number({ minimum: 1 }),
        setBy: t.Optional(t.String()),
      }),
    },
  )
  /* ----------------------------------------------------------------- routes */
  .get("/routes", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    const rows = await operations.listRoutes(query.companyId);
    return { routes: rows.map((row) => routeView(row.route, row.versions)) };
  })
  .post(
    "/routes",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin", "opr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { route: (await operations.createRoute(body))[0] };
    },
    {
      body: t.Object({
        companyId: t.String(),
        customerId: t.Optional(t.String()),
        code: t.String(),
        originLabel: t.String(),
        destinationLabel: t.String(),
        originRegionId: t.Optional(t.String()),
        destinationRegionId: t.Optional(t.String()),
        cargoType: t.Optional(t.String()),
      }),
    },
  )
  /** A monthly OA change always creates a new version, never an overwrite. */
  .post(
    "/routes/:id/versions",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["admin", "opr_admin", "manager"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const version = await operations.createRouteVersion({ routeId: params.id, ...body });
      if (!version) {
        set.status = 404;
        return { error: "route_not_found" };
      }
      return { version };
    },
    {
      body: t.Object({
        periodMonth: t.String({ pattern: "^\\d{4}-\\d{2}$" }),
        distanceKm: t.Number({ minimum: 0 }),
        oaAmount: t.Number({ minimum: 0 }),
        createdBy: t.Optional(t.String()),
      }),
    },
  )
  .get("/routes/versions/:id/filters", async ({ headers, params, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { filters: await operations.listRouteFilters(params.id) };
  })
  .post(
    "/routes/versions/:id/filters",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["admin", "opr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { filter: (await operations.createRouteFilter({ routeVersionId: params.id, ...body }))[0] };
    },
    {
      body: t.Object({
        allowPlates: t.Optional(t.Array(t.String())),
        minYear: t.Optional(t.Number()),
        requiredSpec: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  /* ---------------------------------------------------------- delivery order */
  .get("/delivery-orders", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    const rows = await operations.listDeliveryOrders(query.companyId);
    return { deliveryOrders: rows.map((row) => deliveryOrderView(row, auth.principal.role)) };
  })
  /** Relation: DO number, route, cargo, units. The OA field is not accepted here. */
  .post(
    "/delivery-orders",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["staff", "manager", "opr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { deliveryOrder: (await operations.createDeliveryOrder(body))[0] };
    },
    {
      body: t.Object({
        companyId: t.String(),
        doNumber: t.String(),
        routeVersionId: t.String(),
        cargoType: t.Optional(t.String()),
        requestedUnits: t.Number({ minimum: 1 }),
        relationUserId: t.Optional(t.String()),
        requestDate: t.String(),
        notes: t.Optional(t.String()),
      }),
    },
  )
  /** Marketing fills the OA nominal that Relation cannot see. */
  .post(
    "/delivery-orders/:id/oa",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["manager", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const row = await operations.fillDeliveryOrderOa(params.id, body.oaAmount, body.marketingUserId);
      if (!row) {
        set.status = 404;
        return { error: "not_found" };
      }
      return { deliveryOrder: deliveryOrderView(row, auth.principal.role) };
    },
    { body: t.Object({ oaAmount: t.Number({ minimum: 0 }), marketingUserId: t.Optional(t.String()) }) },
  )
  /* --------------------------------------------------------------- matrix */
  .get("/matrix", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { matrix: (await operations.listMatrix(query)).map(matrixView) };
  })
  .post(
    "/matrix",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["opr_admin", "manager", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const result = await operations.upsertMatrix({
        ...body,
        actingRole: auth.principal.role,
        updatedBy: auth.principal.userId,
      });

      if ("error" in result) {
        set.status = 422;
        return { error: result.error, status: result.status };
      }
      if (!result.row) {
        set.status = 500;
        return { error: "matrix_not_saved" };
      }
      return { matrix: matrixView(result.row) };
    },
    {
      body: t.Object({
        unitId: t.String(),
        driverId: t.Optional(t.String()),
        matrixDate: t.String(),
        status: statusUnion,
        kmValue: t.Optional(t.Number()),
        noteKm: t.Optional(t.Number()),
        pic: t.Optional(t.Union([t.Literal("Operasional"), t.Literal("Marketing/Alam")])),
        info: t.Optional(t.String()),
        infoSource: t.Optional(t.Union([t.Literal("Korlap"), t.Literal("Manajemen")])),
        problem: t.Optional(t.String()),
        solution: t.Optional(t.String()),
        sop: t.Optional(t.String()),
        korlapId: t.Optional(t.String()),
      }),
    },
  )
  .get("/kpi", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { kpi: (await operations.kpi(query)).map(kpiView) };
  })
  .get("/fifo", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { fifo: (await operations.fifo(query)).map(fifoView) };
  })
  .get("/dashboard/region", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { dashboard: regionDashboardView(await operations.regionDashboard(query)) };
  });