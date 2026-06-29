import type { Content } from "@google/generative-ai";
import {
  isGeminiReady,
  getGeminiGenerativeModel,
  geminiKeyLoaded,
  getGeminiDiagnostics,
  GEMINI_MODEL,
} from "./gemini";
import { callOpenRouter, openrouterKeyLoaded, getOpenRouterDiagnostics } from "./openrouter";
import { callGroq, groqKeyLoaded, getGroqDiagnostics } from "./groq";

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
const COOLDOWN_MS = 30 * 60_000;        // 30 minutes for all failures (spec requirement)
const QUOTA_COOLDOWN_MS = 60 * 60_000;  // 60 minutes for quota exhaustion
const SERVER_START = Date.now();
const VERSION = "3.0.0";

// ── Error classification ───────────────────────────────────────────────────────
function isQuotaError(msg: string): boolean {
  return /free.tier|GenerateRequestsPerDay|quota.*day|daily.*limit|per_day|RESOURCE_EXHAUSTED/i.test(msg);
}

function isRateLimitError(msg: string): boolean {
  return /429|rate.?limit|too many requests/i.test(msg) && !isQuotaError(msg);
}

function isAuthError(msg: string): boolean {
  return /401|403|API_KEY_INVALID|invalid.?api.?key|unauthorized|forbidden/i.test(msg);
}

function isTransientError(msg: string): boolean {
  if (isAuthError(msg) || isQuotaError(msg)) return false;
  return /500|503|overloaded|timeout|UNAVAILABLE|network|aborted/i.test(msg) || isRateLimitError(msg);
}

// ── Provider health state ──────────────────────────────────────────────────────
type QuotaState = "ok" | "exhausted" | "rate_limited" | "auth_error" | "unavailable" | "unknown";

interface ProviderHealth {
  name: string;
  available: boolean;
  failedAt?: number;
  cooldownUntil?: number;
  lastError?: string;
  quotaState: QuotaState;
  requestCount: number;
  successCount: number;
  failureCount: number;
}

// ── AI Provider Manager ────────────────────────────────────────────────────────
class AIProviderManager {
  private readonly initializedAt = new Date().toISOString();
  private lastHealthCheck = new Date().toISOString();
  private currentProvider: "gemini" | "openrouter" | "groq" | "none" = "none";
  private lastSwitch: { from: string; to: string; reason: string; at: string } | null = null;
  private lastFailure: { provider: string; error: string; at: string } | null = null;

  private readonly health: Record<string, ProviderHealth> = {
    gemini:     { name: "Gemini",     available: true, quotaState: "unknown", requestCount: 0, successCount: 0, failureCount: 0 },
    openrouter: { name: "OpenRouter", available: true, quotaState: "unknown", requestCount: 0, successCount: 0, failureCount: 0 },
    groq:       { name: "Groq",       available: true, quotaState: "unknown", requestCount: 0, successCount: 0, failureCount: 0 },
  };

  // ── Cooldown management ────────────────────────────────────────────────────
  private isAvailable(name: string): boolean {
    const h = this.health[name];
    if (!h) return false;
    if (h.available) return true;
    if (h.cooldownUntil && Date.now() >= h.cooldownUntil) {
      // Cooldown expired — restore availability
      h.available = true;
      h.cooldownUntil = undefined;
      h.failedAt = undefined;
      console.log(`[ProviderManager] ${h.name} cooldown expired — restored to available`);
      return true;
    }
    return false;
  }

  private markFailed(name: string, quotaState: QuotaState, error: string, cooldownMs: number): void {
    const h = this.health[name];
    if (!h) return;
    h.available = false;
    h.failedAt = Date.now();
    h.cooldownUntil = Date.now() + cooldownMs;
    h.quotaState = quotaState;
    h.lastError = error.slice(0, 200);
    h.failureCount++;
    this.lastFailure = { provider: name, error: error.slice(0, 200), at: new Date().toISOString() };
    const cooldownMin = Math.round(cooldownMs / 60_000);
    console.warn(`[ProviderManager] ${h.name} marked unavailable (${quotaState}) — cooldown ${cooldownMin}min`);
  }

  private markSuccess(name: string): void {
    const h = this.health[name];
    if (!h) return;
    h.quotaState = "ok";
    h.lastError = undefined;
    h.successCount++;
  }

  private switchTo(to: string, from: string, reason: string): void {
    if (this.currentProvider !== to) {
      this.lastSwitch = { from, to, reason, at: new Date().toISOString() };
      this.currentProvider = to as typeof this.currentProvider;
      console.log(`[ProviderManager] Switched ${from} → ${to} (${reason})`);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  isGeminiReady(): boolean {
    return isGeminiReady();
  }

  getGeminiModel(systemInstruction: string, temperature = 0.7, maxOutputTokens = 8192) {
    return getGeminiGenerativeModel(systemInstruction, temperature, maxOutputTokens);
  }

  /** One-shot generation — Gemini only, no fallback. Used for image prompts, reports, etc. */
  async generate(
    systemInstruction: string,
    prompt: string,
    temperature = 0.7,
    maxOutputTokens = 8192,
  ): Promise<string> {
    if (!isGeminiReady()) {
      const diag = getGeminiDiagnostics();
      throw new Error(
        !diag.envKeyPresent
          ? "Configuration Error: GEMINI_API_KEY not found in Replit Secrets."
          : "Gemini client failed to initialize.",
      );
    }
    try {
      const model = getGeminiGenerativeModel(systemInstruction, temperature, maxOutputTokens);
      const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
      this.markSuccess("gemini");
      return result.response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isAuthError(msg))  throw new Error("Configuration Error: GEMINI_API_KEY is invalid or unauthorized.");
      if (isQuotaError(msg)) { this.markFailed("gemini", "exhausted", msg, QUOTA_COOLDOWN_MS); throw new Error("Gemini daily quota reached. Please try again later."); }
      throw err;
    }
  }

  /** Multimodal image analysis — Gemini only. */
  async analyzeImage(systemInstruction: string, imageData: string, mimeType: string, prompt: string): Promise<string> {
    if (!isGeminiReady()) throw new Error("Configuration Error: GEMINI_API_KEY not found in Replit Secrets.");
    try {
      const model = getGeminiGenerativeModel(systemInstruction, 0.4, 4096);
      const result = await withTimeout(
        model.generateContent([prompt, { inlineData: { data: imageData, mimeType } }]),
        TIMEOUT_MS,
      );
      this.markSuccess("gemini");
      return result.response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isAuthError(msg))  throw new Error("Configuration Error: GEMINI_API_KEY is invalid or unauthorized.");
      if (isQuotaError(msg)) { this.markFailed("gemini", "exhausted", msg, QUOTA_COOLDOWN_MS); throw new Error("Gemini daily quota reached."); }
      throw err;
    }
  }

  /**
   * Streaming chat — Gemini → OpenRouter → Groq with automatic failover.
   * Switches providers on quota/rate-limit/failure. Never hangs beyond 30s.
   */
  async streamChat(
    systemInstruction: string,
    history: Content[],
    userMessage: string,
    onChunk: (text: string) => void,
  ): Promise<{ provider: string }> {
    this.lastHealthCheck = new Date().toISOString();
    const geminiOk     = isGeminiReady()      && this.isAvailable("gemini");
    const openrouterOk = openrouterKeyLoaded() && this.isAvailable("openrouter");
    const groqOk       = groqKeyLoaded()       && this.isAvailable("groq");

    console.log(
      `[ProviderManager] streamChat — gemini=${geminiOk} openrouter=${openrouterOk} groq=${groqOk}`,
    );

    // ── Gemini ──────────────────────────────────────────────────────────────
    if (geminiOk) {
      const h = this.health["gemini"]!;
      h.requestCount++;
      let attempt = 0;
      while (attempt <= MAX_RETRIES) {
        try {
          console.log(`[ProviderManager] Gemini attempt ${attempt + 1}`);
          const model = getGeminiGenerativeModel(systemInstruction);
          const chat = model.startChat({ history });
          const streamResult = await withTimeout(chat.sendMessageStream(userMessage), TIMEOUT_MS);

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

          console.log(`[ProviderManager] Gemini OK — ${chunkCount} chunks`);
          this.markSuccess("gemini");
          this.switchTo("gemini", this.currentProvider, "primary provider");
          return { provider: "gemini" };

        } catch (err: unknown) {
          attempt++;
          const msg = err instanceof Error ? err.message : "Gemini error";
          console.error(`[ProviderManager] Gemini attempt ${attempt} failed:`, msg.slice(0, 200));

          if (isAuthError(msg)) {
            this.markFailed("gemini", "auth_error", msg, COOLDOWN_MS);
            throw new Error("Configuration Error: GEMINI_API_KEY is invalid or unauthorized.");
          }
          if (isQuotaError(msg)) {
            this.markFailed("gemini", "exhausted", msg, QUOTA_COOLDOWN_MS);
            console.warn("[ProviderManager] Gemini quota exhausted — falling back to OpenRouter");
            break;
          }
          if (isRateLimitError(msg)) {
            this.markFailed("gemini", "rate_limited", msg, COOLDOWN_MS);
            console.warn("[ProviderManager] Gemini rate-limited — falling back");
            break;
          }
          if (isTransientError(msg) && attempt <= MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 800 * attempt));
            continue;
          }
          if (isTransientError(msg)) this.markFailed("gemini", "unavailable", msg, COOLDOWN_MS);
          break;
        }
      }
    } else {
      const h = this.health["gemini"];
      const reason = !isGeminiReady()
        ? "key not set"
        : h?.cooldownUntil
          ? `in cooldown until ${new Date(h.cooldownUntil).toISOString()} (${h.quotaState})`
          : "unavailable";
      console.warn(`[ProviderManager] Gemini skipped — ${reason}`);
    }

    // ── Fallback banner ──────────────────────────────────────────────────────
    const hasFallback = openrouterOk || groqOk;
    if (hasFallback) {
      onChunk("⚡ Switching to backup AI provider…\n\n");
    }

    // ── OpenRouter ───────────────────────────────────────────────────────────
    if (openrouterOk) {
      const h = this.health["openrouter"]!;
      h.requestCount++;
      console.log("[ProviderManager] Trying OpenRouter");
      try {
        const text = await callOpenRouter(systemInstruction, userMessage, TIMEOUT_MS);
        if (text) {
          this.markSuccess("openrouter");
          this.switchTo("openrouter", this.currentProvider, "Gemini unavailable");
          console.log("[ProviderManager] OpenRouter OK");
          onChunk(text);
          return { provider: "openrouter" };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        console.error("[ProviderManager] OpenRouter error:", msg.slice(0, 200));
        const state: QuotaState = isQuotaError(msg) ? "exhausted" : isRateLimitError(msg) ? "rate_limited" : isAuthError(msg) ? "auth_error" : "unavailable";
        this.markFailed("openrouter", state, msg, isQuotaError(msg) ? QUOTA_COOLDOWN_MS : COOLDOWN_MS);
      }
    }

    // ── Groq ─────────────────────────────────────────────────────────────────
    if (groqOk) {
      const h = this.health["groq"]!;
      h.requestCount++;
      console.log("[ProviderManager] Trying Groq");
      try {
        const text = await callGroq(systemInstruction, userMessage, TIMEOUT_MS);
        if (text) {
          this.markSuccess("groq");
          this.switchTo("groq", this.currentProvider, "Gemini+OpenRouter unavailable");
          console.log("[ProviderManager] Groq OK");
          onChunk(text);
          return { provider: "groq" };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        console.error("[ProviderManager] Groq error:", msg.slice(0, 200));
        const state: QuotaState = isQuotaError(msg) ? "exhausted" : isRateLimitError(msg) ? "rate_limited" : isAuthError(msg) ? "auth_error" : "unavailable";
        this.markFailed("groq", state, msg, isQuotaError(msg) ? QUOTA_COOLDOWN_MS : COOLDOWN_MS);
      }
    }

    // ── All failed ────────────────────────────────────────────────────────────
    const gemDiag = getGeminiDiagnostics();
    const orDiag  = getOpenRouterDiagnostics();
    const grDiag  = getGroqDiagnostics();
    console.error(
      "[ProviderManager] All providers failed —",
      `gemini.key=${gemDiag.envKeyPresent}(len=${gemDiag.envKeyLength})`,
      `gemini.state=${this.health["gemini"]?.quotaState}`,
      `openrouter.key=${orDiag.envKeyPresent}(len=${orDiag.envKeyLength})`,
      `openrouter.state=${this.health["openrouter"]?.quotaState}`,
      `groq.key=${grDiag.envKeyPresent}(len=${grDiag.envKeyLength})`,
      `groq.state=${this.health["groq"]?.quotaState}`,
    );

    const noKeys = !geminiKeyLoaded() && !openrouterKeyLoaded() && !groqKeyLoaded();
    if (noKeys) throw new Error("Configuration Error: No AI provider keys found. Add GEMINI_API_KEY to Replit Secrets.");

    const gemState = this.health["gemini"]?.quotaState;
    if (gemState === "exhausted" && !openrouterOk && !groqOk) {
      throw new Error("All AI providers have reached their daily quota. Please try again later or add fallback provider keys.");
    }
    throw new Error("All AI providers are temporarily unavailable. Please try again in a moment.");
  }

  /** Status response for /api/raksh/status */
  getStatus() {
    const uptimeSeconds = Math.floor((Date.now() - SERVER_START) / 1000);
    const gemDiag = getGeminiDiagnostics();
    const orDiag  = getOpenRouterDiagnostics();
    const grDiag  = getGroqDiagnostics();

    const availableProviders: string[] = [];
    if (isGeminiReady()      && this.isAvailable("gemini"))     availableProviders.push("gemini");
    if (openrouterKeyLoaded() && this.isAvailable("openrouter")) availableProviders.push("openrouter");
    if (groqKeyLoaded()       && this.isAvailable("groq"))       availableProviders.push("groq");

    // Determine active current provider
    const activeProvider = availableProviders[0] ?? "none";
    if (this.currentProvider === "none" && activeProvider !== "none") {
      this.currentProvider = activeProvider as typeof this.currentProvider;
    }

    const gemH = this.health["gemini"]!;
    const gemKeyDiag = !gemDiag.envKeyPresent
      ? "GEMINI_API_KEY missing from process.env — add to Replit Secrets and restart."
      : undefined;

    return {
      version: VERSION,
      uptime: uptimeSeconds,
      currentProvider: this.currentProvider,
      availableProviders,
      lastSwitch: this.lastSwitch,
      lastFailure: this.lastFailure,
      lastHealthCheck: this.lastHealthCheck,
      lastInitialization: this.initializedAt,
      providerHealth: {
        gemini: {
          keyLoaded:      geminiKeyLoaded(),
          envKeyPresent:  gemDiag.envKeyPresent,
          envKeyLength:   gemDiag.envKeyLength,
          clientCached:   gemDiag.clientCached,
          available:      isGeminiReady() && this.isAvailable("gemini"),
          quotaState:     gemH.quotaState,
          cooldownUntil:  gemH.cooldownUntil ? new Date(gemH.cooldownUntil).toISOString() : null,
          requestCount:   gemH.requestCount,
          successCount:   gemH.successCount,
          failureCount:   gemH.failureCount,
          lastError:      gemH.lastError ?? null,
          ...(gemKeyDiag ? { diagnostic: gemKeyDiag } : {}),
        },
        openrouter: {
          keyLoaded:      openrouterKeyLoaded(),
          envKeyPresent:  orDiag.envKeyPresent,
          envKeyLength:   orDiag.envKeyLength,
          available:      openrouterKeyLoaded() && this.isAvailable("openrouter"),
          quotaState:     this.health["openrouter"]!.quotaState,
          cooldownUntil:  this.health["openrouter"]?.cooldownUntil ? new Date(this.health["openrouter"].cooldownUntil!).toISOString() : null,
          requestCount:   this.health["openrouter"]!.requestCount,
          successCount:   this.health["openrouter"]!.successCount,
          failureCount:   this.health["openrouter"]!.failureCount,
          lastError:      this.health["openrouter"]!.lastError ?? null,
        },
        groq: {
          keyLoaded:      groqKeyLoaded(),
          envKeyPresent:  grDiag.envKeyPresent,
          envKeyLength:   grDiag.envKeyLength,
          available:      groqKeyLoaded() && this.isAvailable("groq"),
          quotaState:     this.health["groq"]!.quotaState,
          cooldownUntil:  this.health["groq"]?.cooldownUntil ? new Date(this.health["groq"].cooldownUntil!).toISOString() : null,
          requestCount:   this.health["groq"]!.requestCount,
          successCount:   this.health["groq"]!.successCount,
          failureCount:   this.health["groq"]!.failureCount,
          lastError:      this.health["groq"]!.lastError ?? null,
        },
      },
      // Legacy fields for backward compatibility
      provider: "gemini",
      model: GEMINI_MODEL,
      healthy: availableProviders.length > 0,
      initialized: isGeminiReady(),
      keyLoaded: geminiKeyLoaded(),
      quotaStatus: gemH.quotaState,
    };
  }

  /** Full diagnostic dump for /api/raksh/diagnose */
  getDiagnostics() {
    return {
      ...this.getStatus(),
      environment: {
        nodeVersion: process.version,
        nodeEnv: process.env["NODE_ENV"] ?? "unknown",
        platform: process.platform,
      },
      geminiDiagnostics:     getGeminiDiagnostics(),
      openrouterDiagnostics: getOpenRouterDiagnostics(),
      groqDiagnostics:       getGroqDiagnostics(),
    };
  }
}

// ── Singleton — one manager for the entire server lifetime ────────────────────
const _instance = new AIProviderManager();
export function getAIProvider(): AIProviderManager { return _instance; }

/** Called once from index.ts at startup. */
export function logStartupStatus(): void {
  const gemDiag = getGeminiDiagnostics();
  const orDiag  = getOpenRouterDiagnostics();
  const grDiag  = getGroqDiagnostics();

  console.log("✓ Environment loaded");
  console.log(`  node: ${process.version} | env: ${process.env["NODE_ENV"] ?? "unknown"} | platform: ${process.platform}`);

  if (gemDiag.envKeyPresent) {
    console.log("✓ Gemini Ready");
    console.log(`  key present: true | key length: ${gemDiag.envKeyLength} | model: ${GEMINI_MODEL}`);
  } else {
    console.warn("✗ Gemini NOT ready — GEMINI_API_KEY missing from Replit Secrets");
  }

  if (orDiag.envKeyPresent) {
    console.log("✓ OpenRouter Ready");
    console.log(`  key present: true | key length: ${orDiag.envKeyLength}`);
  } else {
    console.log("  OpenRouter: no key (optional fallback — add OPENROUTER_API_KEY to enable)");
  }

  if (grDiag.envKeyPresent) {
    console.log("✓ Groq Ready");
    console.log(`  key present: true | key length: ${grDiag.envKeyLength}`);
  } else {
    console.log("  Groq: no key (optional fallback — add GROQ_API_KEY to enable)");
  }

  const ready = [
    gemDiag.envKeyPresent && "Gemini",
    orDiag.envKeyPresent  && "OpenRouter",
    grDiag.envKeyPresent  && "Groq",
  ].filter(Boolean);

  console.log(`✓ Provider Manager Ready — ${ready.length}/3 providers available: [${ready.join(", ")}]`);
  console.log("✓ Raksh AI Ready");
}
