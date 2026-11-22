# AGENTS.md — S.T.A.R.S

Three standalone projects in one workspace. This file is the contract for every AI agent working here.
Optimized for **DeepSeek** as the default model: short prompts, deterministic steps, no exploratory
wandering, prefix-stable context so provider prompt caching actually hits.

## Layout

```
product_requirements_document_prd.md   the spec (multi-company HRIS + fleet logistics)
erp-backend-api/    Bun + Elysia, MVC: controllers/ (flow + auth) | models/ (services) | views/ (payload)
erp-web-dashboard/  Next.js 16 App Router + Tailwind 4 + the whole Arc UI registry
erp-mobile-app/     Expo SDK 58 + React Native 0.88, S.T.A.R.S / com.stars.raihanrivana
_archive/           the previous monorepo (Express + Vite + Expo), read-only reference
```

## Hard rules

1. **One task = one project.** Touch only the folder the task names (`erp-backend-api` |
   `erp-web-dashboard` | `erp-mobile-app`). Cross-project API changes start in the backend schema.
2. **Never hand-write a component Arc UI already ships.** Check
   `erp-web-dashboard/src/components/arc/MANIFEST.md` first and import from
   `@/components/arc/<name>/<name>`.
3. **The web `arc` folder is vendored, never edited.** It is regenerated wholesale; put
   adaptations in `erp-web-dashboard/src/components/` instead. Exception already made:
   `src/components/arc/blocks` is excluded from type-check (unused marketing blocks, one has a
   React 19 type clash).
4. **Mobile cannot import the web registry.** React DOM + CSS modules do not run on React Native.
   Use the hand-written ports in `erp-mobile-app/src/components/arc` and keep
   `MANIFEST.md` there up to date when you add one.
5. **No new dependency without a stated reason.** Web needs only `motion`, `lucide-react` and the
   Radix packages the registry lists. Mobile needs Expo + `react-native-safe-area-context`; charts
   are drawn with `View`, so do not add `react-native-svg` casually.
6. **Env secrets come from `.env` only.** Never inline a database URL, JWT secret or API key.
7. **Business rules live in one place.** Cutoff, lateness, C/CDT, KPI bands and matrix colours are
   implemented in `erp-backend-api/src/lib/*` and consumed by `src/models/*`; change both or neither.
8. **Backend stays MVC.** A controller does `guard()` → model → view. Never query Drizzle from a
   controller, never shape a response inside a model, never read `headers` outside a controller.
9. **`/wmpl` is the built-in tenant workspace.** Web lives in `src/app/wmpl`, mobile in
   `src/screens/WmplScreen.tsx`; both read `GET /company/wmpl`. Keep the two in sync.

## Commands

```bash
# backend
cd erp-backend-api && bun install
bun run db:push && bun run db:seed
bun run dev            # :4000, Swagger at /docs
bun run typecheck

# dashboard
cd erp-web-dashboard && bun install
bun run dev            # :3000
bun run build          # must stay green

# mobile
cd erp-mobile-app && bun install
bun run start
bunx tsc --noEmit      # must stay green
```

Root helpers: `npm run api:web:mobile` · `api:web` · `api:mobile` (satu terminal, log ber-prefix)
serta `build:web`, `db:push`, `db:seed`. Jangan menambah file `.cmd` untuk startup.

## Token-efficient workflow (DeepSeek)

- Read only the files the task touches; use `MANIFEST.md` and the barrels instead of crawling.
- Plan in ≤5 bullets, write the files, then stop. No trial-and-error loops.
- Never paste whole files back into chat; summarize diffs in ≤3 lines per file.
- Batch independent edits in a single tool call; keep prompts/prefixes stable between turns.
- Cap output: `max_tokens` 512 by default, 1024 only for code generation.

## Model policy

- Primary model: **DeepSeek** (`deepseek-chat`), chosen in Qoder's model selector.
- No external agent tokens required: the app runs with sample data when the API is down.
- Anything that would burn a lot of context (registry scans, doc reading) goes to a subagent in
  `.qoder/agents/`.

## Subagents & skills

- `fullstack-shipper` — end-to-end slices across backend + web + mobile.
- `arc-ui-builder` — picks and wires Arc UI components into screens.
- Skills in `.qoder/skills`: `arc` wins over `design-taste-frontend` inside the product app.