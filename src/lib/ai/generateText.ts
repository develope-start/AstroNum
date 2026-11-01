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
const MINIMUM_RESPONSE_WORDS = 180;
const REPEATED_WORDS = new Set(["რომ", "რომელიც", "რომლის", "რომლებიც", "არის", "იყო", "აქვს", "მისი", "მათი", "შენი", "თქვენი", "this", "that", "with", "from", "your", "their"]);

type ProviderFailure = {
  provider: ProviderConfig["name"];
  reason: "rate-limit" | "timeout" | "http" | "quality";
  status?: number;
  detail?: string;
};

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

function responseIsUsable(text: string): boolean {
  if (text.length < MINIMUM_RESPONSE_LENGTH) return false;
  const words = text.match(/\p{L}+/gu) ?? [];
  if (words.length < MINIMUM_RESPONSE_WORDS) return false;

  const normalizedWords = words.map((word) => word.toLocaleLowerCase("ka"));
  const uniqueRatio = new Set(normalizedWords).size / normalizedWords.length;
  if (uniqueRatio < 0.3) return false;

  const meaningfulWords = normalizedWords.filter((word) => word.length >= 5 && !REPEATED_WORDS.has(word));
  const counts = new Map<string, number>();
  for (const word of meaningfulWords) counts.set(word, (counts.get(word) ?? 0) + 1);
  const repeatedWordLimit = Math.max(10, Math.floor(normalizedWords.length * 0.04));
  if ([...counts.values()].some((count) => count > repeatedWordLimit)) return false;

  let repeatedRun = 1;
  for (let index = 1; index < normalizedWords.length; index += 1) {
    repeatedRun = normalizedWords[index] === normalizedWords[index - 1] ? repeatedRun + 1 : 1;
    if (repeatedRun >= 3) return false;
  }

  const paragraphs = text.split(/\n\s*\n/).map((paragraph) =>
    paragraph.replace(/[#*_`>-]/g, "").replace(/\s+/g, " ").trim().toLocaleLowerCase("ka"),
  ).filter((paragraph) => paragraph.length >= 100);
  if (new Set(paragraphs).size !== paragraphs.length) return false;

  const letters = text.match(/\p{L}/gu) ?? [];
  const georgianLetters = text.match(/[\u10A0-\u10FF]/g) ?? [];
  return letters.length > 0 && georgianLetters.length / letters.length >= 0.55;
}

async function providerErrorDetail(response: Response): Promise<string | undefined> {
  const retryAfter = response.headers.get("retry-after");
  let message: string | undefined;
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object") {
      const error = (payload as { error?: unknown }).error;
      if (error && typeof error === "object") {
        const detail = error as { message?: unknown; code?: unknown; type?: unknown };
        message = [detail.code, detail.type, detail.message]
          .filter((value): value is string => typeof value === "string")
          .join(": ");
      } else if (typeof error === "string") {
        message = error;
      }
    }
  } catch {
    message = undefined;
  }
  const sanitizedMessage = message
    ?.replace(/Bearer\s+\S+/gi, "[credential]")
    .replace(/(?:sk-or-v1-|gsk_)[A-Za-z0-9_-]+/g, "[credential]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 160);
  const retrySeconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : undefined;
  return [
    sanitizedMessage,
    retrySeconds && retrySeconds <= 86_400 ? `ხელახლა ცდა ${retrySeconds} წმ-ში` : undefined,
  ].filter(Boolean).join("; ") || undefined;
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

  const failures: ProviderFailure[] = [];
  for (const provider of providers) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), provider.name === "OpenRouter" ? 32_000 : 18_000);
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
          max_tokens: 3_200,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await providerErrorDetail(response);
        failures.push({
          provider: provider.name,
          reason: response.status === 429 ? "rate-limit" : "http",
          status: response.status,
          detail,
        });
        console.warn(`${provider.name} astrology interpretation failed`, {
          status: response.status,
          model: provider.model,
          detail,
        });
        continue;
      }

      const payload: unknown = await response.json();
      const text = extractText(payload);
      if (!responseIsUsable(text)) {
        failures.push({ provider: provider.name, reason: "quality" });
        console.warn(`${provider.name} returned an unusable astrology interpretation`, {
          model: provider.model,
          characters: text.length,
          words: text.match(/\p{L}+/gu)?.length ?? 0,
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
  const qualityFailures = failures.filter((failure) => failure.reason === "quality");
  const failureDetails = failures.map((failure) => {
    if (failure.reason === "timeout") return `${failure.provider}: პასუხის დრო ამოიწურა`;
    if (failure.reason === "rate-limit") return `${failure.provider}: HTTP 429${failure.detail ? ` (${failure.detail})` : ""}`;
    if (failure.reason === "quality") return `${failure.provider}: პასუხი არასრული ან განმეორებადი იყო`;
    return `${failure.provider}: HTTP ${failure.status ?? "შეცდომა"}${failure.detail ? ` (${failure.detail})` : ""}`;
  });
  if (rateLimited.length || timedOut.length || qualityFailures.length) {
    const allRateLimited = rateLimited.length === providers.length;
    const allQualityFailed = qualityFailures.length === providers.length;
    throw new AiProviderError(
      `${failureDetails.join("; ")}. ${allRateLimited
        ? "უფასო პროვაიდერების კვოტა/ლიმიტი ამჟამად ამოწურულია; შეამოწმეთ მათი Usage/Rate Limits ან სცადეთ მოგვიანებით."
        : allQualityFailed
          ? "უხარისხო ტექსტი არ გამოვაჩინეთ. სცადეთ მოგვიანებით, როცა პროვაიდერი სრულ პასუხს დააბრუნებს."
          : "შედეგის მისაღებად შეამოწმეთ პროვაიდერის კვოტა ან სცადეთ მოგვიანებით."}`,
      allRateLimited ? 429 : 502,
    );
  }

  throw new AiProviderError(
    "OpenRouter-მა და Groq-მა სრული ინტერპრეტაცია ვერ დააბრუნეს. სცადეთ ხელახლა.",
    502,
  );
}
