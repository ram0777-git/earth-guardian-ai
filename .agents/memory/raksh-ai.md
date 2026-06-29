---
name: Raksh AI architecture
description: Multimodal disaster intelligence chat built on Gemini — key decisions, endpoints, and environment quirks.
---

## Key Env Var
`GEMINI_API_KEY` — must be in Replit Secrets. Server process must restart to pick up a newly-added secret.

## Singleton Provider Architecture (CRITICAL — do not revert)
`artifacts/api-server/src/ai/` has 4 modules. All routes MUST use `getAIProvider()`. Never instantiate `GoogleGenerativeAI` inside a request handler.

- `gemini.ts` — reads `GEMINI_API_KEY` and creates `GoogleGenerativeAI` **once at module load**. Exports `isGeminiReady()`, `getGeminiGenerativeModel()`, `GEMINI_MODEL`, `geminiKeyLoaded`.
- `openrouter.ts` — reads `OPENROUTER_API_KEY` once. Exports `callOpenRouter()`, `openrouterKeyLoaded`.
- `groq.ts` — reads `GROQ_API_KEY` once. Exports `callGroq()`, `groqKeyLoaded`.
- `provider.ts` — single entry point for all routes. Exports `getAIProvider()` singleton + `withTimeout<T>()`. `logStartupStatus()` called from `index.ts` on boot.

**Why:** Per-request `new GoogleGenerativeAI(apiKey)` caused intermittent null on startup timing edge → fell through to "all providers unavailable". Module-level singleton is deterministic.

`AIProviderManager` methods:
- `isGeminiReady()` — boolean
- `getGeminiModel(systemInstruction, temp, maxTokens)` — returns `GenerativeModel`
- `generate(systemInstruction, prompt, temp, maxTokens)` — one-shot Gemini, 30s timeout
- `analyzeImage(systemInstruction, imageData, mimeType, prompt)` — Gemini vision
- `streamChat(systemInstruction, history, userMessage, onChunk)` — streaming, Gemini→OpenRouter→Groq fallback
- `getStatus()` — returns `{ provider, model, healthy, initialized, keyLoaded, lastHealthCheck, lastInitialization, quotaStatus, providers }`

Fallback triggers: quota error (1hr cooldown), transient 5xx/timeout (5min cooldown), 429 non-quota (5min). Max 1 retry. Validation errors do NOT trigger fallback.

## Backend Endpoints (artifacts/api-server/src/routes/raksh.ts)
- `GET  /api/raksh/status` — returns full provider status object
- `POST /api/raksh/chat` — SSE streaming chat (main endpoint)
- `GET  /api/raksh/brief` — generates daily disaster brief (non-streaming JSON)
- `POST /api/raksh/analyze-image` — Gemini Vision; body: `{ imageData: string (base64), mimeType, userPrompt? }`
- `POST /api/raksh/analyze-document` — document analysis; body: `{ content: string, fileName, userPrompt? }`
- `GET  /api/raksh/intelligence/status` — live data source health check
- `POST /api/raksh/generate-image` — AI image gen via Pollinations.ai flux; body: `{ prompt, seed?, width?, height? }`; returns `{ imageData: base64, mimeType, prompt, enhancedPrompt, provider, seed, width, height }`
- `POST /api/raksh/generate-report` — comprehensive intel report; body: `{ location?, focusArea?, userContext? }`; returns `{ content: string (markdown), generatedAt, meta }`

## Image Generation Architecture
- Provider: Pollinations.ai with flux model (free, no API key, CORS-enabled)
- Prompt enhancement: Gemini text model enhances the prompt first (temp=0.6, maxTokens=500), then image is fetched
- Auto-orientation: "poster"/"infographic" → 832×1152 portrait; "banner"/"wide" → 1216×512 landscape; default 1024×1024
- Image returned as base64 (avoids all CORS issues); frontend renders as data URI

## Image Intent Detection (RakshContext.tsx)
IMAGE_GEN_PATTERNS array detects prompts like "generate poster", "create infographic", "draw illustration", "visualize", etc.
When detected, `sendMessage` routes to `generateImage` instead of the chat endpoint.

## System Prompt Modes (BASE_SYSTEM_PROMPT)
- EMERGENCY MODE — triggered by SOS/help/emergency keywords
- DISASTER SIMULATION MODE — triggered by "what if", "simulate", "scenario"
- RESOURCE PLANNING MODE — triggered by "deploy", "allocate", "volunteers"
- NAVIGATION COMMANDS — `<raksh-command>` tags for app routing

## Frontend (artifacts/earth-guardian/src/components/raksh/)
- `RakshContext.tsx` — all state and API calls; SSE error handling: JSON parse errors and server errors must be in separate try/catch blocks
- `RakshChatPanel.tsx` — full chat UI with GeneratedImageBubble, fullscreen modal, 8 image templates, drag-drop, voice, TTS, report gen
- `RakshMarkdown.tsx` — custom markdown renderer
- `src/hooks/useVoiceOutput.ts` — SpeechSynthesis hook

## Key Implementation Notes
- `@google/generative-ai` v0.24.1 installed (no native Imagen support, hence Pollinations)
- Hands-free useEffect must return `undefined` explicitly on else path (TS7030)
- `processFile` extracted from `handleFileSelect` so drag-drop reuses same logic

## Pre-existing TypeScript Errors
`api-client-react` dist not built → TS6305 errors in dashboard/live-map files. Pre-existing, unrelated to Raksh AI.
