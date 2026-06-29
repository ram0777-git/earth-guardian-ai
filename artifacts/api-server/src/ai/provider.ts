import type { Content } from "@google/generative-ai";
import {
  isGeminiReady,
  getGeminiGenerativeModel,
  geminiKeyLoaded,
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

// ── Error classification ───────────────────────────────────────────────────────
function isQuotaError(msg: string): boolean {
  return /free.tier|GenerateRequestsPerDay|quota.*day|daily.*limit|per_day/i.test(msg);
}

function isTransientError(msg: string): boolean {
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
    if (!isGeminiReady()) throw new Error("Gemini API key not configured");
    const model = getGeminiGenerativeModel(systemInstruction, temperature, maxOutputTokens);
    const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
    return result.response.text();
  }

  /** Multimodal image analysis — Gemini only. Throws if not ready. */
  async analyzeImage(
    systemInstruction: string,
    imageData: string,
    mimeType: string,
    prompt: string,
  ): Promise<string> {
    if (!isGeminiReady()) throw new Error("Gemini API key not configured");
    const model = getGeminiGenerativeModel(systemInstruction, 0.4, 4096);
    const result = await withTimeout(
      model.generateContent([prompt, { inlineData: { data: imageData, mimeType } }]),
      TIMEOUT_MS,
    );
    return result.response.text();
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

    // ── Gemini ───────────────────────────────────────────────────────────────
    if (isGeminiReady() && this.isCooledDown("gemini")) {
      let attempt = 0;
      while (attempt <= MAX_RETRIES) {
        try {
          console.log(`[AIProvider] Gemini attempt ${attempt + 1}`);
          const model = getGeminiGenerativeModel(systemInstruction);
          const chat = model.startChat({ history });
          const streamResult = await withTimeout(
            chat.sendMessageStream(userMessage),
            TIMEOUT_MS,
          );
          let chunkCount = 0;
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) { onChunk(text); chunkCount++; }
          }
          console.log(`[AIProvider] Gemini OK — ${chunkCount} chunks`);
          if (this.state["gemini"]) this.state["gemini"].quotaStatus = "ok";
          return { provider: "gemini" };
        } catch (err: unknown) {
          attempt++;
          const msg = err instanceof Error ? err.message : "Gemini error";
          console.error(`[AIProvider] Gemini attempt ${attempt} failed:`, msg.slice(0, 200));

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
      console.warn("[AIProvider] Gemini skipped —",
        !isGeminiReady() ? "key not set" : "in cooldown");
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
          console.log("[AIProvider] OpenRouter OK");
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
          console.log("[AIProvider] Groq OK");
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
    console.error("[AIProvider] All providers failed — gemini:", geminiKeyLoaded,
      "openrouter:", openrouterKeyLoaded, "groq:", groqKeyLoaded);
    const noKeys = !geminiKeyLoaded && !openrouterKeyLoaded && !groqKeyLoaded;
    throw new Error(
      noKeys
        ? "No AI provider API keys are configured. Please set GEMINI_API_KEY in project secrets."
        : this.state["gemini"]?.quotaStatus === "exhausted"
          ? "Gemini daily quota reached. Please try again later."
          : "Primary AI temporarily unavailable. Please try again in a moment.",
    );
  }

  /** Returns structured status object for /raksh/status endpoint. */
  getStatus() {
    return {
      provider: "gemini",
      model: GEMINI_MODEL,
      healthy: isGeminiReady() && this.isCooledDown("gemini"),
      initialized: isGeminiReady(),
      keyLoaded: geminiKeyLoaded,
      lastHealthCheck: this.lastHealthCheck,
      lastInitialization: this.initializedAt,
      quotaStatus: this.state["gemini"]?.quotaStatus ?? "unknown",
      providers: {
        gemini: {
          keyLoaded: geminiKeyLoaded,
          available: isGeminiReady() && this.isCooledDown("gemini"),
          quotaStatus: this.state["gemini"]?.quotaStatus ?? "unknown",
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
}

// ── Module-level singleton — created once when the module is first imported ───
const _instance = new AIProviderManager();

export function getAIProvider(): AIProviderManager {
  return _instance;
}

/** Call once from index.ts on server startup. */
export function logStartupStatus(): void {
  console.log("✓ Environment loaded");
  if (geminiKeyLoaded) {
    console.log("✓ Gemini key detected");
    console.log("✓ Gemini initialized");
    console.log(`✓ Model ready — ${GEMINI_MODEL}`);
  } else {
    console.warn("✗ GEMINI_API_KEY not set — Gemini unavailable");
  }
  if (openrouterKeyLoaded) console.log("✓ OpenRouter key detected");
  if (groqKeyLoaded)       console.log("✓ Groq key detected");
  console.log("✓ AI Provider Manager ready");
  console.log("✓ Raksh AI ready");
}
