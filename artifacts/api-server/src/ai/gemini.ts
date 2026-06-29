import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import type { GenerativeModel } from "@google/generative-ai";

// Read key and model name ONCE at module load — never per request
const API_KEY = process.env["GEMINI_API_KEY"];
const MODEL_NAME = process.env["GEMINI_MODEL"] ?? "gemini-2.5-flash-lite";

export const GEMINI_MODEL = MODEL_NAME;
export const geminiKeyLoaded = !!API_KEY;

// Singleton client — initialized once if key is present
const _client: GoogleGenerativeAI | null = API_KEY
  ? new GoogleGenerativeAI(API_KEY)
  : null;

export const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export function isGeminiReady(): boolean {
  return _client !== null;
}

export function getGeminiGenerativeModel(
  systemInstruction: string,
  temperature = 0.7,
  maxOutputTokens = 8192,
): GenerativeModel {
  if (!_client) throw new Error("Gemini not initialized — GEMINI_API_KEY not set");
  return _client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { temperature, maxOutputTokens },
  });
}
