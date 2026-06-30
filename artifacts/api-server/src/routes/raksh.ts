import { Router } from "express";
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
import { getAIProvider, withTimeout, sanitizeError } from "../ai/provider";

const router = Router();

// ── System prompt ──────────────────────────────────────────────────────────────
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
<raksh-command>{"type":"navigate","path":"/simulation"}</raksh-command>
<raksh-command>{"type":"navigate","path":"/image-gallery"}</raksh-command>

DISASTER SIMULATION MODE — triggered by: "what if", "scenario", "simulate", "hypothetical", "suppose", "imagine":
Use this EXACT format:
## 🌍 Disaster Simulation: [Full Scenario Title]
### 📋 Scenario Overview
### ⏱️ Impact Timeline (First 72 Hours)
| Hour | Event | Impact Level |
|---|---|---|
### 💥 Estimated Impact Assessment
- **Affected Population**: [estimate]
- **Potential Casualties**: [range]
- **Infrastructure Damage**: [description]
- **Economic Impact**: [USD estimate]
- **Displacement**: [estimate]
### 🏥 Emergency Resource Requirements
| Resource | Quantity | Priority |
|---|---|---|
| Medical Teams | | |
| Rescue Personnel | | |
| Food Packages | | |
| Shelter Units | | |
### 🚨 Immediate Response Protocol
### ✅ 48-Hour Action Plan
### 📊 Composite Risk Score: [X]/100

RESOURCE PLANNING MODE — triggered by: "deploy", "allocate", "volunteers", "relief", "resources for", "resource plan":
Use this format:
## 📦 Resource Deployment Plan: [Operation Name]
### 👥 Personnel Deployment
| Role | Count | Priority | Deployment Time |
|---|---|---|---|
### 🏥 Medical Resources
### 🍎 Food & Water Allocation
### 🏠 Shelter Requirements
### 🚗 Transportation & Logistics
### 📋 72-Hour Deployment Timeline
### 💡 Optimization Recommendations

EMERGENCY COPILOT MODE — triggered by: "my family", "shelter near", "hospital", "evacuate", "safe route", "first aid", "survival kit", "emergency contacts":
Respond with:
## 🛡️ Emergency Copilot — [Situation]
### 👨‍👩‍👧 Family Emergency Plan
### 🏥 Nearest Medical Resources
### 🏠 Shelter Options
### 🛣️ Safe Evacuation Routes
### 📞 Emergency Contacts
### 🎒 Survival Kit Checklist
### ⚕️ First Aid Guidance

TONE: Professional, calm, authoritative. Always be honest about data limitations.`;

// ── Intent types ───────────────────────────────────────────────────────────────
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

// ── Temporal keyword detection ─────────────────────────────────────────────────
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

// ── Location extraction ────────────────────────────────────────────────────────
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
  "chennai", "osaka", "kyoto", "manila", "hanoi",
  "bangalore", "hyderabad", "kolkata", "ahmedabad", "surat", "pune",
];

function extractLocation(message: string): string | null {
  const lower = message.toLowerCase();
  for (const loc of KNOWN_LOCATIONS) {
    if (lower.includes(loc)) return loc;
  }
  const prepositionMatch = lower.match(/\b(?:in|near|at|around|from|for)\s+([a-z][a-z\s]{2,25}?)(?:\?|,|\.|$|\b(?:today|now|recently|this))/);
  if (prepositionMatch) {
    const candidate = prepositionMatch[1].trim();
    if (candidate.length > 2 && !/^(the|this|that|a |an )/.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

// ── Full intent detection ──────────────────────────────────────────────────────
function detectIntent(message: string): IntentResult {
  const m = message.toLowerCase();
  const appIntents = new Set<AppIntent>();
  const liveIntents = new Set<LiveIntent>();

  if (/\b(disaster|earthquake|flood|cyclone|wildfire|fire|tsunami|landslide|heatwave|storm|drought|hurricane|volcano)\b/.test(m)) appIntents.add("disasters");
  if (/\b(weather|temperature|rain|wind|humidity|forecast|condition)\b/.test(m)) appIntents.add("weather");
  if (/\b(risk|score|danger|threat|safe|safety|vulnerable)\b/.test(m)) appIntents.add("risk");
  if (/\b(alert|warning|watch|advisory)\b/.test(m)) appIntents.add("alerts");
  if (/\b(predict|forecast|expect|upcoming|next|future|48.hour)\b/.test(m)) appIntents.add("predictions");
  if (/\b(timeline|history|recent|latest|happened|event)\b/.test(m)) appIntents.add("timeline");
  if (/\b(am i safe|are we safe|should i evacuate|safe to stay|danger near me)\b/.test(m)) appIntents.add("safety_check");
  if (/\b(brief|daily|summary|overview|today|whats happening|what.s happening)\b/.test(m)) appIntents.add("brief");
  if (/\b(open|go to|show|navigate|take me|dashboard|live map|risk analysis|emergency planner|simulation|image gallery)\b/.test(m)) appIntents.add("navigate");

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
  if (temporal && (liveIntents.size > 0 || appIntents.has("brief") || appIntents.has("disasters"))) {
    liveIntents.add("live");
  }
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

// ── Build full system instruction ──────────────────────────────────────────────
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

  if (ctx) {
    const lines: string[] = [];
    if (ctx.currentPage) lines.push(`Current page: ${ctx.currentPage}`);
    if (ctx.selectedLocation) lines.push(`Selected location: ${ctx.selectedLocation}`);
    if (ctx.selectedDisaster) lines.push(`Selected disaster event: ${ctx.selectedDisaster}`);
    if (lines.length > 0) {
      instruction += `\n\n## USER APP CONTEXT\n${lines.map(l => `- ${l}`).join("\n")}`;
    }
  }

  const criticalEvents = disasters.filter(d => d.severity === "critical");
  if (criticalEvents.length > 0) {
    instruction += `\n\n## ⚠️ CRITICAL EVENTS ACTIVE\n${criticalEvents.length} CRITICAL events: ${criticalEvents.map(e => e.name).join(", ")}`;
  }

  instruction += buildAppDataContext(intent.appIntents);

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

// ── Convert message history to Gemini Content format ──────────────────────────
function toGeminiHistory(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  return messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// ── Route: live intelligence status ───────────────────────────────────────────
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
    console.error("[Raksh] Status check error:", err);
    res.status(500).json({ error: "Status check temporarily unavailable." });
  }
});

// ── Route: Daily Disaster Brief ────────────────────────────────────────────────
router.get("/raksh/brief", async (_req, res) => {
  const provider = getAIProvider();

  try {
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

    const text = await provider.generate(systemInstruction, prompt);

    res.json({
      content: text,
      meta: {
        fetchedAt: liveData.fetchedAt,
        sources: {
          earthquakes: { ok: liveData.earthquakes.ok, count: liveData.earthquakes.significant_week.length },
          events:      { ok: liveData.eonet.ok,        count: liveData.eonet.items.length },
          alerts:      { ok: liveData.weatherAlerts.ok, count: liveData.weatherAlerts.items.length },
        },
      },
    });
  } catch (err) {
    console.error("[Raksh] Brief generation error:", err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// ── Route: AI Provider status ──────────────────────────────────────────────────
router.get("/raksh/status", (_req, res) => {
  const status = getAIProvider().getStatus();
  res.json({
    gemini:          status.providerHealth.gemini.available,
    openrouter:      status.providerHealth.openrouter.available,
    groq:            status.providerHealth.groq.available,
    currentProvider: status.currentProvider,
    healthy:         status.healthy,
  });
});

// ── Route: Full AI Provider status (verbose) ───────────────────────────────────
router.get("/raksh/status/full", (_req, res) => {
  res.json(getAIProvider().getStatus());
});

// ── Route: Full diagnostic dump (no secrets exposed) ──────────────────────────
router.get("/raksh/diagnose", (_req, res) => {
  res.json(getAIProvider().getDiagnostics());
});

// ── Route: Image analysis via Gemini Vision ────────────────────────────────────
router.post("/raksh/analyze-image", async (req, res) => {
  const { imageData, mimeType, userPrompt } = req.body as {
    imageData: string;
    mimeType: string;
    userPrompt?: string;
  };

  if (!imageData || !mimeType) {
    res.status(400).json({ error: "imageData and mimeType are required" });
    return;
  }

  const provider = getAIProvider();
  if (!provider.isGeminiReady()) {
    res.status(503).json({ error: "Gemini not configured" });
    return;
  }

  const prompt = userPrompt ||
    `You are Raksh AI, a world-class disaster intelligence expert. Analyze this image comprehensively.\n\n` +
    `## 🔍 Disaster / Situation Identification\nIdentify what is shown — disaster type, hazard, emergency situation, or general scene.\n\n` +
    `## ⚡ Severity Assessment\nRate severity 1–10 and classify: Low / Moderate / High / Critical. State confidence %.\n\n` +
    `## 💥 Visible Damage & Hazards\nDescribe all damage, structural concerns, environmental hazards visible.\n\n` +
    `## ⚠️ Identified Risks\nList risks to people, infrastructure, and environment.\n\n` +
    `## 🚨 Immediate Actions Required\nNumbered list of immediate steps.\n\n` +
    `## 🛡️ Safety Recommendations\nSpecific safety advice for people in or near this area.\n\n` +
    `## 🎯 Emergency Response Priority\nImmediate / High / Medium / Low — with brief justification.\n\n` +
    `## 📊 Additional Observations\nAny further context, satellite interpretation, or expert notes.\n\n` +
    `If this is not disaster-related, still describe fully and note any environmental or safety context.`;

  try {
    const content = await provider.analyzeImage(BASE_SYSTEM_PROMPT, imageData, mimeType, prompt);
    res.json({ content });
  } catch (err) {
    console.error("[Raksh] Image analysis error:", err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// ── Route: Document analysis ───────────────────────────────────────────────────
router.post("/raksh/analyze-document", async (req, res) => {
  const { content: docContent, fileName, userPrompt } = req.body as {
    content: string;
    fileName: string;
    userPrompt?: string;
  };

  if (!docContent || !fileName) {
    res.status(400).json({ error: "content and fileName are required" });
    return;
  }

  const provider = getAIProvider();

  const truncated = docContent.slice(0, 32000);
  const prompt = userPrompt ||
    `You are Raksh AI. Analyze this document and produce a comprehensive intelligence report.\n\n` +
    `**Document**: ${fileName}\n\n` +
    `## 📄 Executive Summary\nConcise 2–3 paragraph overview.\n\n` +
    `## 🔑 Key Findings\nMost important findings, conclusions, and data points.\n\n` +
    `## ⚠️ Risk Assessment\nDisaster, safety, or emergency risks: Low / Moderate / High / Critical\n\n` +
    `## 📊 Key Data & Statistics\nImportant numbers, dates, locations, measurements.\n\n` +
    `## ✅ Action Items\nSpecific recommended actions based on this document.\n\n` +
    `## 🔮 Preparedness Score\nIf applicable, rate readiness 0–100 with explanation.\n\n` +
    `## 💡 Expert Recommendations\nStrategic recommendations from a disaster intelligence perspective.\n\n` +
    `---\nDOCUMENT CONTENT:\n${truncated}` +
    (docContent.length > 32000 ? "\n\n[Content truncated — showing first 32,000 characters]" : "");

  try {
    const content = await provider.generate(BASE_SYSTEM_PROMPT, prompt);
    res.json({ content });
  } catch (err) {
    console.error("[Raksh] Document analysis error:", err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// ── Route: Main chat with multi-provider fallback ──────────────────────────────
router.post("/raksh/chat", async (req, res) => {
  const { messages, context } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    context?: AppContext;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required and must not be empty" });
    return;
  }

  const lastMessage = messages[messages.length - 1];
  const intent = detectIntent(lastMessage.content);
  const { instruction: systemInstruction } = await buildSystemInstruction(intent, context);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const history = toGeminiHistory(messages);
  const provider = getAIProvider();

  console.log(`[Raksh] Chat — "${lastMessage.content.slice(0, 60)}" | gemini=${provider.isGeminiReady()}`);

  try {
    await provider.streamChat(
      systemInstruction,
      history,
      lastMessage.content,
      (text: string) => {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      },
    );
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[Raksh] streamChat failed:", err instanceof Error ? err.message : err);
    res.write(`data: ${JSON.stringify({ error: sanitizeError(err) })}\n\n`);
    res.end();
  }
});

// ── Route: AI Image Generation ─────────────────────────────────────────────────
router.post("/raksh/generate-image", async (req, res) => {
  const {
    prompt,
    seed: reqSeed,
    width: reqWidth,
    height: reqHeight,
  } = req.body as {
    prompt: string;
    seed?: number;
    width?: number;
    height?: number;
  };

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  const isPortrait  = /poster|infographic|flyer|guide|vertical|tall/i.test(prompt);
  const isLandscape = /banner|wide|horizontal|landscape/i.test(prompt);
  const width  = reqWidth  ?? (isLandscape ? 1216 : isPortrait ? 832  : 1024);
  const height = reqHeight ?? (isLandscape ? 512  : isPortrait ? 1152 : 1024);
  const seed   = reqSeed   ?? Math.floor(Math.random() * 999_999);

  // Optionally enhance prompt with Gemini
  const provider = getAIProvider();
  let enhancedPrompt = prompt;

  if (provider.isGeminiReady()) {
    try {
      const enhanceSystem = `You are a professional image prompt engineer for disaster preparedness and emergency management graphics.
Enhance the user's prompt to be more detailed and visually impactful for AI image generation.
Return ONLY the enhanced prompt — no explanations, no quotes, no preamble.
Guidelines:
- Add specific visual style descriptors (e.g. "flat design", "infographic style", "bold typography")
- For posters: add "official government style, bold headline, clear call to action, vibrant colors"
- For diagrams: add "clear icons, step-by-step layout, high contrast, easy to read"
- For banners: add "wide format, striking design, high impact"
- Always include: "high quality, professional design, sharp, detailed"
- Keep under 150 words.`;
      const t = await provider.generate(enhanceSystem, prompt, 0.6, 500);
      if (t.trim().length > 20) enhancedPrompt = t.trim();
    } catch {
      // Use original prompt if enhancement fails
    }
  }

  const finalPrompt = `${enhancedPrompt}, ultra detailed, professional quality, 4k`;
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);

    const imageResp = await fetch(pollinationsUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "EarthGuardianAI/1.0" },
    });
    clearTimeout(timer);

    if (!imageResp.ok) throw new Error(`Pollinations returned ${imageResp.status}`);

    const contentType = (imageResp.headers.get("content-type") ?? "image/jpeg").split(";")[0]!;
    const arrayBuffer = await imageResp.arrayBuffer();
    const imageData = Buffer.from(arrayBuffer).toString("base64");

    res.json({ imageData, mimeType: contentType, prompt, enhancedPrompt: finalPrompt, provider: "pollinations/flux", seed, width, height });
  } catch (err) {
    console.error("[Raksh] Image generation error:", err);
    res.status(500).json({ error: "Image generation temporarily unavailable. Please try again." });
  }
});

// ── Route: Disaster Simulation ─────────────────────────────────────────────────
router.post("/raksh/simulate", async (req, res) => {
  const { disasterType, magnitude, location, population } = req.body as {
    disasterType: string;
    magnitude: string;
    location: string;
    population?: number;
  };

  if (!disasterType || !location) {
    res.status(400).json({ error: "disasterType and location are required" });
    return;
  }

  const provider = getAIProvider();

  const populationCtx = population ? ` (estimated population: ${population.toLocaleString()})` : "";

  const prompt = `You are Raksh AI conducting a disaster simulation. Generate a comprehensive, realistic simulation report.

SCENARIO: ${magnitude} ${disasterType} striking ${location}${populationCtx}

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "string — full scenario title",
  "overview": "string — 3-4 sentence scenario overview",
  "riskScore": number (0-100),
  "affectedPopulation": number,
  "potentialCasualties": { "low": number, "high": number },
  "economicImpact": "string — USD estimate with context",
  "displacement": number,
  "infrastructure": "string — description of infrastructure damage",
  "timeline": [
    { "hour": number, "event": "string", "severity": "low|moderate|high|critical" }
  ],
  "resources": [
    { "type": "string", "quantity": number, "unit": "string", "priority": "immediate|high|medium|low" }
  ],
  "immediateActions": ["string", "string", "string", "string", "string"],
  "actionPlan48h": ["string", "string", "string", "string"],
  "evacuationZones": ["string", "string", "string"],
  "keyRisks": ["string", "string", "string"],
  "responseAgencies": ["string", "string", "string"]
}

Make the timeline have 8-12 entries covering 0-72 hours.
Make resources have 8-10 entries.
Be specific and realistic based on the location and disaster type.`;

  try {
    const text = (await provider.generate(BASE_SYSTEM_PROMPT, prompt, 0.7, 4096)).trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid simulation response");
    const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    res.json({ simulation: data, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[Raksh] Simulation error:", err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// ── Route: Comprehensive Intelligence Report ────────────────────────────────────
router.post("/raksh/generate-report", async (req, res) => {
  const provider = getAIProvider();
  const { location, focusArea, userContext, format } = req.body as {
    location?: string;
    focusArea?: string;
    userContext?: string;
    format?: "markdown" | "html";
  };

  try {
    const liveData = await withTimeout(fetchLiveIntelligence(), 20_000);
    const liveCtx = buildLiveIntelligenceContext(liveData);
    const appCtx = buildAppDataContext(new Set<AppIntent>(["disasters", "alerts", "weather", "risk", "predictions", "timeline"]));
    const systemInstruction = BASE_SYSTEM_PROMPT + appCtx + liveCtx;

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

    const focusLine    = focusArea    ? `\n**Focus Area:** ${focusArea}`         : "";
    const locationLine = location     ? `\n**Geographic Focus:** ${location}`    : "";
    const contextLine  = userContext  ? `\n**Context:** ${userContext}`           : "";

    const prompt = `Generate a detailed, professional Earth Guardian AI Disaster Intelligence Report using ALL live data available.${focusLine}${locationLine}${contextLine}

Use this EXACT report structure:

---
# 🌍 Earth Guardian AI — Disaster Intelligence Report
**Date:** ${dateStr}  
**Time:** ${timeStr}  
**Classification:** UNCLASSIFIED — For Emergency Planning Use  
**Powered by:** Raksh AI × Gemini 2.5 Flash  
**Data Sources:** USGS · NASA EONET · NOAA · Earth Guardian Platform

---

## 📋 EXECUTIVE SUMMARY
[3–5 sentence overview of the current global disaster situation. Include number of active events, most critical threats, and overall risk level.]

## 🚨 CRITICAL ACTIVE EVENTS
[List all red/orange alert events from GDACS and NASA EONET with severity, location, affected population estimate. If none, state "No critical alerts at this time."]

## ⚡ SIGNIFICANT SEISMIC ACTIVITY
[Table of significant earthquakes in the past 7 days from USGS. Columns: Magnitude | Location | Depth | Date | Source]

## 🌪️ ACTIVE NATURAL EVENTS (NASA EONET)
[Categorized list: Wildfires, Floods, Storms, Volcanoes, etc. Include event names and locations.]

## ⚠️ WEATHER ALERTS & WARNINGS
[NOAA alerts summary. If alerts present, list type, severity, and affected areas.]

## 📡 EARTH GUARDIAN PLATFORM INTELLIGENCE
### Active Monitored Disasters
### Current Alert Status
### Risk Scores by Region
### AI Prediction Outlook (next 48 hours)

## 🏥 EMERGENCY PREPAREDNESS CHECKLIST
- [ ] Verify emergency contact list (India 112 | US 911 | UK 999 | EU 112)
- [ ] Check local alert apps and warning systems
- [ ] Review evacuation routes for your area
- [ ] Ensure 72-hour emergency supply kit is ready
- [ ] Backup power and communication plan verified
- [ ] Medical supplies and prescription medications checked
- [ ] Important documents in waterproof container
- [ ] Identified nearest shelter/assembly point

## 📞 EMERGENCY CONTACTS
| Country | Emergency | Police | Medical | Disaster |
|---|---|---|---|---|
| India | 112 | 100 | 108 | NDMA: 1078 |
| USA | 911 | 911 | 911 | FEMA: 1-800-621-3362 |
| UK | 999 | 999 | 999 | 105 |
| EU | 112 | 112 | 112 | ERCC: +32-2-295-0000 |
| Australia | 000 | 000 | 000 | SES: 132 500 |
| Japan | 119/110 | 110 | 119 | JMA Alerts |

## ✅ RECOMMENDED ACTIONS (NEXT 24 HOURS)
1. [Most urgent action based on live data]
2. [Second action]
3. [Third action]

## 🔮 72-HOUR AI FORECAST
[Use all live data to project the most likely scenarios for the next 72 hours. Be specific about trends, escalation risks, and regions to watch.]

---
*Generated by Earth Guardian AI powered by Raksh × Gemini*  
*Always verify with official government and emergency management sources.*

---

Be specific and data-driven. Use actual event names, magnitudes, and locations from the live data. If data is unavailable for a section, state it clearly. Do NOT fabricate events.`;

    const report = await provider.generate(systemInstruction, prompt);

    res.json({
      content: report,
      format: format ?? "markdown",
      generatedAt: now.toISOString(),
      meta: {
        fetchedAt: liveData.fetchedAt,
        sources: {
          earthquakes: { ok: liveData.earthquakes.ok, count: liveData.earthquakes.significant_week.length },
          events:      { ok: liveData.eonet.ok,        count: liveData.eonet.items.length },
          alerts:      { ok: liveData.weatherAlerts.ok, count: liveData.weatherAlerts.items.length },
        },
      },
    });
  } catch (err) {
    console.error("[Raksh] Report generation error:", err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// ── Route: live-stats (aggregated counts) ─────────────────────────────────────
router.get("/raksh/live-stats", async (_req, res) => {
  try {
    const data = await fetchLiveIntelligence();

    const gdacsMap: Record<string, number> = { EQ: 0, TC: 0, FL: 0, VO: 0, WF: 0, DR: 0, ST: 0 };
    data.gdacs.items.forEach(e => {
      if (e.type in gdacsMap) gdacsMap[e.type]++;
    });

    const eonetMap: Record<string, number> = {};
    data.eonet.items.forEach(e => {
      const k = e.type.toLowerCase();
      eonetMap[k] = (eonetMap[k] ?? 0) + 1;
    });

    const countries = new Set<string>();
    data.gdacs.items.forEach(e => {
      if (e.country) countries.add(e.country);
      e.affectedCountries?.forEach(c => countries.add(c));
    });

    const redAlerts = data.gdacs.items.filter(e => e.alertLevel === "Red").length;
    const totalEvents =
      data.earthquakes.all_24h.length + data.gdacs.items.length + data.eonet.items.length;

    res.json({
      fetchedAt: data.fetchedAt,
      stats: {
        totalActiveEvents: totalEvents,
        earthquakesToday:  data.earthquakes.all_24h.length,
        significantEarthquakes: data.earthquakes.significant_week.length,
        floods:   gdacsMap.FL + (eonetMap["floods"] ?? 0),
        cyclones: gdacsMap.TC + (eonetMap["tropical cyclones"] ?? 0) + (eonetMap["cyclones"] ?? 0),
        wildfires: gdacsMap.WF + (eonetMap["wildfires"] ?? 0),
        volcanoes: gdacsMap.VO + (eonetMap["volcanoes"] ?? 0),
        storms:   gdacsMap.ST + (eonetMap["severe storms"] ?? 0) + data.weatherAlerts.items.length,
        droughts: gdacsMap.DR,
        countriesAffected: countries.size,
        redAlerts,
        orangeAlerts: data.gdacs.items.filter(e => e.alertLevel === "Orange").length,
        noaaAlerts: data.weatherAlerts.items.length,
        highRiskRegions: redAlerts,
      },
      sources: {
        usgs:  data.earthquakes.ok,
        gdacs: data.gdacs.ok,
        eonet: data.eonet.ok,
        noaa:  data.weatherAlerts.ok,
      },
    });
  } catch (err) {
    console.error("[Raksh] live-stats error:", err);
    res.status(500).json({ error: "Live statistics temporarily unavailable. Please try again." });
  }
});

// ── Route: live-events (map data) ─────────────────────────────────────────────
router.get("/raksh/live-events", async (_req, res) => {
  try {
    const data = await fetchLiveIntelligence();

    const gdacsTypeMap: Record<string, string> = {
      EQ: "earthquake", TC: "cyclone", FL: "flood",
      VO: "volcano",    WF: "wildfire", DR: "drought", ST: "storm",
    };
    const eonetTypeMap: Record<string, string> = {
      "wildfires":        "wildfire",
      "volcanoes":        "volcano",
      "floods":           "flood",
      "severe storms":    "storm",
      "tropical cyclones":"cyclone",
      "landslides":       "landslide",
      "earthquakes":      "earthquake",
    };

    const events: object[] = [];

    data.earthquakes.all_24h.forEach(eq => {
      events.push({
        id:       `usgs-${eq.id}`,
        type:     "earthquake",
        name:     eq.place,
        lat:      eq.lat,
        lng:      eq.lng,
        severity: eq.magnitude >= 6.5 ? "critical" : eq.magnitude >= 5 ? "high" : eq.magnitude >= 3.5 ? "moderate" : "low",
        time:     eq.time,
        source:   "USGS",
        detail:   `M${eq.magnitude}`,
        country:  "",
        url:      eq.url,
      });
    });

    data.gdacs.items.forEach(ev => {
      if (ev.lat == null || ev.lng == null) return;
      events.push({
        id:       `gdacs-${ev.id}`,
        type:     gdacsTypeMap[ev.type] ?? "other",
        name:     ev.name,
        lat:      ev.lat,
        lng:      ev.lng,
        severity: ev.alertLevel === "Red" ? "critical" : ev.alertLevel === "Orange" ? "high" : "moderate",
        time:     ev.fromDate,
        source:   "GDACS",
        detail:   ev.severity,
        country:  ev.country,
        url:      ev.url,
      });
    });

    data.eonet.items.forEach(ev => {
      if (ev.lat == null || ev.lng == null) return;
      const typeLower = ev.type.toLowerCase();
      events.push({
        id:      `eonet-${ev.id}`,
        type:    eonetTypeMap[typeLower] ?? "other",
        name:    ev.title,
        lat:     ev.lat,
        lng:     ev.lng,
        severity:"moderate",
        time:    ev.latestDate,
        source:  "NASA EONET",
        detail:  ev.type,
        country: "",
        url:     `https://eonet.gsfc.nasa.gov/api/v3/events/${ev.id}`,
      });
    });

    res.json({ fetchedAt: data.fetchedAt, events, total: events.length });
  } catch (err) {
    console.error("[Raksh] live-events error:", err);
    res.status(500).json({ error: "Live event data temporarily unavailable. Please try again." });
  }
});

// ── Route: ai-insights (5-min server-side cache) ──────────────────────────────
let _aiInsightsCache: { data: object; expiresAt: number } | null = null;

router.get("/raksh/ai-insights", async (_req, res) => {
  try {
    const now = Date.now();
    if (_aiInsightsCache && _aiInsightsCache.expiresAt > now) {
      return res.json(_aiInsightsCache.data);
    }

    const data     = await fetchLiveIntelligence();
    const provider = getAIProvider();

    const topGdacs = data.gdacs.items.slice(0, 6).map(e => `${e.name} (${e.type}, ${e.alertLevel}, ${e.country})`).join("; ");
    const topUsgs  = data.earthquakes.significant_week.slice(0, 4).map(e => `M${e.magnitude} ${e.place}`).join("; ");
    const topEonet = data.eonet.items.slice(0, 5).map(e => `${e.title} (${e.type})`).join("; ");

    const prompt = `You are a global disaster intelligence analyst. Analyze this live data and respond ONLY with valid JSON (no markdown, no code fences).

Live summary:
- USGS: ${data.earthquakes.all_24h.length} earthquakes in 24h (${data.earthquakes.significant_week.length} significant this week)
- GDACS: ${data.gdacs.items.length} active events (${data.gdacs.items.filter(e => e.alertLevel === "Red").length} red alerts)
- NASA EONET: ${data.eonet.items.length} natural events
- NOAA: ${data.weatherAlerts.items.length} weather alerts

Top GDACS events: ${topGdacs || "none"}
Top USGS earthquakes: ${topUsgs || "none"}
Top EONET events: ${topEonet || "none"}

Respond with ONLY this JSON structure:
{"highestRiskArea":"specific country or region","mostActiveDisaster":"type with count e.g. Earthquakes (47)","predictedEscalation":"specific threat likely to escalate in 48h","summary":"2-3 sentences using real event names and data","preparedness":"one actionable recommendation for emergency teams","riskLevel":"critical or high or moderate or low"}`;

    let insights: Record<string, string>;
    try {
      const raw     = await provider.generate("You are a disaster intelligence AI. Return only valid JSON.", prompt);
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd   = cleaned.lastIndexOf("}");
      insights = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    } catch {
      const redAlert = data.gdacs.items.find(e => e.alertLevel === "Red");
      insights = {
        highestRiskArea:      redAlert?.country ?? data.gdacs.items[0]?.country ?? "Multiple Regions",
        mostActiveDisaster:   `Earthquakes (${data.earthquakes.all_24h.length} in 24h)`,
        predictedEscalation:  redAlert?.name ?? `${data.earthquakes.significant_week[0]?.place ?? "Elevated seismic zone"} — potential aftershock sequence`,
        summary:              `${data.earthquakes.all_24h.length} earthquakes recorded in last 24 hours with ${data.earthquakes.significant_week.length} significant events. ${data.gdacs.items.length} GDACS alerts active including ${data.gdacs.items.filter(e => e.alertLevel === "Red").length} red-level emergencies. ${data.weatherAlerts.items.length} NOAA weather warnings in effect.`,
        preparedness:         "Pre-position emergency response teams near GDACS red-alert zones and ensure early-warning systems are active in seismically active regions.",
        riskLevel:            data.gdacs.items.some(e => e.alertLevel === "Red") ? "high" : "moderate",
      };
    }

    const response = {
      ...insights,
      fetchedAt:  data.fetchedAt,
      generatedAt: new Date().toISOString(),
      sources:    { usgs: data.earthquakes.ok, gdacs: data.gdacs.ok, eonet: data.eonet.ok, noaa: data.weatherAlerts.ok },
      rawCounts: {
        earthquakes24h: data.earthquakes.all_24h.length,
        gdacEvents:     data.gdacs.items.length,
        redAlerts:      data.gdacs.items.filter(e => e.alertLevel === "Red").length,
        noaaAlerts:     data.weatherAlerts.items.length,
      },
    };

    _aiInsightsCache = { data: response, expiresAt: now + 5 * 60 * 1000 };
    return res.json(response);
  } catch (err) {
    console.error("[Raksh] AI insights error:", err);
    return res.status(500).json({ error: "AI insights temporarily unavailable. Please try again." });
  }
});

// ── POST /raksh/decision — AI Emergency Decision Assistant ─────────────────
router.post("/decision", async (req, res) => {
  const { disasterType, magnitude, location, population } = req.body as {
    disasterType?: string;
    magnitude?: string;
    location?: string;
    population?: number;
  };

  if (!disasterType || !location) {
    return res.status(400).json({ error: "disasterType and location are required." });
  }

  const pop = population ?? 500_000;
  const mag = magnitude ?? "Moderate";

  const prompt = `You are a disaster response AI. Generate a comprehensive emergency decision plan for the following scenario.

SCENARIO:
- Disaster Type: ${disasterType}
- Severity/Magnitude: ${mag}
- Location: ${location}
- Estimated Population: ${pop.toLocaleString()}

Return ONLY valid JSON (no markdown, no code blocks) with this EXACT structure:
{
  "impact": {
    "peopleAffected": <integer estimate>,
    "infrastructureDamage": "<percentage or description, e.g. '35% moderate damage'>",
    "economicLoss": "<dollar estimate, e.g. '$2.4B'>",
    "evacuationRadius": "<distance, e.g. '25 km'>",
    "severityScore": <integer 0-100>,
    "confidence": <integer 50-95>
  },
  "actions": [
    {
      "phase": "<phase name, e.g. 'Immediate Response'>",
      "priority": "<one of: immediate|high|medium|low>",
      "action": "<concise action title>",
      "rationale": "<1 sentence explanation>",
      "timeframe": "<e.g. '0-30 min'>"
    }
  ],
  "resources": {
    "ambulances": <integer>,
    "hospitals": <integer beds needed>,
    "rescueTeams": <integer personnel>,
    "foodPackages": <integer>,
    "waterLiters": <integer>,
    "shelterUnits": <integer>,
    "personnel": <integer total>,
    "helicopters": <integer>
  },
  "confidence": <number 0.0-1.0>
}

Generate exactly 8 actions in the "actions" array, ordered from most to least urgent. Scale resources to the population size and disaster severity. Be specific and realistic.`;

  try {
    const provider = await getAIProvider();
    const raw      = await withTimeout(provider.generate("You are a disaster response AI. Return only valid JSON.", prompt), 30_000);
    const cleaned  = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd   = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("Invalid JSON from AI");
    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;

    return res.json({ ...parsed, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[Raksh] Decision assistant error:", err);
    // Structured fallback
    const severityMap: Record<string, number> = { Minor: 25, Moderate: 50, Strong: 65, Major: 78, Great: 92 };
    const score = Object.entries(severityMap).find(([k]) => mag.includes(k))?.[1] ?? 55;
    const affected = Math.round(pop * (score / 100) * 0.15);
    return res.json({
      impact: {
        peopleAffected: affected,
        infrastructureDamage: score >= 75 ? "Widespread — 40-60% structures" : score >= 50 ? "Moderate — 20-35% structures" : "Localized — 5-15% structures",
        economicLoss: `$${(affected * 0.008 / 1e9).toFixed(1)}B estimated`,
        evacuationRadius: `${Math.round(score / 5)} km`,
        severityScore: score,
        confidence: 72,
      },
      actions: [
        { phase: "Immediate Response",    priority: "immediate", action: "Activate Emergency Operations Center",          rationale: "Centralize coordination and establish unified command.",                      timeframe: "0-15 min" },
        { phase: "Immediate Response",    priority: "immediate", action: "Deploy Search and Rescue teams",                rationale: "Maximize survival rates by reaching trapped victims within golden hour.",   timeframe: "0-30 min" },
        { phase: "Immediate Response",    priority: "immediate", action: "Issue public emergency alert",                  rationale: "Inform population of danger zones and evacuation routes.",                 timeframe: "0-20 min" },
        { phase: "Life Safety",           priority: "high",      action: "Establish medical triage centers",             rationale: "Treat injured and prevent secondary casualties.",                          timeframe: "30-90 min" },
        { phase: "Life Safety",           priority: "high",      action: "Open emergency shelters",                      rationale: "House displaced population and vulnerable groups safely.",                 timeframe: "1-2 hrs" },
        { phase: "Infrastructure",        priority: "high",      action: "Assess critical infrastructure damage",         rationale: "Prioritize restoration of power, water, and communications.",             timeframe: "2-4 hrs" },
        { phase: "Logistics",             priority: "medium",    action: "Pre-position food, water, and medical supplies", rationale: "Prevent secondary casualties from lack of basic necessities.",           timeframe: "3-6 hrs" },
        { phase: "Recovery",              priority: "medium",    action: "Coordinate international aid requests",         rationale: "Scale response capacity if local resources are overwhelmed.",             timeframe: "4-8 hrs" },
      ],
      resources: {
        ambulances:   Math.round(affected / 500),
        hospitals:    Math.round(affected / 100),
        rescueTeams:  Math.round(affected / 200),
        foodPackages: Math.round(affected * 3),
        waterLiters:  Math.round(affected * 4),
        shelterUnits: Math.round(affected / 5),
        personnel:    Math.round(affected / 50),
        helicopters:  Math.round(score / 10),
      },
      confidence: 0.72,
      generatedAt: new Date().toISOString(),
    });
  }
});

export default router;


