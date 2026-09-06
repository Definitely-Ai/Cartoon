import { PublishError } from "./githubPublish";

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

/**
 * The API token.
 */
export function openRouterToken(): string {
  const token = process.env.OPENROUTER_API_KEY;
  if (!token) {
    throw new PublishError(
      500,
      "No OpenRouter token found. Add OPENROUTER_API_KEY under Settings → Environment Variables and redeploy."
    );
  }
  return token;
}

/** The writers' room's model. Text in, text out. */
export async function generateText(
  model: string,
  input: Record<string, unknown>,
  timeoutMs = 150_000
): Promise<string> {
  const messages = [];
  if (input.system_prompt) {
    messages.push({ role: "system", content: input.system_prompt as string });
  }
  if (input.prompt) {
    messages.push({ role: "user", content: input.prompt as string });
  }

  const payload: Record<string, unknown> = {
    model: model,
    messages: messages,
  };

  if (input.max_completion_tokens) {
    payload.max_tokens = input.max_completion_tokens;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterToken()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "The Swinging Door"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new PublishError(
        502,
        `OpenRouter said ${res.status} starting the writer: ${(await res.text().catch(() => "")).slice(0, 200)}`
      );
    }

    const data = await res.json();
    if (!data.choices || data.choices.length === 0) {
      throw new PublishError(502, "The writer returned nothing.");
    }

    return data.choices[0].message?.content || "";
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new PublishError(504, "The writer is taking too long — try again.");
    }
    if (error instanceof PublishError) throw error;
    throw new PublishError(502, `The writer failed: ${error.message}`);
  }
}
