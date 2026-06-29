import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import type { GenerativeModel } from "@google/generative-ai";

// Model name can be read once — it is not a secret and won't change at runtime.
const MODEL_NAME = process.env["GEMINI_MODEL"] ?? "gemini-2.5-flash-lite";
export const GEMINI_MODEL = MODEL_NAME;

// ── Lazy singleton ─────────────────────────────────────────────────────────────
// ROOT CAUSE FIX: The previous implementation read process.env["GEMINI_API_KEY"]
// once at module-load time and cached a null client permanently.
// If Replit injects the secret after module initialization, or the server was
// started before the secret was added, the client stayed null forever.
//
// The fix: read process.env["GEMINI_API_KEY"] on every call to resolveClient().
// Cache the client only after a key is found. A restart is still required for
// Replit Secrets to appear in process.env, but this ensures the very first
// request after restart correctly picks up the key.
let _cachedClient: GoogleGenerativeAI | null = null;
let _cachedKey: string | null = null;

function resolveClient(): GoogleGenerativeAI | null {
  const key = process.env["GEMINI_API_KEY"] ?? null;
  if (!key) return null;
  // Key matches what we cached — return existing client (singleton reuse)
  if (_cachedClient && _cachedKey === key) return _cachedClient;
  // Key is new or changed — create a fresh client and cache it
  _cachedClient = new GoogleGenerativeAI(key);
  _cachedKey = key;
  console.log(`[Gemini] Singleton created — key length: ${key.length}, model: ${MODEL_NAME}`);
  return _cachedClient;
}

export const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ── Dynamic key status ─────────────────────────────────────────────────────────
// These are FUNCTIONS, not constants — they read process.env every call so the
// status is always accurate, even if the secret was injected after module load.

export function isGeminiReady(): boolean {
  return resolveClient() !== null;
}

export function geminiKeyLoaded(): boolean {
  return !!(process.env["GEMINI_API_KEY"]);
}

export function getGeminiDiagnostics(): {
  envKeyPresent: boolean;
  envKeyLength: number;
  clientCached: boolean;
  model: string;
} {
  const key = process.env["GEMINI_API_KEY"] ?? null;
  return {
    envKeyPresent: !!key,
    envKeyLength:  key?.length ?? 0,
    clientCached:  _cachedClient !== null,
    model:         MODEL_NAME,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function getGeminiGenerativeModel(
  systemInstruction: string,
  temperature = 0.7,
  maxOutputTokens = 8192,
): GenerativeModel {
  const client = resolveClient();
  if (!client) {
    throw new Error(
      "Configuration Error: GEMINI_API_KEY not found in Replit Secrets.",
    );
  }
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { temperature, maxOutputTokens },
  });
  console.log(`[Gemini] Singleton reused — model: ${MODEL_NAME}`);
  return model;
}
