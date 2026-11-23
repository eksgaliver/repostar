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
  )
  .post(
    "/employees/onboard",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["hr_admin", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const result = await people.onboardEmployee({
        ...body,
        account: {
          email: body.account.email,
          // Only a super admin may open an account above staff level; HR always gets staff.
          role: auth.principal.role === "super_admin" ? body.account.role ?? "staff" : "staff",
        },
      });
      if ("error" in result) {
        set.status = result.error === "email_taken" ? 409 : 400;
        return { error: result.error };
      }

      // Never echo the stored hash; the caller only needs the login identity.
      return {
        employee: result.employee,
        account: {
          id: result.user?.id,
          email: result.user?.email,
          role: result.user?.role,
          mustChangePassword: true,
          onboardingPassword: people.ONBOARDING_PASSWORD,
        },
      };
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
        address: t.Optional(t.String()),
        photo: t.Optional(t.String()),
        positionId: t.Optional(t.String()),
        joinDate: t.String(),
        managerId: t.Optional(t.String()),
        isDepartmentHead: t.Optional(t.Boolean()),
        isFieldCoordinator: t.Optional(t.Boolean()),
        contractType: t.Optional(t.String()),
        contractEndDate: t.Optional(t.String()),
        employeeCode: t.Optional(t.String()),
        account: t.Object({
          email: t.String({ format: "email" }),
          role: t.Optional(
            t.Union([
              t.Literal("staff"),
              t.Literal("manager"),
              t.Literal("hr_admin"),
              t.Literal("opr_admin"),
              t.Literal("kpi_admin"),
              t.Literal("admin"),
              t.Literal("super_admin"),
            ])
          ),
        }),
      }),
    },
  )
  .patch(
    "/employees/:id/resign",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["hr_admin", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const resignDate = body.resignDate ?? new Date().toISOString().slice(0, 10);
      const employee = await people.resignEmployee(params.id, resignDate);
      if (!employee) {
        set.status = 404;
        return { error: "employee_not_found" };
      }
      return { employee };
    },
    { body: t.Object({ resignDate: t.Optional(t.String()) }) },
  )
  .patch(
    "/employees/:id/department",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["hr_admin", "admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      const employee = await people.assignDepartment(
        params.id,
        body.departmentId ?? null,
        body.positionId ?? null
      );
      if (!employee) {
        set.status = 404;
        return { error: "employee_not_found" };
      }
      return { employee };
    },
    {
      body: t.Object({
        departmentId: t.Optional(t.Union([t.String(), t.Null()])),
        positionId: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    },
  )
  .patch(
    "/employees/:id/role",
    async ({ headers, params, body, set }) => {
      // Empty role list: `hasRole` lets only a super admin through.
      const auth = await guard(headers, []);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const user = await people.setEmployeeRole(params.id, body.role);
      if (!user) {
        set.status = 404;
        return { error: "account_not_found" };
      }
      return { account: { id: user.id, email: user.email, role: user.role } };
    },
    {
      body: t.Object({
        role: t.Union([
          t.Literal("staff"),
          t.Literal("manager"),
          t.Literal("hr_admin"),
          t.Literal("opr_admin"),
          t.Literal("kpi_admin"),
          t.Literal("admin"),
          t.Literal("super_admin"),
        ]),
      }),
    },
  );