---
name: Raksh AI architecture
description: Multimodal disaster intelligence chat built on Gemini — key decisions, endpoints, and environment quirks.
---

## Key Env Var
`GEMINI_API_KEY` — must be in Replit Secrets. Server process must restart to pick up a newly-added secret (the secret existed but the server had started before it was added, causing "Setup Required" to appear).

## Backend Endpoints (artifacts/api-server/src/routes/raksh.ts)
- `GET  /api/raksh/status` — returns `{ ok, model, timestamp }`
- `POST /api/raksh/chat` — SSE streaming chat (main endpoint)
- `GET  /api/raksh/brief` — generates daily disaster brief (non-streaming JSON)
- `POST /api/raksh/analyze-image` — Gemini Vision; body: `{ imageData: string (base64), mimeType, userPrompt? }`
- `POST /api/raksh/analyze-document` — document analysis; body: `{ content: string, fileName, userPrompt? }`
- `GET  /api/raksh/intelligence/status` — live data source health check
- `POST /api/raksh/generate-report` — comprehensive intelligence report; body: `{ location?, focusArea?, userContext? }`; returns `{ content: string (markdown), generatedAt, meta }`

## System Prompt Modes
The BASE_SYSTEM_PROMPT includes auto-detected modes:
- EMERGENCY MODE — triggered by SOS/help/emergency keywords
- DISASTER SIMULATION MODE — triggered by "what if", "simulate", "scenario"
- RESOURCE PLANNING MODE — triggered by "deploy", "allocate", "volunteers"
- NAVIGATION COMMANDS — `<raksh-command>` tags for app routing

## Frontend (artifacts/earth-guardian/src/components/raksh/)
- `RakshContext.tsx` — all state and API calls; `sendMessage` uses SSE, `sendMessageWithAttachment` uses JSON endpoints
- `RakshChatPanel.tsx` — full chat UI with:
  - Drag-and-drop file upload (images, docs, CSV, JSON)
  - Voice input (push-to-talk via SpeechRecognition)
  - Hands-free mode (auto-restarts mic after each Raksh response)
  - TTS per-message speak/stop
  - Export chat as Markdown
  - Generate Report button (calls /api/raksh/generate-report, auto-downloads)
  - Conversation search in sidebar
- `RakshMarkdown.tsx` — custom markdown renderer for Gemini responses
- `src/hooks/useVoiceOutput.ts` — SpeechSynthesis hook, strips markdown before speaking

## Why
- `getGeminiClient()` returning null means the key isn't in the process env (restart needed), not that the key is wrong.
- "Setup Required" was removed — now returns 503 with explicit error message instead.
- Hands-free useEffect must return `undefined` explicitly on the else path (TS7030 error otherwise).
- `processFile` extracted from `handleFileSelect` so drag-drop can reuse the same logic.

## Pre-existing TypeScript Errors
The `api-client-react` library dist is not built, causing TS6305 errors in dashboard/live-map files. These are pre-existing and unrelated to Raksh AI.
