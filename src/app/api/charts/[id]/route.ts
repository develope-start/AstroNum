import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა შესვლა" }, { status: 401 });

  const chart = await prisma.chart.findUnique({ where: { id: params.id } });
  if (!chart) return NextResponse.json({ error: "რუკა ვერ მოიძებნა" }, { status: 404 });

  // მხოლოდ პატრონს ან ადმინს შეუძლია ნახვა
  if (chart.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }

  let result: unknown;
  try {
    result = JSON.parse(chart.resultJson);
  } catch {
    return NextResponse.json({ error: "რუკის შედეგის მონაცემები დაზიანებულია" }, { status: 422 });
  }

  return NextResponse.json({ ...chart, result });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა შესვლა" }, { status: 401 });

  // Deletion only needs ownership information. Keep this select explicit so
  // it does not depend on optional chart columns added in later migrations.
  const chart = await prisma.chart.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });
  if (!chart) return NextResponse.json({ error: "რუკა ვერ მოიძებნა" }, { status: 404 });
  if (chart.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }

  const owner = await prisma.user.findUnique({ where: { id: chart.userId }, select: { email: true } });
  try {
    await prisma.chart.delete({ where: { id: params.id } });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as any).code : null;
    if (code === "P2025") {
      return NextResponse.json({ ok: true, message: "რუკა უკვე წაშლილია" });
    }
    return NextResponse.json({ error: "რუკის წაშლა ვერ მოხერხდა" }, { status: 500 });
  }
  try {
    await prisma.accountEvent.create({
      data: {
        userId: chart.userId,
        type: `CHART_DELETED:${chart.id}`,
        emailSnapshot: owner?.email ?? session.email,
      },
    });
  } catch {
    console.error("Chart deletion status could not be stored");
  }
  return NextResponse.json({ ok: true });
}
