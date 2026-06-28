---
name: Raksh AI architecture
description: Multimodal disaster intelligence chat built on Gemini — key decisions, endpoints, and environment quirks.
---

## Key Env Var
`GEMINI_API_KEY` — must be in Replit Secrets. Server process must restart to pick up a newly-added secret.

## Backend Endpoints (artifacts/api-server/src/routes/raksh.ts)
- `GET  /api/raksh/status` — returns `{ ok, model, timestamp }`
- `POST /api/raksh/chat` — SSE streaming chat (main endpoint)
- `GET  /api/raksh/brief` — generates daily disaster brief (non-streaming JSON)
- `POST /api/raksh/analyze-image` — Gemini Vision; body: `{ imageData: string (base64), mimeType, userPrompt? }`
- `POST /api/raksh/analyze-document` — document analysis; body: `{ content: string, fileName, userPrompt? }`
- `GET  /api/raksh/intelligence/status` — live data source health check
- `POST /api/raksh/generate-image` — AI image gen via Pollinations.ai flux; body: `{ prompt, seed?, width?, height? }`; returns `{ imageData: base64, mimeType, prompt, enhancedPrompt, provider, seed, width, height }`
- `POST /api/raksh/generate-report` — comprehensive intel report; body: `{ location?, focusArea?, userContext? }`; returns `{ content: string (markdown), generatedAt, meta }`

## Image Generation Architecture
- Provider: Pollinations.ai with flux model (free, no API key, CORS-enabled)
- Prompt enhancement: Gemini text model enhances the prompt first (10s timeout), then image is fetched
- Auto-orientation: "poster"/"infographic" → 832×1152 portrait; "banner"/"wide" → 1216×512 landscape; default 1024×1024
- Image returned as base64 (avoids all CORS issues); frontend renders as data URI
- Download uses same data URI → no CORS issues
- Variations: same prompt + new random seed
- Regenerate: same prompt + new random seed

## Image Intent Detection (RakshContext.tsx)
IMAGE_GEN_PATTERNS array detects prompts like "generate poster", "create infographic", "draw illustration", "visualize", etc.
When detected, `sendMessage` routes to `generateImage` instead of the chat endpoint.

## System Prompt Modes (BASE_SYSTEM_PROMPT)
- EMERGENCY MODE — triggered by SOS/help/emergency keywords
- DISASTER SIMULATION MODE — triggered by "what if", "simulate", "scenario"
- RESOURCE PLANNING MODE — triggered by "deploy", "allocate", "volunteers"
- NAVIGATION COMMANDS — `<raksh-command>` tags for app routing

## Frontend (artifacts/earth-guardian/src/components/raksh/)
- `RakshContext.tsx` — all state and API calls; `sendMessage` auto-routes image prompts to `generateImage`; `RakshGeneratedImage` interface stores image metadata
- `RakshChatPanel.tsx` — full chat UI with:
  - GeneratedImageBubble component: renders image + download/regenerate/variation/copy-prompt/fullscreen buttons
  - Fullscreen modal: fixed overlay with download button
  - Image template buttons: 8 disaster-specific templates in empty state
  - Drag-and-drop file upload; hands-free voice mode; TTS; report generator
- `RakshMarkdown.tsx` — custom markdown renderer
- `src/hooks/useVoiceOutput.ts` — SpeechSynthesis hook

## Key Implementation Notes
- `@google/generative-ai` v0.24.1 is installed (does NOT support Imagen natively, hence Pollinations)
- Hands-free useEffect must return `undefined` explicitly on the else path (TS7030 error otherwise)
- `processFile` extracted from `handleFileSelect` so drag-drop reuses same logic
- `GeneratedImageBubble` uses local `useState` for copy-prompt feedback (independent of parent)

## Pre-existing TypeScript Errors
`api-client-react` dist not built → TS6305 errors in dashboard/live-map files. Pre-existing, unrelated to Raksh AI.
