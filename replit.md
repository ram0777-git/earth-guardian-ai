# Earth Guardian AI

An AI-powered disaster prediction platform that helps communities prepare for and respond to natural disasters with real-time alerts, risk analysis, and volunteer coordination.

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

- `artifacts/earth-guardian/` — React + Vite frontend app (served at `/`)
- `artifacts/earth-guardian/src/components/` — All UI components (organized by page)
- `artifacts/earth-guardian/src/pages/` — Page route components
- `artifacts/earth-guardian/src/data/` — Sample data and type definitions
- `artifacts/earth-guardian/src/index.css` — Global CSS with theme tokens and animations
- `artifacts/api-server/` — Express API backend (served at `/api`)
- `lib/api-spec/openapi.yaml` — API spec (source of truth)

## Architecture decisions

- Migrated from Next.js → Vite + React with wouter for routing
- `next/link` replaced with wouter `Link`; `usePathname` → wouter `useLocation`
- `next/dynamic` lazy loading replaced with React `lazy` + `Suspense`
- All `"use client"` directives removed (not applicable in Vite)
- Tailwind v4 with custom CSS variables for glassmorphism theme
- Lenis smooth scroll provider wraps the whole app

## Product

- Home: animated hero with AI earth visualization, feature showcase, statistics
- Dashboard: risk scores, weather cards, AI predictions, charts, disaster timeline
- Risk Analysis: regional risk factor breakdown
- Live Map: global disaster event map
- Emergency Planner: personalized preparedness checklist
- Volunteer Network: community volunteer coordination
- About: project and team information

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
