import { Router } from "express";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const router = Router();

// ── Provider config ──────────────────────────────────────────────────────────
const DEFAULT_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

function getGeminiClient(): { genAI: GoogleGenerativeAI; model: string } | null {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) return null;
  const model = process.env["GEMINI_MODEL"] ?? DEFAULT_MODEL;
  return { genAI: new GoogleGenerativeAI(apiKey), model };
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Raksh AI, a premium disaster intelligence and emergency response copilot embedded in Earth Guardian AI — a real-time global disaster monitoring platform.

Your expertise covers: earthquakes, floods, cyclones, wildfires, landslides, heatwaves, storms, tsunamis, drought, emergency preparedness, climate awareness, and first aid.

CORE BEHAVIORS:
- Be concise, direct, and highly informative. Use markdown formatting richly.
- Always clearly distinguish between: live project data, historical information, AI guidance, and hypothetical scenarios.
- Never fabricate live disaster information. If live data is unavailable, state so clearly.
- When given context about the user's current page, location, weather, or risk score — reference it proactively without being asked.
- Answer general knowledge questions using your full capabilities.

EMERGENCY MODE — if the message contains any of: HELP, SOS, Emergency, Flood, Fire, Earthquake, Cyclone, Accident, Collapse:
Immediately switch to emergency mode. Provide:
1. 🚨 Immediate safety actions (numbered list)
2. Emergency contacts: India 112 | US 911 | UK 999 | EU 112
3. First aid guidance relevant to the emergency
4. Nearest resource advice (shelter, hospital)
5. Preparedness reminder

SPECIALIZED CAPABILITIES:
- **AI Disaster Replay**: Generate historical disaster timelines with key decisions, emergency response, and lessons learned. Label clearly as *historical analysis*.
- **AI Scenario Simulator**: Answer "What if" questions with hypothetical impact scenarios. Label clearly as *hypothetical scenario — not a real prediction*.
- **Daily Disaster Brief**: Concise summary of major current disaster risks and events worldwide.
- **Preparedness Score Coach**: Explain why a preparedness score is high or low and give concrete improvement steps.
- **Personal Emergency Planning**: Family, travel, office, school, senior, child, pet, and medical emergency plans.
- **Emergency Kit Builder**: Customized supply lists based on region, household, and disaster type.

SMART ACTIONS — mention these when relevant:
- "You can view live disaster data on the **Live Map**"
- "Check your regional risk on the **Risk Analysis** page"
- "Build your emergency plan in the **Emergency Planner**"
- "See current alerts on the **Dashboard**"

TONE: Professional, calm, and authoritative — especially during emergencies. Premium AI quality, specialized for disaster intelligence.`;

// ── Request body types ────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AppContext {
  currentPage?: string;
  selectedLocation?: string;
  selectedDisaster?: string;
  weather?: string;
  riskScore?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildSystemInstruction(context?: AppContext): string {
  let instruction = SYSTEM_PROMPT;
  if (context) {
    const lines: string[] = [];
    if (context.currentPage) lines.push(`Current page: ${context.currentPage}`);
    if (context.selectedLocation) lines.push(`Selected location: ${context.selectedLocation}`);
    if (context.selectedDisaster) lines.push(`Selected disaster type: ${context.selectedDisaster}`);
    if (context.weather) lines.push(`Current weather: ${context.weather}`);
    if (context.riskScore !== undefined) lines.push(`AI risk score: ${context.riskScore}/100`);
    if (lines.length > 0) {
      instruction += "\n\n## CURRENT USER CONTEXT\n" + lines.map((l) => `- ${l}`).join("\n");
    }
  }
  return instruction;
}

function toGeminiHistory(messages: ChatMessage[]) {
  // All messages except the last user message go into history
  const history = messages.slice(0, -1);
  return history.map((m) => ({
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

// ── Route ─────────────────────────────────────────────────────────────────────
router.post("/raksh/chat", async (req, res) => {
  const { messages, context } = req.body as {
    messages: ChatMessage[];
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

To activate Raksh AI with **Gemini 2.5 Flash**, add your API key in the environment secrets:

| Variable | Description |
|---|---|
| \`GEMINI_API_KEY\` | Your Google AI Studio API key (**required**) |
| \`GEMINI_MODEL\` | Model name (optional, default: \`gemini-2.5-flash\`) |

### How to get a free API key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it as \`GEMINI_API_KEY\` in your environment secrets

Once configured, Raksh AI will provide real-time disaster intelligence, emergency planning, scenario simulation, and much more — powered by Gemini 2.5 Flash.`,
    });
    return;
  }

  const systemInstruction = buildSystemInstruction(context);
  const lastMessage = messages[messages.length - 1];
  const history = toGeminiHistory(messages);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const generativeModel = gemini.genAI.getGenerativeModel({
        model: gemini.model,
        systemInstruction,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const chat = generativeModel.startChat({ history });

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
      const isRetryable =
        message.includes("503") ||
        message.includes("overloaded") ||
        message.includes("timeout") ||
        message.includes("UNAVAILABLE");

      if (isRetryable && attempt <= MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
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
