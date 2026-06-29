// Lazy key resolution — read process.env on every call so secrets added
// after module load are always picked up after a server restart.
function getKey(): string | null {
  return process.env["OPENROUTER_API_KEY"] ?? null;
}

export function openrouterKeyLoaded(): boolean {
  return !!getKey();
}

export function getOpenRouterDiagnostics() {
  const key = getKey();
  return { envKeyPresent: !!key, envKeyLength: key?.length ?? 0 };
}

export async function callOpenRouter(
  systemInstruction: string,
  userMessage: string,
  timeoutMs: number,
): Promise<string> {
  const key = getKey();
  if (!key) throw new Error("OpenRouter not configured — OPENROUTER_API_KEY not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
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
    if (!resp.ok) throw new Error(`OpenRouter ${resp.status}: ${resp.statusText}`);
    const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}
