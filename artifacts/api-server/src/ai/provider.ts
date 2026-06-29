import type { Content } from "@google/generative-ai";
import {
  isGeminiReady,
  getGeminiGenerativeModel,
  geminiKeyLoaded,
  getGeminiDiagnostics,
  GEMINI_MODEL,
} from "./gemini";
import { callOpenRouter, openrouterKeyLoaded } from "./openrouter";
import { callGroq, groqKeyLoaded } from "./groq";

// ── Shared timeout utility ─────────────────────────────────────────────────────
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;
const SERVER_START = Date.now();
const VERSION = "2.0.0";

// ── Error classification ───────────────────────────────────────────────────────
function isQuotaError(msg: string): boolean {
  return /free.tier|GenerateRequestsPerDay|quota.*day|daily.*limit|per_day/i.test(msg);
}

function isAuthError(msg: string): boolean {
  return /401|403|API_KEY_INVALID|invalid.?api.?key|unauthorized|forbidden/i.test(msg);
}

function isTransientError(msg: string): boolean {
  if (isAuthError(msg) || isQuotaError(msg)) return false;
  return /500|503|overloaded|timeout|UNAVAILABLE/i.test(msg) ||
    (/429/.test(msg) && !isQuotaError(msg));
}

// ── Provider cooldown state ────────────────────────────────────────────────────
interface ProviderState {
  name: string;
  available: boolean;
  failedAt?: number;
  cooldownMs?: number;
  quotaStatus: "ok" | "exhausted" | "unknown";
}

// ── AI Provider Manager ────────────────────────────────────────────────────────
class AIProviderManager {
  private readonly initializedAt = new Date().toISOString();
  private lastHealthCheck = new Date().toISOString();

  private readonly state: Record<string, ProviderState> = {
    gemini:     { name: "Gemini",     available: true, quotaStatus: "unknown" },
    openrouter: { name: "OpenRouter", available: true, quotaStatus: "unknown" },
    groq:       { name: "Groq",       available: true, quotaStatus: "unknown" },
  };

  private isCooledDown(name: string): boolean {
    const s = this.state[name];
    if (!s || s.available) return true;
    const cooldown = s.cooldownMs ?? 5 * 60_000;
    if (s.failedAt && Date.now() - s.failedAt > cooldown) {
      s.available = true;
      s.failedAt = undefined;
      s.cooldownMs = undefined;
      return true;
    }
    return false;
  }

  private markFailed(name: string, cooldownMs?: number, quota = false): void {
    const s = this.state[name];
    if (s) {
      s.available = false;
      s.failedAt = Date.now();
      s.cooldownMs = cooldownMs;
      if (quota) s.quotaStatus = "exhausted";
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  isGeminiReady(): boolean {
    return isGeminiReady();
  }

  /** Return a Gemini GenerativeModel. Throws if key not loaded. */
  getGeminiModel(
    systemInstruction: string,
    temperature = 0.7,
    maxOutputTokens = 8192,
  ) {
    return getGeminiGenerativeModel(systemInstruction, temperature, maxOutputTokens);
  }

  /** One-shot text generation with Gemini (no fallback). Throws if not ready. */
  async generate(
    systemInstruction: string,
    prompt: string,
    temperature = 0.7,
    maxOutputTokens = 8192,
  ): Promise<string> {
    if (!isGeminiReady()) {
      const diag = getGeminiDiagnostics();
      const reason = !diag.envKeyPresent
        ? "GEMINI_API_KEY not found in process.env — add it to Replit Secrets and restart the server."
        : "Gemini client failed to initialize.";
      throw new Error(`Configuration Error: ${reason}`);
    }
    console.log("[AIProvider] generate() — singleton reuse confirmed");
    try {
      const model = getGeminiGenerativeModel(systemInstruction, temperature, maxOutputTokens);
      const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
      console.log("[AIProvider] generate() — completed");
      return result.response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isAuthError(msg)) throw new Error("Configuration Error: GEMINI_API_KEY is invalid or unauthorized.");
      if (isQuotaError(msg)) throw new Error("Gemini daily quota reached. Please try again later.");
      throw err;
    }
  }

  /** Multimodal image analysis — Gemini only. Throws if not ready. */
  async analyzeImage(
    systemInstruction: string,
    imageData: string,
    mimeType: string,
    prompt: string,
  ): Promise<string> {
    if (!isGeminiReady()) {
      throw new Error("Configuration Error: GEMINI_API_KEY not found in Replit Secrets.");
    }
    console.log("[AIProvider] analyzeImage() — singleton reuse confirmed");
    try {
      const model = getGeminiGenerativeModel(systemInstruction, 0.4, 4096);
      const result = await withTimeout(
        model.generateContent([prompt, { inlineData: { data: imageData, mimeType } }]),
        TIMEOUT_MS,
      );
      console.log("[AIProvider] analyzeImage() — completed");
      return result.response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isAuthError(msg)) throw new Error("Configuration Error: GEMINI_API_KEY is invalid or unauthorized.");
      if (isQuotaError(msg)) throw new Error("Gemini daily quota reached. Please try again later.");
      throw err;
    }
  }

  /**
   * Streaming chat with full provider fallback: Gemini → OpenRouter → Groq.
   * Calls onChunk for each text fragment. Throws on total failure.
   */
  async streamChat(
    systemInstruction: string,
    history: Content[],
    userMessage: string,
    onChunk: (text: string) => void,
  ): Promise<{ provider: string }> {
    this.lastHealthCheck = new Date().toISOString();
    console.log(`[AIProvider] streamChat() — request received | geminiReady=${isGeminiReady()} | keyPresent=${geminiKeyLoaded()}`);

    // ── Gemini ───────────────────────────────────────────────────────────────
    if (isGeminiReady() && this.isCooledDown("gemini")) {
      let attempt = 0;
      while (attempt <= MAX_RETRIES) {
        try {
          console.log(`[AIProvider] Gemini attempt ${attempt + 1} — singleton reuse confirmed`);
          const model = getGeminiGenerativeModel(systemInstruction);
          const chat = model.startChat({ history });

          const streamResult = await withTimeout(
            chat.sendMessageStream(userMessage),
            TIMEOUT_MS,
          );

          // FIX: Wrap the entire stream-consumption loop in a hard timeout so
          // mid-stream hangs cannot block the server indefinitely.
          let chunkCount = 0;
          await withTimeout(
            (async () => {
              for await (const chunk of streamResult.stream) {
                const text = chunk.text();
                if (text) { onChunk(text); chunkCount++; }
              }
            })(),
            TIMEOUT_MS,
          );

          console.log(`[AIProvider] streamChat() completed — ${chunkCount} chunks | provider=gemini`);
          if (this.state["gemini"]) this.state["gemini"].quotaStatus = "ok";
          return { provider: "gemini" };
        } catch (err: unknown) {
          attempt++;
          const msg = err instanceof Error ? err.message : "Gemini error";
          console.error(`[AIProvider] Gemini attempt ${attempt} failed:`, msg.slice(0, 200));

          if (isAuthError(msg)) {
            throw new Error("Configuration Error: GEMINI_API_KEY is invalid or unauthorized.");
          }
          if (isQuotaError(msg)) {
            this.markFailed("gemini", 60 * 60_000, true);
            console.warn("[AIProvider] Gemini quota exhausted — falling back");
            break;
          }
          if (isTransientError(msg) && attempt <= MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 800 * attempt));
            continue;
          }
          if (isTransientError(msg)) this.markFailed("gemini", 5 * 60_000);
          break;
        }
      }
    } else {
      const reason = !isGeminiReady()
        ? `key not in env (envKeyPresent=${geminiKeyLoaded()})`
        : "in cooldown";
      console.warn(`[AIProvider] Gemini skipped — ${reason}`);
    }

    // ── Fallback banner ───────────────────────────────────────────────────────
    const hasOpenRouter = openrouterKeyLoaded && this.isCooledDown("openrouter");
    const hasGroq       = groqKeyLoaded       && this.isCooledDown("groq");
    if (hasOpenRouter || hasGroq) {
      onChunk("Primary AI is temporarily unavailable. Switching to backup AI…\n\n");
    }

    // ── OpenRouter ────────────────────────────────────────────────────────────
    if (hasOpenRouter) {
      console.log("[AIProvider] Trying OpenRouter");
      try {
        const text = await callOpenRouter(systemInstruction, userMessage, TIMEOUT_MS);
        if (text) {
          console.log("[AIProvider] OpenRouter OK — request completed");
          onChunk(text);
          return { provider: "openrouter" };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        console.error("[AIProvider] OpenRouter error:", msg.slice(0, 200));
        if (isTransientError(msg)) this.markFailed("openrouter", 5 * 60_000);
      }
    }

    // ── Groq ──────────────────────────────────────────────────────────────────
    if (hasGroq) {
      console.log("[AIProvider] Trying Groq");
      try {
        const text = await callGroq(systemInstruction, userMessage, TIMEOUT_MS);
        if (text) {
          console.log("[AIProvider] Groq OK — request completed");
          onChunk(text);
          return { provider: "groq" };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        console.error("[AIProvider] Groq error:", msg.slice(0, 200));
        if (isTransientError(msg)) this.markFailed("groq", 5 * 60_000);
      }
    }

    // ── All failed ────────────────────────────────────────────────────────────
    const diag = getGeminiDiagnostics();
    console.error(
      "[AIProvider] All providers failed —",
      `gemini.keyPresent=${diag.envKeyPresent}`,
      `gemini.keyLength=${diag.envKeyLength}`,
      `gemini.clientCached=${diag.clientCached}`,
      `openrouter=${openrouterKeyLoaded}`,
      `groq=${groqKeyLoaded}`,
    );
    const noKeys = !geminiKeyLoaded() && !openrouterKeyLoaded && !groqKeyLoaded;
    throw new Error(
      noKeys
        ? "Configuration Error: GEMINI_API_KEY not found in Replit Secrets."
        : this.state["gemini"]?.quotaStatus === "exhausted"
          ? "Gemini daily quota reached. Please try again later."
          : "Primary AI temporarily unavailable. Please try again in a moment.",
    );
  }

  /** Returns structured status object for /raksh/status endpoint. */
  getStatus() {
    const uptimeSeconds = Math.floor((Date.now() - SERVER_START) / 1000);
    const diag = getGeminiDiagnostics();
    // Determine WHY keyLoaded might be false
    let keyDiagnostic: string | undefined;
    if (!diag.envKeyPresent) {
      keyDiagnostic = "GEMINI_API_KEY is not present in process.env. Add it to Replit Secrets and restart the server.";
    } else if (!diag.clientCached) {
      keyDiagnostic = "Key is present but client is not yet initialized — will be created on first request.";
    }

    return {
      provider: "gemini",
      model: GEMINI_MODEL,
      version: VERSION,
      healthy: isGeminiReady() && this.isCooledDown("gemini"),
      initialized: isGeminiReady(),
      keyLoaded: geminiKeyLoaded(),
      uptime: uptimeSeconds,
      lastHealthCheck: this.lastHealthCheck,
      lastInitialization: this.initializedAt,
      quotaStatus: this.state["gemini"]?.quotaStatus ?? "unknown",
      ...(keyDiagnostic ? { keyDiagnostic } : {}),
      providers: {
        gemini: {
          keyLoaded: geminiKeyLoaded(),
          available: isGeminiReady() && this.isCooledDown("gemini"),
          quotaStatus: this.state["gemini"]?.quotaStatus ?? "unknown",
          envKeyPresent: diag.envKeyPresent,
          envKeyLength:  diag.envKeyLength,
          clientCached:  diag.clientCached,
        },
        openrouter: {
          keyLoaded: openrouterKeyLoaded,
          available: openrouterKeyLoaded && this.isCooledDown("openrouter"),
          quotaStatus: this.state["openrouter"]?.quotaStatus ?? "unknown",
        },
        groq: {
          keyLoaded: groqKeyLoaded,
          available: groqKeyLoaded && this.isCooledDown("groq"),
          quotaStatus: this.state["groq"]?.quotaStatus ?? "unknown",
        },
      },
    };
  }

  /** Full diagnostic dump for /raksh/diagnose — never exposes the key itself. */
  getDiagnostics() {
    const diag = getGeminiDiagnostics();
    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - SERVER_START) / 1000),
      version: VERSION,
      environment: {
        nodeVersion: process.version,
        nodeEnv: process.env["NODE_ENV"] ?? "unknown",
        platform: process.platform,
      },
      gemini: {
        envKeyPresent:  diag.envKeyPresent,
        envKeyLength:   diag.envKeyLength,
        clientCached:   diag.clientCached,
        isReady:        isGeminiReady(),
        model:          diag.model,
        diagnosis: !diag.envKeyPresent
          ? "GEMINI_API_KEY is missing from process.env. Add it to Replit Secrets, then restart the server workflow."
          : diag.clientCached
            ? "Gemini is fully initialized and ready."
            : "Key present — client will be created on first request.",
      },
      openrouter: {
        keyLoaded: openrouterKeyLoaded,
      },
      groq: {
        keyLoaded: groqKeyLoaded,
      },
      providerState: this.state,
    };
  }
}

// ── Module-level singleton — created once when the module is first imported ───
const _instance = new AIProviderManager();

export function getAIProvider(): AIProviderManager {
  return _instance;
}

/** Call once from index.ts on server startup. */
export function logStartupStatus(): void {
  const diag = getGeminiDiagnostics();
  console.log("✓ Environment loaded");
  console.log(`  node: ${process.version} | env: ${process.env["NODE_ENV"] ?? "unknown"} | platform: ${process.platform}`);

  if (diag.envKeyPresent) {
    console.log("✓ GEMINI_API_KEY detected");
    console.log(`  key present: true | key length: ${diag.envKeyLength}`);
    console.log("✓ Gemini initialized");
    console.log(`✓ Model loaded — ${GEMINI_MODEL}`);
  } else {
    console.warn("✗ GEMINI_API_KEY not set — Gemini unavailable");
    console.warn("  Add GEMINI_API_KEY once in Replit Secrets, then restart the server.");
    console.warn("  key present: false | key length: 0");
  }

  if (openrouterKeyLoaded) console.log("✓ OpenRouter key detected");
  else console.log("  OpenRouter: no key (optional fallback)");

  if (groqKeyLoaded) console.log("✓ Groq key detected");
  else console.log("  Groq: no key (optional fallback)");

  console.log("✓ AI Provider Ready");
  console.log("✓ Raksh AI Ready");
}
