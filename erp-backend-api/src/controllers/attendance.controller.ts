import { Elysia, t } from "elysia";
import { guard } from "../middleware/auth";
import { buildXlsx } from "../lib/xlsx";
import * as attendance from "../models/attendance.model";
import { attendanceView, recapView } from "../views";

export const attendanceController = new Elysia({ prefix: "/attendance", tags: ["Attendance"] })
  .post(
    "/clock-in",
    async ({ headers, body, set }) => {
      const auth = await guard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const result = await attendance.clockIn(body);
      if ("error" in result) {
        set.status = 404;
        return { error: result.error };
      }
      if (!result.row) {
        set.status = 500;
        return { error: "clock_in_failed" };
      }
      return { attendance: attendanceView(result.row) };
    },
    {
      body: t.Object({
        employeeId: t.String(),
        locationId: t.String(),
        workDate: t.String(),
        clockInAt: t.Optional(t.String()),
        selfieUrl: t.Optional(t.String()),
        isMockLocation: t.Optional(t.Boolean()),
        source: t.Optional(t.String()),
        syncedAt: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/clock-out",
    async ({ headers, body, set }) => {
      const auth = await guard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const row = await attendance.clockOut(body);
      if (!row) {
        set.status = 409;
        return { error: "no_clock_in" };
      }
      return { attendance: attendanceView(row) };
    },
    { body: t.Object({ employeeId: t.String(), workDate: t.String(), clockOutAt: t.Optional(t.String()) }) },
  )
  .get("/daily", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { attendances: (await attendance.listDaily(query.date)).map(attendanceView) };
  })
  .post(
    "/requests",
    async ({ headers, body, set }) => {
      const auth = await guard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }
      return { request: (await attendance.createRequest(body))[0] };
    },
    {
      body: t.Object({
        employeeId: t.String(),
        type: t.Union([
          t.Literal("cuti"),
          t.Literal("wfh"),
          t.Literal("dinas_luar"),
          t.Literal("sakit"),
          t.Literal("koreksi_absen"),
          t.Literal("lembur"),
          t.Literal("reimbursement"),
        ]),
        startDate: t.String(),
        endDate: t.String(),
        leaveDays: t.Optional(t.Number()),
        reason: t.Optional(t.String()),
        attachmentUrl: t.Optional(t.String()),
        overtimeHours: t.Optional(t.Number()),
        amount: t.Optional(t.Number()),
        receiptUrl: t.Optional(t.String()),
      }),
    },
  )
  /** Inbox for the department head / HR: pending first. */
  .get("/requests", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { requests: await attendance.listRequests({ status: query.status, employeeId: query.employeeId }) };
  })
  /** HR final validation after the department head approves. */
  .post(
    "/requests/:id/validate",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["hr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const row = await attendance.validateByHr(params.id, body.validatorId);
      if (!row) {
        set.status = 404;
        return { error: "request_not_found" };
      }
      return { request: row };
    },
    { body: t.Object({ validatorId: t.Optional(t.String()) }) },
  )
  /** PRD C.5: rekap cutoff langsung ke .xlsx untuk Payroll/Finance. */
  .get("/export.xlsx", async ({ headers, query, set }) => {
    const auth = await guard(headers, ["hr_admin", "admin"]);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const rows = await attendance.recap({ period: query.period });
    const header = [
      "ID Karyawan",
      "Nama",
      "Periode Mulai",
      "Periode Selesai",
      "Hadir (H)",
      "Terlambat",
      "Cuti (C)",
      "CDT",
      "Alfa",
    ];
    const body = rows.map((row) => [
      row.employeeCode,
      row.fullName,
      row.periodStart,
      row.periodEnd,
      row.hadirH,
      row.terlambat,
      row.cutiC,
      row.cdt,
      row.alfa,
    ]);

    const file = buildXlsx(`Rekap ${query.period ?? "cutoff"}`, header, body);
    return new Response(file, {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="rekap-kehadiran-${query.period ?? "cutoff"}.xlsx"`,
      },
    });
  })
  /** Approved by the department head; HRD/admin may also approve. */
  .post(
    "/requests/:id/approve",
    async ({ headers, params, body, set }) => {
      const auth = await guard(headers, ["manager", "hr_admin", "opr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const result = await attendance.approveRequest(params.id, body.approved, body.approverId);
      if (!result) {
        set.status = 404;
        return { error: "request_not_found" };
      }
      if ("error" in result) {
        set.status = 409;
        return { error: result.error };
      }
      return result;
    },
    { body: t.Object({ approved: t.Boolean(), approverId: t.Optional(t.String()) }) },
  )
  .get("/leave-balances", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { balances: await attendance.listLeaveBalances(query.employeeId) };
  })
  .get("/recap", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return {
      recap: (await attendance.recap(query)).map(recapView),
    };
  });