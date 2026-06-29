// Read key ONCE at module load — never per request
const API_KEY = process.env["OPENROUTER_API_KEY"];

export const openrouterKeyLoaded = !!API_KEY;

export async function callOpenRouter(
  systemInstruction: string,
  userMessage: string,
  timeoutMs: number,
): Promise<string> {
  if (!API_KEY) throw new Error("OpenRouter not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://earthguardian.ai",
        "X-Title": "Earth Guardian AI",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user",   content: userMessage },
        ],
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`OpenRouter ${resp.status}`);
    const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}
