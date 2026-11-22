import { Elysia, t } from "elysia";
import { guard } from "../middleware/auth";
import * as people from "../models/people.model";
import { employeeView } from "../views";

export const peopleController = new Elysia({ prefix: "/people", tags: ["People"] })
  .get("/employees", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { employees: (await people.listEmployees(query.companyId)).map(employeeView) };
  })
  .get("/employees/:id", async ({ headers, params, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const employee = await people.getEmployee(params.id);
    if (!employee) {
      set.status = 404;
      return { error: "employee_not_found" };
    }
    return { employee };
  })
  .post(
    "/employees",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["hr_admin", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const employee = await people.createEmployee(body);
      if (!employee) {
        set.status = 400;
        return { error: "region_not_found" };
      }
      return { employee };
    },
    {
      body: t.Object({
        companyId: t.String(),
        regionId: t.String(),
        branchId: t.Optional(t.String()),
        departmentId: t.Optional(t.String()),
        shiftId: t.Optional(t.String()),
        type: t.Union([t.Literal("S"), t.Literal("D"), t.Literal("MK")]),
        fullName: t.String(),
        nickname: t.Optional(t.String()),
        nik: t.Optional(t.String()),
        birthDate: t.Optional(t.String()),
        gender: t.Optional(t.Union([t.Literal("male"), t.Literal("female")])),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String()),
        address: t.Optional(t.String()),
        joinDate: t.String(),
        managerId: t.Optional(t.String()),
        isDepartmentHead: t.Optional(t.Boolean()),
        simNumber: t.Optional(t.String()),
        simType: t.Optional(t.String()),
        simExpiry: t.Optional(t.String()),
        specialization: t.Optional(t.String()),
        employeeCode: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/employees/:id/assign-location",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["hr_admin", "admin", "opr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return people.assignLocation(params.id, body.locationId);
    },
    { body: t.Object({ locationId: t.String() }) },
  );