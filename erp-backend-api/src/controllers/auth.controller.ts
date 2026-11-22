import { Elysia, t } from "elysia";
import { guard, signToken, TOKEN_TTL } from "../middleware/auth";
import * as accountModel from "../models/account.model";
import { principalView, profileView } from "../views";

export const authController = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .post(
    "/login",
    async ({ body, set }) => {
      const user = await accountModel.verifyCredentials(body.email, body.password);
      if (!user) {
        set.status = 401;
        return { error: "invalid_credentials" };
      }

      await accountModel.touchLastLogin(user.id);

      const principal = {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
        email: user.email,
      };
      const profile = await accountModel.findProfile(user.id);

      return {
        token: signToken(principal),
        expiresIn: TOKEN_TTL,
        principal: principalView(principal),
        profile: profile ? profileView(profile) : null,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    },
  )
  .get("/me", async ({ headers, set }) => {
    const auth = await guard(headers);
    if ("error" in auth) {
      set.status = auth.status;
      return { error: auth.error };
    }

    const profile = await accountModel.findProfile(auth.principal.userId);
    return {
      principal: principalView(auth.principal),
      profile: profile ? profileView(profile) : null,
    };
  })
  .post("/logout", () => ({ ok: true }));