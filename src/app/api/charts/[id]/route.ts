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

  return NextResponse.json({
    ...chart,
    result: JSON.parse(chart.resultJson),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა შესვლა" }, { status: 401 });

  const chart = await prisma.chart.findUnique({ where: { id: params.id } });
  if (!chart) return NextResponse.json({ error: "რუკა ვერ მოიძებნა" }, { status: 404 });
  if (chart.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }

  await prisma.chart.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
