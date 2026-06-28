---
name: Earth Guardian v2 upgrade
description: Summary of durable decisions made during the multimodal platform upgrade.
---

## Workflow names (critical)
- Frontend: `artifacts/earth-guardian: web`
- API: `artifacts/api-server: API Server`
- Canvas: `artifacts/mockup-sandbox: Component Preview Server`
- The `.migration-backup/` prefixed variants are stale/failed — ignore them.

## Routes added
`/simulation` → DisasterSimulationPage, `/reports` → ReportsPage, `/image-gallery` → ImageGalleryPage — all lazy-loaded in App.tsx.

## Gallery image sync
Images generated via `generateImage()` in RakshContext are saved to `localStorage["raksh_image_gallery"]` immediately (max 100 entries). ImageGalleryPage reads from the same key.

## Nav overflow pattern
navLinks has 11 entries. Navbar uses PRIMARY_LINKS (first 6) as direct links and shows the rest under a "More" dropdown. On tablet, shows first 4 + More.

## API provider fallback
`/api/raksh/chat`: Gemini primary (2 retries, 5-min cooldown on failure) → OpenRouter → Groq. Status visible via `/api/raksh/status`. Optional env vars: `OPENROUTER_API_KEY`, `GROQ_API_KEY`.

## Pre-existing TS errors
`lib/api-client-react/dist/index.d.ts` not built — causes TS6305 errors in tsc --noEmit. These are pre-existing and don't affect Vite dev/build. Run `pnpm --filter @workspace/api-client-react build` to fix if needed.

**Why:** The library uses TypeScript project references but dist is gitignored, so a clean checkout always has this error until the lib is built.
