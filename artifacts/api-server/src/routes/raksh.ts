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

const router = Router();

// ── Config ────────────────────────────────────────────────────────────────────
const DEFAULT_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

function getGeminiClient(): { genAI: GoogleGenerativeAI; model: string } | null {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) return null;
  return { genAI: new GoogleGenerativeAI(apiKey), model: process.env["GEMINI_MODEL"] ?? DEFAULT_MODEL };
}

// ── System prompt ─────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are Raksh AI, a premium disaster intelligence and emergency response copilot embedded in Earth Guardian AI — a real-time global disaster monitoring platform.

EXPERTISE: Earthquakes, floods, cyclones, wildfires, landslides, heatwaves, storms, tsunamis, drought, emergency preparedness, climate awareness, and first aid.

CORE RULES:
- Use live project data (provided in LIVE DATA sections) as your primary source. Cite it explicitly.
- Use Gemini knowledge only for explanations, recommendations, historical context, and general answers.
- NEVER fabricate live events. If unsure, say "Based on available project data..." or "I don't have live information on this."
- Always distinguish: 📡 Live Data | 📚 Historical | 🤖 AI Recommendation | ⚠️ Unavailable
- Use rich markdown: headers, bold, tables, bullet lists, emojis for severity.

EMERGENCY MODE — triggered by: HELP, SOS, Emergency, Flood, Fire, Earthquake, Cyclone, Accident, Collapse:
1. 🚨 Immediate safety steps (numbered)
2. Emergency contacts: India 112 | US 911 | UK 999 | EU 112
3. Relevant first aid
4. Shelter and resource guidance
5. Kit reminder

COMMAND RESPONSES — when user asks to navigate or take an action, include at the END of your response a JSON block (on its own line) like:
<raksh-command>{"type":"navigate","path":"/dashboard"}</raksh-command>
<raksh-command>{"type":"navigate","path":"/live-map"}</raksh-command>
<raksh-command>{"type":"navigate","path":"/risk-analysis"}</raksh-command>
<raksh-command>{"type":"navigate","path":"/emergency-planner"}</raksh-command>

SMART ACTIONS — mention these contextually:
- "View this on the **Live Map** →"
- "Check your full risk breakdown on **Risk Analysis** →"
- "Build your plan in **Emergency Planner** →"
- "See all alerts on the **Dashboard** →"

TONE: Professional, calm, authoritative. Premium AI comparable to the best consumer assistants, specialized for disaster intelligence.`;

// ── Intent detection ──────────────────────────────────────────────────────────
type Intent =
  | "disasters"
  | "weather"
  | "risk"
  | "alerts"
  | "predictions"
  | "timeline"
  | "safety_check"
  | "brief"
  | "navigate"
  | "general";

function detectIntent(message: string): Set<Intent> {
  const m = message.toLowerCase();
  const intents = new Set<Intent>();

  if (/\b(disaster|earthquake|flood|cyclone|wildfire|fire|tsunami|landslide|heatwave|storm|drought|hurricane)\b/.test(m)) intents.add("disasters");
  if (/\b(weather|temperature|rain|wind|humidity|forecast|condition)\b/.test(m)) intents.add("weather");
  if (/\b(risk|score|danger|threat|safe|safety|vulnerable)\b/.test(m)) intents.add("risk");
  if (/\b(alert|warning|watch|advisory)\b/.test(m)) intents.add("alerts");
  if (/\b(predict|forecast|expect|upcoming|next|future|48 hour)\b/.test(m)) intents.add("predictions");
  if (/\b(timeline|history|recent|latest|happened|event)\b/.test(m)) intents.add("timeline");
  if (/\b(am i safe|are we safe|should i evacuate|safe to stay|danger near me)\b/.test(m)) intents.add("safety_check");
  if (/\b(brief|daily|summary|overview|today|whats happening|what's happening)\b/.test(m)) intents.add("brief");
  if (/\b(open|go to|show|navigate|take me|dashboard|live map|risk analysis|emergency planner)\b/.test(m)) intents.add("navigate");

  if (intents.size === 0) intents.add("general");
  return intents;
}

// ── Build live data context string ────────────────────────────────────────────
function buildLiveDataContext(intents: Set<Intent>): string {
  const sections: string[] = [];
  const addAll = intents.has("brief") || intents.has("safety_check");

  if (addAll || intents.has("disasters")) {
    const critical = disasters.filter(d => d.severity === "critical");
    const high = disasters.filter(d => d.severity === "high");
    sections.push(`## 📡 LIVE DISASTER DATA (${disasters.length} active events)
${disasters.map(d => `- [${d.severity.toUpperCase()}] ${d.name} (${d.type}) — ${d.description} | Coords: ${d.lat},${d.lng}`).join("\n")}
Critical events: ${critical.map(d => d.name).join(", ") || "none"}
High severity: ${high.map(d => d.name).join(", ") || "none"}`);
  }

  if (addAll || intents.has("alerts")) {
    sections.push(`## 📡 LIVE ALERTS (${alerts.length} active)
${alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.title} — ${a.location} (${a.time})`).join("\n")}`);
  }

  if (addAll || intents.has("weather")) {
    sections.push(`## 📡 LIVE WEATHER — ${weather.location}
Temperature: ${weather.temperature}°F | Condition: ${weather.condition} | Humidity: ${weather.humidity}% | Wind: ${weather.windSpeed} mph | UV: ${weather.uvIndex}
5-day forecast: ${weather.forecast.map(f => `${f.day} ${f.high}/${f.low}°F ${f.condition}`).join(" | ")}`);
  }

  if (addAll || intents.has("risk")) {
    sections.push(`## 📡 LIVE RISK ANALYSIS
Overall Risk Score: ${riskScore.overall}/100 (${riskScore.level.toUpperCase()})
${riskFactors.map(r => `- ${r.name}: ${r.score}/100 [${r.level}] — ${r.description}`).join("\n")}`);
  }

  if (addAll || intents.has("predictions")) {
    sections.push(`## 📡 AI PREDICTION
Primary threat: ${predictions.primaryThreat} | Confidence: ${predictions.confidence}% | Timeframe: ${predictions.timeframe}
${predictions.summary}
Factors: ${predictions.factors.map(f => `${f.label} (${f.impact}%)`).join(", ")}`);
  }

  if (addAll || intents.has("timeline")) {
    sections.push(`## 📡 RECENT TIMELINE
${timeline.map(t => `- [${t.status.toUpperCase()}] ${t.title} — ${t.description} (${t.time})`).join("\n")}`);
  }

  return sections.length > 0
    ? `\n\n---\n# LIVE PROJECT DATA — Use this as your primary source\n${sections.join("\n\n")}\n---`
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

function buildSystemInstruction(intents: Set<Intent>, ctx?: AppContext): string {
  let instruction = BASE_SYSTEM_PROMPT;

  // App context
  if (ctx) {
    const lines: string[] = [];
    if (ctx.currentPage) lines.push(`Current page: ${ctx.currentPage}`);
    if (ctx.selectedLocation) lines.push(`Selected location: ${ctx.selectedLocation}`);
    if (ctx.selectedDisaster) lines.push(`Selected disaster event: ${ctx.selectedDisaster}`);
    if (ctx.weather) lines.push(`User weather context: ${ctx.weather}`);
    if (ctx.riskScore !== undefined) lines.push(`User risk score: ${ctx.riskScore}/100`);
    if (lines.length > 0) {
      instruction += `\n\n## USER APP CONTEXT\n${lines.map(l => `- ${l}`).join("\n")}`;
    }
  }

  // Proactive critical warning
  const criticalEvents = disasters.filter(d => d.severity === "critical");
  if (criticalEvents.length > 0) {
    instruction += `\n\n## ⚠️ PROACTIVE ALERT\nThere are ${criticalEvents.length} CRITICAL severity events currently active: ${criticalEvents.map(e => e.name).join(", ")}. Mention this proactively if relevant.`;
  }

  // Live data
  instruction += buildLiveDataContext(intents);

  return instruction;
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

function getGeminiModel(gemini: { genAI: GoogleGenerativeAI; model: string }, systemInstruction: string) {
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

// ── Routes ────────────────────────────────────────────────────────────────────

// Daily Disaster Brief
router.get("/raksh/brief", async (_req, res) => {
  const gemini = getGeminiClient();
  if (!gemini) {
    res.status(503).json({ error: "Gemini API key not configured" });
    return;
  }

  const briefData = buildLiveDataContext(new Set<Intent>(["disasters", "alerts", "weather", "risk", "predictions", "timeline"]));
  const systemInstruction = BASE_SYSTEM_PROMPT + briefData;

  const prompt = `Generate a comprehensive Daily Disaster Brief for today. Use ONLY the live project data provided. Format it as:

# 🌍 Daily Disaster Brief — ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

## 🚨 Active Critical Events
## ⚠️ High Priority Alerts
## 🌤️ Weather Conditions
## 📊 Risk Assessment
## 🔮 AI Prediction (next 48h)
## ✅ Recommended Actions

Be specific, use the actual event names and locations from the data. End with 3 prioritized action items.`;

  try {
    const model = getGeminiModel(gemini, systemInstruction);
    const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
    const text = result.response.text();
    res.json({ content: text });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Brief generation failed" });
  }
});

// Main chat endpoint
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

Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey) and add it to your environment secrets.`,
    });
    return;
  }

  const lastMessage = messages[messages.length - 1];
  const intents = detectIntent(lastMessage.content);
  const systemInstruction = buildSystemInstruction(intents, context);
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
      const streamResult = await withTimeout(chat.sendMessageStream(lastMessage.content), TIMEOUT_MS);

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
