import assert from "node:assert/strict";
import { AiProviderError, generateAiText } from "../src/lib/ai/generateText";

const originalFetch = globalThis.fetch;
const environmentKeys = ["OPENROUTER_API_KEY", "OPENROUTER_MODEL", "GROQ_API_KEY", "GROQ_MODEL"] as const;
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
const longAnswer = "ეს არის სრულყოფილი ქართული ასტროლოგიური განმარტება კონკრეტული რუკის მონაცემებზე დაყრდნობით. ".repeat(20);

function setEnvironment(values: Partial<Record<typeof environmentKeys[number], string | undefined>>) {
  for (const key of environmentKeys) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function completion(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function run() {
  try {
    setEnvironment({ OPENROUTER_API_KEY: "test-openrouter", GROQ_API_KEY: "test-groq" });
    const requests: string[] = [];
    globalThis.fetch = async (input, init) => {
      requests.push(String(input));
      const request = JSON.parse(String(init?.body)) as { model: string };
      assert.equal(request.model, "openrouter/free");
      return completion(longAnswer);
    };
    const openRouter = await generateAiText("system", "chart facts");
    assert.match(openRouter.provider, /^OpenRouter/);
    assert.equal(requests.length, 1, "the preferred provider is used first");

    requests.length = 0;
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return requests.length === 1
        ? new Response("", { status: 429 })
        : completion(longAnswer);
    };
    const fallback = await generateAiText("system", "chart facts");
    assert.match(fallback.provider, /^Groq/);
    assert.deepEqual(requests, [
      "https://openrouter.ai/api/v1/chat/completions",
      "https://api.groq.com/openai/v1/chat/completions",
    ]);

    requests.length = 0;
    setEnvironment({
      OPENROUTER_API_KEY: "test-openrouter",
      OPENROUTER_MODEL: "openai/gpt-oss-120b",
      GROQ_API_KEY: "test-groq",
    });
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return completion(longAnswer);
    };
    const paidModelFallback = await generateAiText("system", "chart facts");
    assert.match(paidModelFallback.provider, /^Groq/);
    assert.deepEqual(requests, ["https://api.groq.com/openai/v1/chat/completions"]);

    setEnvironment({});
    await assert.rejects(
      () => generateAiText("system", "chart facts"),
      (error: unknown) => error instanceof AiProviderError && error.status === 503,
    );
    console.log("AI provider validation passed");
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of environmentKeys) {
      const value = originalEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

void run();
