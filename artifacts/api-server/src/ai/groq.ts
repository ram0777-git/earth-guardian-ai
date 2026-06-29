// Read key ONCE at module load — never per request
const API_KEY = process.env["GROQ_API_KEY"];

export const groqKeyLoaded = !!API_KEY;

export async function callGroq(
  systemInstruction: string,
  userMessage: string,
  timeoutMs: number,
): Promise<string> {
  if (!API_KEY) throw new Error("Groq not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user",   content: userMessage },
        ],
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`Groq ${resp.status}`);
    const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}
