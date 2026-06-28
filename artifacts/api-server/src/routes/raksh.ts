import { Router } from "express";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import {
  disasters,
  alerts,
  weather,
  riskFactors,
  riskScore,
  predictions,
  timeline,
} from "../data/liveData";
import {
  fetchLiveIntelligenceForIntents,
  buildLiveIntelligenceContext,
  fetchLiveIntelligence,
} from "../services/liveIntelligence";

const router = Router();

// ── Config ─────────────────────────────────────────────────────────────────────
const DEFAULT_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

function getGeminiClient(): { genAI: GoogleGenerativeAI; model: string } | null {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) return null;
  return { genAI: new GoogleGenerativeAI(apiKey), model: process.env["GEMINI_MODEL"] ?? DEFAULT_MODEL };
}

// ── System prompt ─────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are Raksh AI, a premium real-time disaster intelligence and emergency response copilot embedded in Earth Guardian AI — a global disaster monitoring platform.

EXPERTISE: Earthquakes, floods, cyclones, wildfires, landslides, heatwaves, storms, tsunamis, volcanoes, drought, emergency preparedness, climate awareness, and first aid.

DATA HIERARCHY — Always follow this order:
1. 🔴 REAL-TIME EXTERNAL DATA (USGS · NASA EONET · NOAA) — use first for any live/recent/current question
2. 📡 LIVE PROJECT DATA (app's own disaster/alert/risk/weather data) — use alongside external data
3. 📚 GEMINI KNOWLEDGE — use ONLY for explanations, background, recommendations, historical context

CORE RULES:
- For ANY question about "today", "latest", "recent", "current", "live", "now", "right now", "breaking", "active", "ongoing", "this week" — ALWAYS use the real-time external data provided first.
- NEVER fabricate live events. If data shows no events, say: "No recent verified events found in the available live data."
- Always label your sources: 🔴 USGS | 🛰️ NASA EONET | ⚡ NOAA | 📡 App Data | 📚 Historical | 🤖 AI Analysis
- Use rich markdown: headers, bold, tables, bullet lists, emojis for severity.

LIVE ANSWER FORMAT — for real-time questions use this structure:
## 📡 Current Situation
## 🕐 Latest Events [with magnitude/severity, location, time, source]
## 🤖 AI Analysis
## ✅ Recommended Actions
## ⚠️ Preparedness Advice
## 🗺️ Related: [link to Live Map / Dashboard]

EMERGENCY MODE — triggered by: HELP, SOS, Emergency, Flood, Fire, Earthquake, Cyclone, Accident, Collapse:
1. 🚨 Immediate safety steps (numbered)
2. Emergency contacts: India 112 | US 911 | UK 999 | EU 112
3. Relevant first aid
4. Shelter and resource guidance

NAVIGATION COMMANDS — when user asks to navigate, append at the END:
<raksh-command>{"type":"navigate","path":"/dashboard"}</raksh-command>
<raksh-command>{"type":"navigate","path":"/live-map"}</raksh-command>
<raksh-command>{"type":"navigate","path":"/risk-analysis"}</raksh-command>
<raksh-command>{"type":"navigate","path":"/emergency-planner"}</raksh-command>

TONE: Professional, calm, authoritative. Always be honest about data limitations.`;

// ── Intent types ──────────────────────────────────────────────────────────────
type AppIntent =
  | "disasters" | "weather" | "risk" | "alerts" | "predictions"
  | "timeline" | "safety_check" | "brief" | "navigate" | "general";

type LiveIntent =
  | "earthquake" | "flood" | "cyclone" | "wildfire" | "tsunami"
  | "volcano" | "storm" | "landslide" | "heatwave" | "drought"
  | "alert" | "live" | "brief";

interface IntentResult {
  appIntents: Set<AppIntent>;
  liveIntents: Set<LiveIntent>;
  isTemporalQuery: boolean;
  extractedLocation: string | null;
}

// ── Temporal keyword detection ────────────────────────────────────────────────
const TEMPORAL_PATTERNS = [
  /\b(today|tonight|this morning|this evening|right now|just now)\b/i,
  /\b(latest|recent|recently|current|currently|live|now|breaking)\b/i,
  /\b(active|ongoing|happening|occurred|hit|struck|affected)\b/i,
  /\b(this week|past\s+\d+\s+(hours?|days?)|last\s+\d+\s+(hours?|days?))\b/i,
  /\b(any .+ today|what happened|what.s happening|show me|tell me about)\b/i,
  /\b(update|updates|news|report|reports|situation)\b/i,
];

function isTemporalQuery(message: string): boolean {
  return TEMPORAL_PATTERNS.some(p => p.test(message));
}

// ── Location extraction ───────────────────────────────────────────────────────
const KNOWN_LOCATIONS: string[] = [
  "japan", "india", "china", "usa", "united states", "california", "texas",
  "indonesia", "philippines", "bangladesh", "pakistan", "nepal", "turkey",
  "mexico", "chile", "peru", "colombia", "venezuela", "brazil", "australia",
  "new zealand", "iran", "taiwan", "vietnam", "thailand", "myanmar",
  "italy", "greece", "haiti", "ecuador", "afghanistan",
  "houston", "miami", "los angeles", "new york", "seattle", "portland",
  "mumbai", "delhi", "tokyo", "beijing", "jakarta", "dhaka", "kathmandu",
  "pacific", "atlantic", "gulf", "caribbean", "himalaya", "ring of fire",
  "south asia", "southeast asia", "central america", "latin america",
];

function extractLocation(message: string): string | null {
  const lower = message.toLowerCase();

  // Check known locations
  for (const loc of KNOWN_LOCATIONS) {
    if (lower.includes(loc)) return loc;
  }

  // Pattern: "in [Location]" or "near [Location]" or "at [Location]"
  const prepositionMatch = lower.match(/\b(?:in|near|at|around|from|for)\s+([a-z][a-z\s]{2,25}?)(?:\?|,|\.|$|\b(?:today|now|recently|this))/);
  if (prepositionMatch) {
    const candidate = prepositionMatch[1].trim();
    if (candidate.length > 2 && !/^(the|this|that|a |an )/.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

// ── Full intent detection ─────────────────────────────────────────────────────
function detectIntent(message: string): IntentResult {
  const m = message.toLowerCase();
  const appIntents = new Set<AppIntent>();
  const liveIntents = new Set<LiveIntent>();

  // App intents
  if (/\b(disaster|earthquake|flood|cyclone|wildfire|fire|tsunami|landslide|heatwave|storm|drought|hurricane|volcano)\b/.test(m)) appIntents.add("disasters");
  if (/\b(weather|temperature|rain|wind|humidity|forecast|condition)\b/.test(m)) appIntents.add("weather");
  if (/\b(risk|score|danger|threat|safe|safety|vulnerable)\b/.test(m)) appIntents.add("risk");
  if (/\b(alert|warning|watch|advisory)\b/.test(m)) appIntents.add("alerts");
  if (/\b(predict|forecast|expect|upcoming|next|future|48.hour)\b/.test(m)) appIntents.add("predictions");
  if (/\b(timeline|history|recent|latest|happened|event)\b/.test(m)) appIntents.add("timeline");
  if (/\b(am i safe|are we safe|should i evacuate|safe to stay|danger near me)\b/.test(m)) appIntents.add("safety_check");
  if (/\b(brief|daily|summary|overview|today|whats happening|what.s happening)\b/.test(m)) appIntents.add("brief");
  if (/\b(open|go to|show|navigate|take me|dashboard|live map|risk analysis|emergency planner)\b/.test(m)) appIntents.add("navigate");

  // Live intents (maps to external API sources)
  if (/\b(earthquake|quake|seismic|tremor|aftershock)\b/.test(m)) liveIntents.add("earthquake");
  if (/\b(flood|flooding|inundation|submerged|deluge)\b/.test(m)) liveIntents.add("flood");
  if (/\b(cyclone|hurricane|typhoon|tropical storm)\b/.test(m)) liveIntents.add("cyclone");
  if (/\b(wildfire|forest fire|brushfire|bushfire)\b/.test(m)) liveIntents.add("wildfire");
  if (/\b(tsunami|tidal wave)\b/.test(m)) liveIntents.add("tsunami");
  if (/\b(volcano|volcanic|eruption|lava|ash cloud)\b/.test(m)) liveIntents.add("volcano");
  if (/\b(storm|thunderstorm|blizzard|snowstorm|ice storm)\b/.test(m)) liveIntents.add("storm");
  if (/\b(landslide|mudslide|debris flow)\b/.test(m)) liveIntents.add("landslide");
  if (/\b(heatwave|heat wave|extreme heat|record temp)\b/.test(m)) liveIntents.add("heatwave");
  if (/\b(drought|water shortage|dry spell)\b/.test(m)) liveIntents.add("drought");
  if (/\b(alert|warning|watch|advisory)\b/.test(m)) liveIntents.add("alert");
  if (/\b(brief|daily brief|situation|happening)\b/.test(m)) liveIntents.add("brief");

  const temporal = isTemporalQuery(message);

  // If temporal + disaster type, always include "live" intent
  if (temporal && (liveIntents.size > 0 || appIntents.has("brief") || appIntents.has("disasters"))) {
    liveIntents.add("live");
  }
  // Brief always fetches live
  if (appIntents.has("brief")) liveIntents.add("live");

  if (appIntents.size === 0) appIntents.add("general");

  return {
    appIntents,
    liveIntents,
    isTemporalQuery: temporal,
    extractedLocation: extractLocation(message),
  };
}

// ── Build app data context ─────────────────────────────────────────────────────
function buildAppDataContext(intents: Set<AppIntent>): string {
  const sections: string[] = [];
  const addAll = intents.has("brief") || intents.has("safety_check");

  if (addAll || intents.has("disasters")) {
    const critical = disasters.filter(d => d.severity === "critical");
    const high = disasters.filter(d => d.severity === "high");
    sections.push(`## 📡 APP DISASTER DATA (${disasters.length} tracked events)
${disasters.map(d => `- [${d.severity.toUpperCase()}] ${d.name} (${d.type}) — ${d.description} | ${d.lat},${d.lng}`).join("\n")}
Critical: ${critical.map(d => d.name).join(", ") || "none"} | High: ${high.map(d => d.name).join(", ") || "none"}`);
  }

  if (addAll || intents.has("alerts")) {
    sections.push(`## 📡 APP ALERTS (${alerts.length} active)
${alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.title} — ${a.location} (${a.time})`).join("\n")}`);
  }

  if (addAll || intents.has("weather")) {
    sections.push(`## 📡 APP WEATHER — ${weather.location}
${weather.temperature}°F | ${weather.condition} | Humidity: ${weather.humidity}% | Wind: ${weather.windSpeed}mph | UV: ${weather.uvIndex}
Forecast: ${weather.forecast.map(f => `${f.day} ${f.high}/${f.low}°F`).join(" | ")}`);
  }

  if (addAll || intents.has("risk")) {
    sections.push(`## 📡 APP RISK SCORE: ${riskScore.overall}/100 (${riskScore.level.toUpperCase()})
${riskFactors.map(r => `- ${r.name}: ${r.score}/100 [${r.level}]`).join("\n")}`);
  }

  if (addAll || intents.has("predictions")) {
    sections.push(`## 📡 APP AI PREDICTION
Primary: ${predictions.primaryThreat} | Confidence: ${predictions.confidence}% | ${predictions.timeframe}
${predictions.summary}`);
  }

  if (addAll || intents.has("timeline")) {
    sections.push(`## 📡 APP TIMELINE
${timeline.map(t => `- [${t.status.toUpperCase()}] ${t.title} — ${t.description} (${t.time})`).join("\n")}`);
  }

  return sections.length > 0
    ? `\n\n---\n# EARTH GUARDIAN APP DATA\n${sections.join("\n\n")}\n---`
    : "";
}

// ── Build full system instruction ─────────────────────────────────────────────
interface AppContext {
  currentPage?: string;
  selectedLocation?: string;
  selectedDisaster?: string;
  weather?: string;
  riskScore?: number;
}

async function buildSystemInstruction(
  intent: IntentResult,
  ctx?: AppContext,
): Promise<{ instruction: string; usedLiveIntelligence: boolean }> {
  let instruction = BASE_SYSTEM_PROMPT;

  // App context
  if (ctx) {
    const lines: string[] = [];
    if (ctx.currentPage) lines.push(`Current page: ${ctx.currentPage}`);
    if (ctx.selectedLocation) lines.push(`Selected location: ${ctx.selectedLocation}`);
    if (ctx.selectedDisaster) lines.push(`Selected disaster event: ${ctx.selectedDisaster}`);
    if (lines.length > 0) {
      instruction += `\n\n## USER APP CONTEXT\n${lines.map(l => `- ${l}`).join("\n")}`;
    }
  }

  // Proactive critical warning from app data
  const criticalEvents = disasters.filter(d => d.severity === "critical");
  if (criticalEvents.length > 0) {
    instruction += `\n\n## ⚠️ CRITICAL EVENTS ACTIVE\n${criticalEvents.length} CRITICAL events: ${criticalEvents.map(e => e.name).join(", ")}`;
  }

  // App data context
  instruction += buildAppDataContext(intent.appIntents);

  // Real-time external intelligence
  let usedLiveIntelligence = false;
  if (intent.liveIntents.size > 0) {
    try {
      const liveData = await fetchLiveIntelligenceForIntents(intent.liveIntents);
      const liveCtx = buildLiveIntelligenceContext(
        liveData,
        intent.extractedLocation ?? ctx?.selectedLocation ?? undefined,
      );
      if (liveCtx) {
        instruction += liveCtx;
        usedLiveIntelligence = true;
      }
    } catch {
      instruction += `\n\n## ⚠️ LIVE EXTERNAL DATA\nExternal intelligence services temporarily unavailable. Using app data and Gemini knowledge only.`;
    }
  }

  return { instruction, usedLiveIntelligence };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toGeminiHistory(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  return messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
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

function getGeminiModel(
  gemini: { genAI: GoogleGenerativeAI; model: string },
  systemInstruction: string,
) {
  return gemini.genAI.getGenerativeModel({
    model: gemini.model,
    systemInstruction,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  });
}

// ── Route: live intelligence status ──────────────────────────────────────────
router.get("/raksh/intelligence/status", async (_req, res) => {
  try {
    const data = await fetchLiveIntelligence();
    res.json({
      fetchedAt: data.fetchedAt,
      sources: {
        usgs: {
          ok: data.earthquakes.ok,
          significantEarthquakes: data.earthquakes.significant_week.length,
          earthquakes24h: data.earthquakes.all_24h.length,
          error: data.earthquakes.error,
        },
        gdacs: {
          ok: data.gdacs.ok,
          activeEvents: data.gdacs.items.length,
          redAlerts: data.gdacs.items.filter(e => e.alertLevel === "Red").length,
          orangeAlerts: data.gdacs.items.filter(e => e.alertLevel === "Orange").length,
          error: data.gdacs.error,
        },
        nasa_eonet: {
          ok: data.eonet.ok,
          activeEvents: data.eonet.items.length,
          byType: data.eonet.items.reduce<Record<string, number>>((acc, e) => {
            acc[e.type] = (acc[e.type] ?? 0) + 1;
            return acc;
          }, {}),
          error: data.eonet.error,
        },
        noaa: {
          ok: data.weatherAlerts.ok,
          activeAlerts: data.weatherAlerts.items.length,
          error: data.weatherAlerts.error,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Status check failed" });
  }
});

// ── Route: Daily Disaster Brief ───────────────────────────────────────────────
router.get("/raksh/brief", async (_req, res) => {
  const gemini = getGeminiClient();
  if (!gemini) {
    res.status(503).json({ error: "Gemini API key not configured" });
    return;
  }

  try {
    // Fetch all live data in parallel
    const liveData = await withTimeout(fetchLiveIntelligence(), 20_000);
    const liveCtx = buildLiveIntelligenceContext(liveData);
    const appCtx = buildAppDataContext(new Set<AppIntent>(["disasters", "alerts", "weather", "risk", "predictions", "timeline"]));

    const systemInstruction = BASE_SYSTEM_PROMPT + appCtx + liveCtx;

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const prompt = `Generate a comprehensive Daily Disaster Brief using ALL available live data above.

# 🌍 Daily Disaster Brief — ${today}

## 🚨 Active Critical Events (from USGS & NASA EONET)
## ⚡ Significant Earthquakes (last 24h from USGS)
## 🌪️ Active Natural Events (from NASA EONET)
## ⚠️ Weather Warnings (from NOAA)
## 📡 Earth Guardian Platform Alerts
## 📊 Risk Assessment
## 🔮 48-Hour Outlook
## ✅ Top 3 Action Items

Be specific. Use actual event names, magnitudes, and locations from the data. Cite your sources. If live data is unavailable for a section, state it clearly. Do NOT hallucinate events.`;

    const model = getGeminiModel(gemini, systemInstruction);
    const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
    const text = result.response.text();

    res.json({
      content: text,
      meta: {
        fetchedAt: liveData.fetchedAt,
        sources: {
          earthquakes: { ok: liveData.earthquakes.ok, count: liveData.earthquakes.significant_week.length },
          events: { ok: liveData.events.ok, count: liveData.events.items.length },
          alerts: { ok: liveData.weatherAlerts.ok, count: liveData.weatherAlerts.items.length },
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Brief generation failed" });
  }
});

// ── Route: Main chat ──────────────────────────────────────────────────────────
router.post("/raksh/chat", async (req, res) => {
  const { messages, context } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    context?: AppContext;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required and must not be empty" });
    return;
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    res.status(200).json({
      content: `## Raksh AI — Setup Required

To activate Raksh AI with **Gemini 2.5 Flash**, add your Google AI API key:

| Variable | Description |
|---|---|
| \`GEMINI_API_KEY\` | Your Google AI Studio API key (**required**) |
| \`GEMINI_MODEL\` | Model name (optional, default: \`gemini-2.5-flash\`) |

Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey) and add it to your Replit environment secrets.`,
    });
    return;
  }

  const lastMessage = messages[messages.length - 1];
  const intent = detectIntent(lastMessage.content);

  // Build system instruction (fetches live data if needed)
  const { instruction: systemInstruction } = await buildSystemInstruction(intent, context);
  const history = toGeminiHistory(messages);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const model = getGeminiModel(gemini, systemInstruction);
      const chat = model.startChat({ history });
      const streamResult = await withTimeout(
        chat.sendMessageStream(lastMessage.content),
        TIMEOUT_MS,
      );

      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (err: unknown) {
      attempt++;
      const message = err instanceof Error ? err.message : "Gemini request failed";
      const isRetryable = /503|overloaded|timeout|UNAVAILABLE/i.test(message);
      if (isRetryable && attempt <= MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      if (!res.headersSent) {
        res.status(500).json({ error: message });
      } else {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      }
      return;
    }
  }
});

export default router;
