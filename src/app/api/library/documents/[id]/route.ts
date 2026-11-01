import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა ანგარიშში შესვლა." }, { status: 401 });
  const { id } = await params;
  const document = await prisma.libraryDocument.findFirst({
    where: { id, userId: session.userId },
  });
  if (!document) return NextResponse.json({ error: "დოკუმენტი ვერ მოიძებნა." }, { status: 404 });

  return NextResponse.json(
    {
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        fileType: document.fileType,
        sourceLanguage: document.sourceLanguage,
        sourceText: document.sourceText,
        translatedText: document.translatedText,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა ანგარიშში შესვლა." }, { status: 401 });
  const { id } = await params;
  const result = await prisma.libraryDocument.deleteMany({ where: { id, userId: session.userId } });
  if (result.count === 0) return NextResponse.json({ error: "დოკუმენტი ვერ მოიძებნა." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
