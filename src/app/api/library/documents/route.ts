import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DocumentInputError, extractDocumentText, MAX_DOCUMENT_BYTES } from "@/lib/documents/extract";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა ანგარიშში შესვლა." }, { status: 401 });

  const documents = await prisma.libraryDocument.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      fileName: true,
      fileType: true,
      sourceLanguage: true,
      translatedText: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ documents }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა ანგარიშში შესვლა." }, { status: 401 });
  const limit = rateLimit(getRateLimitKey(req, "document:upload", session.userId), 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "ატვირთვის ლიმიტი ამოიწურა. სცადეთ მოგვიანებით." }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  try {
    const documentCount = await prisma.libraryDocument.count({ where: { userId: session.userId } });
    if (documentCount >= 100) {
      return NextResponse.json({ error: "ბიბლიოთეკაში მაქსიმუმ 100 დოკუმენტის შენახვა შეგიძლიათ." }, { status: 409 });
    }
    const formData = await req.formData();
    const file = formData.get("file");
    const language = z.enum(["en", "ru"]).safeParse(formData.get("sourceLanguage"));
    if (!(file instanceof File)) return NextResponse.json({ error: "აირჩიეთ ფაილი." }, { status: 400 });
    if (!language.success) return NextResponse.json({ error: "აირჩიეთ წყარო ენა." }, { status: 400 });
    if (file.size === 0 || file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "ფაილი ცარიელია ან დასაშვებ ზომას (3.5 MB) აღემატება." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractDocumentText(file.name, buffer);
    const safeFileName = file.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 180) || "document";
    const title = safeFileName.replace(/\.[^.]+$/, "").slice(0, 180) || "უსახელო დოკუმენტი";
    const document = await prisma.libraryDocument.create({
      data: {
        userId: session.userId,
        title,
        fileName: safeFileName,
        fileType: extracted.type,
        sourceLanguage: language.data,
        sourceText: extracted.text,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        sourceLanguage: true,
        translatedText: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ document, characterCount: extracted.text.length }, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Document upload failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "დოკუმენტის შენახვა ვერ მოხერხდა." }, { status: 500 });
  }
}
