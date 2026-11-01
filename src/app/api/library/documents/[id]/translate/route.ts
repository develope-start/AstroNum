import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { splitDocumentText } from "@/lib/documents/extract";
import { translateDocumentChunk } from "@/lib/documents/translate";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ chunkIndex: z.number().int().min(0).max(100) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა ანგარიშში შესვლა." }, { status: 401 });
  const limit = rateLimit(getRateLimitKey(req, "document:translate", session.userId), 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "თარგმნის სიჩქარის ლიმიტი ამოიწურა. სცადეთ ერთ წუთში." }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "თარგმნის მოთხოვნა არასწორია." }, { status: 400 });
  const { id } = await params;
  const document = await prisma.libraryDocument.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, sourceLanguage: true, sourceText: true, translatedChunksJson: true },
  });
  if (!document) return NextResponse.json({ error: "დოკუმენტი ვერ მოიძებნა." }, { status: 404 });

  const chunks = splitDocumentText(document.sourceText);
  const { chunkIndex } = parsed.data;
  if (chunkIndex >= chunks.length) return NextResponse.json({ error: "თარგმნის ნაწილი ვერ მოიძებნა." }, { status: 400 });

  let translatedChunks: Array<string | null>;
  try {
    const saved = JSON.parse(document.translatedChunksJson) as unknown;
    translatedChunks = Array.isArray(saved) && saved.length === chunks.length
      ? saved.map((part) => typeof part === "string" ? part : null)
      : Array.from({ length: chunks.length }, () => null);
  } catch {
    translatedChunks = Array.from({ length: chunks.length }, () => null);
  }

  try {
    translatedChunks[chunkIndex] ??= await translateDocumentChunk(
      session.userId,
      chunks[chunkIndex],
      document.sourceLanguage,
    );
    const completed = translatedChunks.every((part) => typeof part === "string");
    const translatedText = completed ? (translatedChunks as string[]).join("\n\n") : null;
    await prisma.libraryDocument.update({
      where: { id: document.id },
      data: {
        translatedChunksJson: JSON.stringify(translatedChunks),
        ...(translatedText !== null ? { translatedText } : {}),
      },
    });

    return NextResponse.json({
      chunkIndex,
      totalChunks: chunks.length,
      completedChunks: translatedChunks.filter((part) => typeof part === "string").length,
      translatedText,
      chunkText: translatedChunks[chunkIndex],
    });
  } catch (error) {
    console.error("Document chunk translation failed", error instanceof Error ? error.message : error);
    const unavailable = error instanceof Error && error.message.includes("ჯერ არ არის კონფიგურირებული");
    return NextResponse.json({
      error: error instanceof Error ? error.message : "თარგმნა ვერ მოხერხდა.",
    }, { status: unavailable ? 503 : 502 });
  }
}
