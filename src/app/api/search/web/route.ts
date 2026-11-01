import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { reserveWebSearchRequest } from "@/lib/searchQuota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ query: z.string().trim().min(2).max(300) });
const tavilyResponseSchema = z.object({
  results: z.array(z.object({
    title: z.string().optional(),
    url: z.string().url(),
    content: z.string().optional(),
    raw_content: z.string().nullable().optional(),
    score: z.number().optional(),
    published_date: z.string().nullable().optional(),
  })).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა ანგარიშში შესვლა." }, { status: 401 });

  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ვებ-ძიება ჯერ არ არის კონფიგურირებული. Vercel-ში დაამატეთ TAVILY_API_KEY." }, { status: 503 });
  }

  const limiter = rateLimit(getRateLimitKey(req, "web-search", session.userId), 5, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "ძიების ლიმიტი ამოიწურა. სცადეთ ერთ წუთში." }, {
      status: 429,
      headers: { "Retry-After": String(limiter.retryAfterSeconds) },
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "შეიყვანეთ საძიებო სიტყვა (2-300 სიმბოლო)." }, { status: 400 });

  try {
    const reserved = await reserveWebSearchRequest();
    if (!reserved) {
      return NextResponse.json({ error: "ამ თვის უფასო ვებ-ძიების უსაფრთხოების ლიმიტი ამოიწურა." }, { status: 429 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query: parsed.data.query,
          search_depth: "basic",
          topic: "general",
          max_results: 5,
          include_answer: false,
          include_raw_content: "text",
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error("Tavily search returned an error", { status: response.status });
      return NextResponse.json({ error: "ვებ-ძიების სერვისი დროებით მიუწვდომელია." }, { status: 502 });
    }

    const payload = tavilyResponseSchema.safeParse(await response.json());
    if (!payload.success) {
      console.error("Tavily search returned an unexpected response shape");
      return NextResponse.json({ error: "ძიების შედეგების დამუშავება ვერ მოხერხდა." }, { status: 502 });
    }

    const results = (payload.data.results ?? []).flatMap((item) => {
      const url = new URL(item.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      const content = (item.raw_content?.trim() || item.content?.trim() || "")
        .replace(/\u0000/g, "");
      if (!content) return [];
      return [{
        title: item.title?.trim().slice(0, 300) || url.hostname,
        url: url.toString(),
        content: content.slice(0, 6_000),
        truncated: content.length > 6_000,
        score: item.score ?? null,
        publishedDate: item.published_date ?? null,
      }];
    });

    return NextResponse.json(
      {
        query: parsed.data.query,
        results,
        translationAvailable: Boolean(
          process.env.OPENROUTER_API_KEY?.trim() ||
          process.env.GROQ_API_KEY?.trim() ||
          process.env.GEMINI_API_KEY?.trim() ||
          process.env.LIBRETRANSLATE_URL?.trim(),
        ),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "ვებ-ძიების მოთხოვნას დრო ამოეწურა. სცადეთ ხელახლა." }, { status: 504 });
    }
    console.error("Web search failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "ძიების მოთხოვნა ვერ შესრულდა." }, { status: 502 });
  }
}
