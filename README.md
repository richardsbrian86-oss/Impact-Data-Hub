# Impact Data Hub

Impact Data Hub is a full-stack nonprofit management platform that gives small and mid-sized organizations a single place to track donors, funding, and programs — with a web dashboard and companion mobile app backed by a shared API.

## Overview

Nonprofit teams often manage donor relationships, grant funding, and program outcomes across disconnected spreadsheets and tools. Impact Data Hub consolidates that data into one system with a REST API, a React web dashboard, and a React Native mobile app, so staff and board members can track impact from any device.

## Features

- **Authentication** — JWT-based sessions (cookie or bearer token) with rate-limited login endpoints
- **Donor management** — create, update, and search donor records and contact history
- **Program tracking** — manage programs and view outcome metrics
- **Funding records** — log and report on grants and funding sources
- **Organization profiles** — maintain core organization information
- **Dashboard analytics** — KPI cards, donor trend charts, funding overview, and operational-efficiency views (built with Recharts)
- **CSV import/export** — bulk data workflows via PapaParse / react-csv
- **Mobile app** — Expo/React Native client sharing the same typed API client as the web dashboard

## Architecture

This is a pnpm-workspace monorepo:

| Package | Description |
|---|---|
| `artifacts/api-server` | Express 5 REST API — auth, donors, programs, funding, org, and dashboard routes |
| `artifacts/dashboard` | React + Vite web dashboard (Tailwind CSS, Radix UI, Recharts) |
| `artifacts/mobile` | Expo/React Native mobile app |
| `lib/db` | Drizzle ORM schema and database access (PostgreSQL) |
| `lib/api-spec` | OpenAPI spec, source of truth for the API contract |
| `lib/api-client-react` | Typed API client/hooks generated from the OpenAPI spec via Orval |
| `lib/api-zod` | Shared Zod validation schemas |

Request validation is enforced end-to-end with Zod (`zod/v4` + `drizzle-zod`), and API types are code-generated from the OpenAPI spec so the web and mobile clients stay in sync with the server.

## Tech Stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **API:** Express 5, JWT auth, `express-rate-limit`, Pino logging
- **Database:** PostgreSQL, Drizzle ORM
- **Web:** React, Vite, Tailwind CSS, Radix UI, Recharts, TanStack Query
- **Mobile:** Expo, React Native, Expo Router
- **Validation & contracts:** Zod, `drizzle-zod`, OpenAPI + Orval codegen
- **Build:** esbuild (API bundle), Vite (web), Expo CLI (mobile)

## Getting Started

**Prerequisites:** Node.js 24, pnpm, and a PostgreSQL database.

```bash
# Install dependencies
pnpm install

# Set the database connection string
export DATABASE_URL="postgres://user:password@host:5432/dbname"

# Push the database schema (dev only)
pnpm --filter @workspace/db run push

# Run the API server (http://localhost:5000)
pnpm --filter @workspace/api-server run dev

# Run the web dashboard
pnpm --filter @workspace/dashboard run dev
```

If the API contract changes, regenerate the typed client and schemas before testing the frontend:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Useful workspace-wide scripts:

```bash
pnpm run typecheck   # typecheck all packages
pnpm run build        # typecheck + build all packages
```

## Project Status

Impact Data Hub is an active work in progress. The API, web dashboard, and mobile app are functional for core donor, program, and funding workflows; additional features and polish are ongoing.

## License

Licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.
