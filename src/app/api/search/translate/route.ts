import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { translateDocumentChunk } from "@/lib/documents/translate";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ text: z.string().trim().min(1).max(2_800) });

export async function POST(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა ანგარიშში შესვლა." }, { status: 401 });
  const limiter = rateLimit(getRateLimitKey(req, "web-search:translate", session.userId), 30, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "თარგმნის სიჩქარის ლიმიტი ამოიწურა. სცადეთ ერთ წუთში." }, {
      status: 429,
      headers: { "Retry-After": String(limiter.retryAfterSeconds) },
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "თარგმნის ტექსტი არასწორია." }, { status: 400 });

  try {
    const translatedText = await translateDocumentChunk(session.userId, parsed.data.text, "auto");
    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Web result translation failed", error instanceof Error ? error.message : error);
    const unavailable = error instanceof Error && error.message.includes("ჯერ არ არის კონფიგურირებული");
    return NextResponse.json({
      error: error instanceof Error ? error.message : "თარგმნა ვერ მოხერხდა.",
    }, { status: unavailable ? 503 : 502 });
  }
}
