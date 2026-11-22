import { Elysia, t } from "elysia";
import { config } from "../config";
import { guard } from "../middleware/auth";
import * as accountModel from "../models/account.model";
import { principalView, profileView } from "../views";

const passwordErrorStatus: Record<string, 400 | 401 | 404> = {
  user_not_found: 404,
  wrong_current_password: 401,
  password_unchanged: 400,
  password_too_short: 400,
};

export const accountController = new Elysia({ prefix: "/account", tags: ["Account"] })
  .get("/profile", async ({ headers, query, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    // Only a super admin may look at somebody else's profile.
    const targetId =
      query.userId && auth.principal.role === "super_admin" ? query.userId : auth.principal.userId;

    const profile = await accountModel.findProfile(targetId);
    if (!profile) {
      set.status = 404;
      return { error: "profile_not_found" };
    }
    return { profile: profileView(profile) };
  })
  .patch(
    "/profile",
    async ({ headers, body, set }) => {
      const auth = await guard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const updated = await accountModel.updateProfile({
        userId: auth.principal.userId,
        fullName: body.fullName,
        email: body.email,
        nickname: body.nickname,
        phone: body.phone,
        address: body.address,
      });

      if (!updated) {
        set.status = 404;
        return { error: "user_not_found" };
      }
      return { profile: profileView(updated) };
    },
    {
      body: t.Object({
        userId: t.Optional(t.String()),
        fullName: t.Optional(t.String({ minLength: 2 })),
        email: t.Optional(t.String({ format: "email" })),
        nickname: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/change-password",
    async ({ headers, body, set }) => {
      const auth = await guard(headers);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const check = await accountModel.checkPasswordChange(
        auth.principal.userId,
        body.currentPassword,
        body.newPassword,
      );
      if (check !== "ok") {
        set.status = passwordErrorStatus[check] ?? 400;
        return { error: check };
      }

      await accountModel.changePassword(auth.principal.userId, body.newPassword);
      return { ok: true };
    },
    {
      body: t.Object({
        userId: t.Optional(t.String()),
        currentPassword: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: accountModel.PASSWORD_MIN_LENGTH, maxLength: 128 }),
      }),
    },
  )
  /** Public: always answers ok so the endpoint cannot enumerate emails. */
  .post(
    "/forgot-password",
    async ({ body }) => {
      const user = await accountModel.findUserByEmail(body.email);
      if (!user || !user.isActive) return { ok: true };

      const issued = await accountModel.createResetToken(user.id);
      const dev = config.nodeEnv !== "production";

      return {
        ok: true,
        ...(dev ? { token: issued.token, expiresAt: issued.expiresAt.toISOString(), email: user.email } : {}),
      };
    },
    { body: t.Object({ email: t.String({ format: "email" }) }) },
  )
  /** Public: the token itself is the credential. */
  .post(
    "/reset-password",
    async ({ body, set }) => {
      const done = await accountModel.consumeResetToken(body.token, body.newPassword);
      if (!done) {
        set.status = 400;
        return { error: "token_invalid_or_expired" };
      }
      return { ok: true };
    },
    {
      body: t.Object({
        token: t.String({ minLength: 16 }),
        newPassword: t.String({ minLength: accountModel.PASSWORD_MIN_LENGTH, maxLength: 128 }),
      }),
    },
  )
  .get("/reset-password/verify", async ({ query }) => {
    if (!query.token) return { valid: false };
    return { valid: await accountModel.isResetTokenValid(query.token) };
  })
  /* ------------------------------------------------------------- users (admin) */
  .get("/users", async ({ headers, set }) => {
    const auth = await guard(headers, ["admin", "hr_admin"]);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }
    return { users: (await accountModel.listUsers()).map((row) => ({ ...row, passwordHash: undefined })) };
  })
  .post(
    "/users",
    async ({ headers, body, set }) => {
      const auth = await guard(headers, ["admin", "hr_admin"]);
      if ("error" in auth) {
        set.status = auth.status;
        return { error: auth.error };
      }

      const [created] = await accountModel.createUser(body);
      if (!created) {
        set.status = 400;
        return { error: "create_failed" };
      }
      return { user: { ...created, passwordHash: undefined }, actor: principalView(auth.principal) };
    },
    {
      body: t.Object({
        companyId: t.Optional(t.String()),
        employeeId: t.Optional(t.String()),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: accountModel.PASSWORD_MIN_LENGTH }),
        fullName: t.String(),
        role: t.Union([
          t.Literal("super_admin"),
          t.Literal("admin"),
          t.Literal("hr_admin"),
          t.Literal("opr_admin"),
          t.Literal("manager"),
          t.Literal("staff"),
        ]),
      }),
    },
  );