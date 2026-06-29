// Lazy key resolution — read process.env on every call so secrets added
// after module load are always picked up after a server restart.
function getKey(): string | null {
  return process.env["GROQ_API_KEY"] ?? null;
}

export function groqKeyLoaded(): boolean {
  return !!getKey();
}

export function getGroqDiagnostics() {
  const key = getKey();
  return { envKeyPresent: !!key, envKeyLength: key?.length ?? 0 };
}

export async function callGroq(
  systemInstruction: string,
  userMessage: string,
  timeoutMs: number,
): Promise<string> {
  const key = getKey();
  if (!key) throw new Error("Groq not configured — GROQ_API_KEY not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
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
    if (!resp.ok) throw new Error(`Groq ${resp.status}: ${resp.statusText}`);
    const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}
