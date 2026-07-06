# [Impact-Data-Hub]

_The Impact Data Hub (ImpactIQ) is a professional-grade, multi-platform dashboard and mobile application designed to empower non-profit leadership and boards with real-time data visibility.._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Always Run Codegen: Never manually update a database schema or the OpenAPI spec without running pnpm --filter @workspace/api-spec run codegen immediately after. Your frontend and mobile clients rely on these types; if they drift, you will get runtime errors that are hard to debug.

Zod Schema Discipline: Every new API route must use safeParse via parseBody. If you write a route that accepts req.body without strict Zod validation, the CI/CD "Production-Hardening" standards will reject the build.

The Auth Redirect: The mobile app's 401 interceptor will force a navigation to /login. If you are debugging and trigger a 401, it will clear your session token. Don't be alarmed—this is the "resilience" layer working as intended.

Schema Pushing: Always verify your drizzle-kit push status before deploying a new feature that depends on a database column. If you don't see your indexes or unique constraints in the public schema, the API will fail to enforce the rules you’ve set.

Environment Variables: Never add new environment variables directly to your code. Always define them in your Replit Secrets first, then reference them in process.env. If a variable is missing, the API server is configured to crash on startup to prevent undefined behavior_

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
