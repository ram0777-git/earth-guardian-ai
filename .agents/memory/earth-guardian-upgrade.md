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
navLinks now has 16 entries. Navbar uses PRIMARY_LINKS (first 6) as direct links and shows the rest under a "More" dropdown. On tablet, shows first 4 + More.
New primary links (positions 3–8): Command Center, Live Map, Situation, Decision AI, Daily Brief, Timeline.

## 8 hackathon features added (v3)
Pages created: CommandCenterPage (/command-center), DailyBriefPage (/daily-brief), SituationPage (/situation), DecisionAssistantPage (/decision), TimelinePage (/timeline).
API endpoint added: POST /raksh/decision — AI impact prediction + government action plan + resource allocation. Has full fallback if AI fails.
All pages match exact dark theme: bg-[#06121F], glass cards border-white/8 bg-white/[0.04], framer-motion fadeUp+stagger.
Command Center: animated KPI tiles + live alerts feed + animated regional risk heatmap + AI recommendations.
Situation: filterable live event grid, 30s auto-refresh countdown with progress bar.
Timeline: chronological grouped-by-day animated timeline with severity filter.
Decision Assistant: form input → AI returns impact, 8 prioritized actions, resource table (ambulances, beds, etc.).

## API provider fallback
`/api/raksh/chat`: Gemini primary (2 retries, 5-min cooldown on failure) → OpenRouter → Groq. Status visible via `/api/raksh/status`. Optional env vars: `OPENROUTER_API_KEY`, `GROQ_API_KEY`.

## Pre-existing TS errors
`lib/api-client-react/dist/index.d.ts` not built — causes TS6305 errors in tsc --noEmit. These are pre-existing and don't affect Vite dev/build. Run `pnpm --filter @workspace/api-client-react build` to fix if needed.

**Why:** The library uses TypeScript project references but dist is gitignored, so a clean checkout always has this error until the lib is built.
