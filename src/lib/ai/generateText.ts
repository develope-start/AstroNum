export interface GeneratedAiText {
  text: string;
  provider: string;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

interface ProviderConfig {
  name: "OpenRouter" | "Groq";
  key: string;
  model: string;
  endpoint: string;
}

const MINIMUM_RESPONSE_LENGTH = 900;

function providerConfigs(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openRouterModel = process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";
  if (openRouterKey) {
    if (openRouterModel === "openrouter/free" || openRouterModel.endsWith(":free")) {
      providers.push({
        name: "OpenRouter",
        key: openRouterKey,
        model: openRouterModel,
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
      });
    } else {
      console.error("OpenRouter AI model must use the free router or a :free model.");
    }
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    providers.push({
      name: "Groq",
      key: groqKey,
      model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
    });
  }
  return providers;
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return "";
  const message = (choices[0] as { message?: { content?: unknown } } | undefined)?.message;
  const content = message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
        ? (part as { text: string }).text
        : "")
      .join("")
      .trim();
  }
  return "";
}

export async function generateAiText(
  systemPrompt: string,
  userPrompt: string,
): Promise<GeneratedAiText> {
  const providers = providerConfigs();
  if (!providers.length) {
    throw new AiProviderError(
      "AI ინტერპრეტაციისთვის სერვერზე დაამატეთ OPENROUTER_API_KEY ან GROQ_API_KEY.",
      503,
    );
  }

  const failures: Array<{ provider: ProviderConfig["name"]; reason: "rate-limit" | "timeout" | "http" | "short" }> = [];
  for (const provider of providers) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.key}`,
          "Content-Type": "application/json",
          ...(provider.name === "OpenRouter"
            ? {
              "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://astro-num.vercel.app",
              "X-OpenRouter-Title": "AstroNum",
            }
            : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.35,
          max_tokens: 5_500,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        failures.push({ provider: provider.name, reason: response.status === 429 ? "rate-limit" : "http" });
        console.warn(`${provider.name} astrology interpretation failed`, {
          status: response.status,
          model: provider.model,
        });
        continue;
      }

      const payload: unknown = await response.json();
      const text = extractText(payload);
      if (text.length < MINIMUM_RESPONSE_LENGTH) {
        failures.push({ provider: provider.name, reason: "short" });
        console.warn(`${provider.name} returned a short astrology interpretation`, {
          model: provider.model,
          characters: text.length,
        });
        continue;
      }
      return { text, provider: `${provider.name} · ${provider.model}` };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        failures.push({ provider: provider.name, reason: "timeout" });
      } else {
        failures.push({ provider: provider.name, reason: "http" });
      }
      console.warn(`${provider.name} astrology interpretation request failed`, error instanceof Error ? error.name : "unknown error");
    } finally {
      clearTimeout(timeout);
    }
  }

  const rateLimited = failures.filter((failure) => failure.reason === "rate-limit");
  const timedOut = failures.filter((failure) => failure.reason === "timeout");
  if (rateLimited.length || timedOut.length) {
    const details = [
      timedOut.length ? `პასუხის დრო ამოეწურა: ${timedOut.map((failure) => failure.provider).join(", ")}` : "",
      rateLimited.length ? `429 მოთხოვნის ლიმიტი დააბრუნა: ${rateLimited.map((failure) => failure.provider).join(", ")}` : "",
    ].filter(Boolean).join("; ");
    const allRateLimited = rateLimited.length === providers.length;
    throw new AiProviderError(
      `${details}. ${allRateLimited
        ? "მოგვიანებით სცადეთ ხელახლა."
        : "შეამოწმეთ მითითებული პროვაიდერის Usage/Rate Limits ან მოგვიანებით სცადეთ."}`,
      allRateLimited ? 429 : 502,
    );
  }

  throw new AiProviderError(
    "OpenRouter-მა და Groq-მა სრული ინტერპრეტაცია ვერ დააბრუნეს. სცადეთ ხელახლა.",
    502,
  );
}
