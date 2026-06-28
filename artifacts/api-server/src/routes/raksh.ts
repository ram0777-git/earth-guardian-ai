import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function getLLMClient(): { client: OpenAI; model: string } | null {
  const apiKey = process.env["RAKSH_LLM_API_KEY"];
  if (!apiKey) return null;

  const baseURL = process.env["RAKSH_LLM_BASE_URL"];
  const model = process.env["RAKSH_LLM_MODEL"] ?? "gpt-4o-mini";

  const client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  return { client, model };
}

const SYSTEM_PROMPT = `You are Raksh AI, a premium disaster intelligence and emergency response copilot embedded in Earth Guardian AI — a real-time disaster monitoring platform.

Your expertise covers: earthquakes, floods, cyclones, wildfires, landslides, heatwaves, storms, tsunamis, drought, emergency preparedness, and climate awareness.

CORE BEHAVIORS:
- Be concise, direct, and highly informative
- Always distinguish between: live data, historical information, AI guidance, and hypothetical scenarios
- Never fabricate live information — clearly state when data is unavailable
- When given context about the user's current page/location/disaster, use it proactively
- Use markdown formatting: headers, bullet points, bold, tables, code blocks as appropriate
- For emergency keywords (HELP, SOS, Emergency, Fire, Flood, Earthquake, Cyclone, Accident, Collapse), immediately enter Emergency Mode and provide: immediate safety steps, emergency contacts (local emergency: 112 India / 911 US / 999 UK), nearby shelter advice, and emergency kit reminders

SPECIAL CAPABILITIES:
- AI Disaster Replay: Generate historical disaster timelines (label clearly as historical analysis)
- AI Scenario Simulator: Answer "what if" questions with hypothetical scenarios (label clearly as hypothetical)
- Daily Disaster Brief: Summarize major current disaster events
- Preparedness Score Coach: Explain preparedness scores and recommend improvements
- Personal Planning: Generate family, travel, office, school, and medical emergency plans
- Emergency Kit Generation: Create customized emergency supply lists

SMART ACTIONS (mention these when relevant):
- Suggest users navigate to Live Map, Dashboard, Risk Analysis, Emergency Planner
- Offer to generate preparedness checklists, evacuation plans, emergency kits

TONE: Professional, calm, authoritative — especially in emergencies. Premium AI assistant quality comparable to ChatGPT or Gemini, specialized for disaster intelligence.`;

router.post("/raksh/chat", async (req, res) => {
  const { messages, context } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    context?: {
      currentPage?: string;
      selectedLocation?: string;
      selectedDisaster?: string;
      weather?: string;
      riskScore?: number;
    };
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const llm = getLLMClient();
  if (!llm) {
    res.status(200).json({
      content: `## Raksh AI Setup Required

To activate Raksh AI, configure an LLM provider via environment variables:

\`\`\`
RAKSH_LLM_API_KEY=your-api-key
RAKSH_LLM_MODEL=gpt-4o-mini          # optional, defaults to gpt-4o-mini
RAKSH_LLM_BASE_URL=https://...       # optional, for custom endpoints
\`\`\`

**Supported providers:** OpenAI, Azure OpenAI, OpenRouter, Groq, Mistral, or any OpenAI-compatible API.

Once configured, Raksh AI will provide real-time disaster intelligence, emergency planning, and risk analysis.`,
    });
    return;
  }

  let systemContent = SYSTEM_PROMPT;
  if (context) {
    systemContent += "\n\n## CURRENT USER CONTEXT\n";
    if (context.currentPage) systemContent += `- Current page: ${context.currentPage}\n`;
    if (context.selectedLocation) systemContent += `- Selected location: ${context.selectedLocation}\n`;
    if (context.selectedDisaster) systemContent += `- Selected disaster type: ${context.selectedDisaster}\n`;
    if (context.weather) systemContent += `- Current weather: ${context.weather}\n`;
    if (context.riskScore !== undefined) systemContent += `- Current AI risk score: ${context.riskScore}/100\n`;
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await llm.client.chat.completions.create({
      model: llm.model,
      messages: [
        { role: "system", content: systemContent },
        ...messages,
      ],
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "LLM request failed";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
});

export default router;
