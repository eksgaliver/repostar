# erp-backend-api — S.T.A.R.S ERP

Bun 1.4 + ElysiaJS + Drizzle ORM + PostgreSQL 17 (+ DragonflyDB via `REDIS_URL`).

## Run

```bash
cp .env.example .env        # edit DATABASE_URL
bun install
bun run db:push             # create tables
bun run db:seed             # WMPL baseline + admin accounts
bun run dev                 # http://localhost:4000  (Swagger: /docs)
```

## Layout

```
src/
  config.ts                env, cutoff days, CORS
  index.ts                 Elysia app, CORS, Swagger, error handler
  db/
    schema.ts              every table; all business rows carry company_id
    client.ts              Drizzle + postgres-js client
    seed.ts                WMPL: regions, branches, departments, shift, fleet
  lib/
    cutoff.ts              cycle 26 -> 25, working days, 0-minute lateness
    employee-code.ts       PK.D.001 generator
    performance.ts         KPI formulas + green/cream/red bands
  modules/
    master-data.ts         companies, regions, branches, departments, shifts, geofences
    people.ts              employees (+driver/mechanic profiles), users & RBAC
    attendance.ts          clock in/out, requests, leave balances, cutoff recap
    operations.ts          units, mutations, targets, routes+versions, DO, matrix, FIFO, KPI
    content.ts             assets, bulletins with HRD approval
```

## Rules baked into the code

- 0-minute tolerance: `clock-in` after shift start is `LATE` immediately.
- Cutoff recap runs 26th → 25th.
- Approved leave with balance → `C` (balance deducted); without balance → `CDT`.
- Route OA changes create a **new** `route_versions` row with a unique code; old months stay intact.
- `B.M` / `A.M` keep their KM in `note_km` and are excluded from `totalKm`.
- PIC is forced to `Operasional` unless the caller is `admin` / `super_admin`.
- `NUP`, `NUPL`, `REJECT`, `INSIDEN`, `B.M`, `A.M` are rejected without `info`.

## Endpoints

`GET /health`, `GET /docs` (Swagger), then `/master/*`, `/people/*`, `/attendance/*`,
`/operations/*`, `/content/*`.