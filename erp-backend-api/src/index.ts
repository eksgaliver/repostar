import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config, isCorsOriginAllowed } from "./config";
import { db, queryClient } from "./db/client";
import { companies } from "./db/schema";
import { authController } from "./controllers/auth.controller";
import { companyController } from "./controllers/company.controller";
import { accountController } from "./controllers/account.controller";
import { masterController } from "./controllers/master.controller";
import { peopleController } from "./controllers/people.controller";
import { attendanceController } from "./controllers/attendance.controller";
import { operationsController } from "./controllers/operations.controller";
import { contentController } from "./controllers/content.controller";
import { portalController } from "./controllers/portal.controller";

/**
 * S.T.A.R.S ERP API - MVC wiring.
 *   controllers/ -> flow + auth (the only layer that sees HTTP)
 *   models/      -> services, queries, business rules
 *   views/       -> response shaping, the only place that decides what leaves
 */
const app = new Elysia()
  .use(
    cors({
      // Allow-list plus the private dev hosts (127.0.0.1 / LAN IP) so the
      // dashboard works when opened from a phone or emulator.
      origin: (request) => {
        const origin = request.headers.get("origin");
        return origin ? isCorsOriginAllowed(origin) : true;
      },
      credentials: true,
    }),
  )
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "S.T.A.R.S ERP API",
          version: "0.2.0",
          description:
            "MVC API for the multi-company HRIS + fleet ERP. Controllers guard every request, models own the queries, views shape the payload.",
        },
      },
    }),
  )
  .get("/", () => ({ name: "S.T.A.R.S ERP API", version: "0.2.0", docs: "/docs", pattern: "MVC" }))
  .get("/health", async () => {
    const [row] = await db.select({ id: companies.id }).from(companies).limit(1);
    return { status: "ok", database: row ? "reachable" : "empty", timezone: "multi" };
  })
  .use(authController)
  .use(companyController)
  .use(accountController)
  .use(masterController)
  .use(peopleController)
  .use(attendanceController)
  .use(operationsController)
  .use(contentController)
  .use(portalController)
  .onError(({ code, error }) => ({
    error: code,
    message: "message" in error ? error.message : String(error),
  }))
  .listen(config.port);

console.log(`S.T.A.R.S ERP API listening on http://localhost:${app.server?.port} (docs: /docs)`);

async function shutdown() {
  await queryClient.end({ timeout: 5 });
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export type App = typeof app;