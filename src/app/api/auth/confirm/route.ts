import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ACTION_TYPES, getValidActionToken, parseTokenPayload } from "@/lib/actionTokens";
import { asRole, SESSION_COOKIE, signSession } from "@/lib/auth";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "დადასტურების ბმული არასწორია" }, { status: 400 });

  const actionToken = await getValidActionToken(parsed.data.token);
  if (!actionToken || !actionToken.userId) {
    return NextResponse.json({ error: "ბმული ვადაგასულია ან უკვე გამოყენებულია" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: actionToken.userId } });
  if (!user) return NextResponse.json({ error: "მომხმარებელი ვერ მოიძებნა" }, { status: 404 });
  const payload = parseTokenPayload(actionToken.payload);

  if (actionToken.type === ACTION_TYPES.EMAIL_CHANGE) {
    const newEmail = payload.newEmail?.trim().toLowerCase();
    if (!newEmail) return NextResponse.json({ error: "ცვლილების მონაცემები ვერ მოიძებნა" }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== user.id) return NextResponse.json({ error: "ამ ელფოსტით ანგარიში უკვე არსებობს" }, { status: 409 });

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { email: newEmail } }),
      prisma.accountEvent.create({ data: { userId: user.id, type: "EMAIL_CHANGED", emailSnapshot: newEmail, oldEmail: user.email, newEmail } }),
      prisma.actionToken.update({ where: { id: actionToken.id }, data: { usedAt: new Date() } }),
    ]);
    const response = NextResponse.json({ message: "ელფოსტა წარმატებით შეიცვალა" });
    response.cookies.set(SESSION_COOKIE, signSession({ userId: user.id, email: newEmail, role: asRole(user.role) }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  if (actionToken.type === ACTION_TYPES.PASSWORD_CHANGE) {
    if (!payload.passwordHash) return NextResponse.json({ error: "ცვლილების მონაცემები ვერ მოიძებნა" }, { status: 400 });
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: payload.passwordHash } }),
      prisma.accountEvent.create({ data: { userId: user.id, type: "PASSWORD_CHANGED", emailSnapshot: user.email } }),
      prisma.actionToken.update({ where: { id: actionToken.id }, data: { usedAt: new Date() } }),
    ]);
    return NextResponse.json({ message: "პაროლი წარმატებით შეიცვალა" });
  }

  if (actionToken.type === ACTION_TYPES.ACCOUNT_DELETE) {
    const chartCount = await prisma.chart.count({ where: { userId: user.id } });
    const deletedChartEvent = await prisma.accountEvent.findFirst({
      where: { userId: user.id, type: { startsWith: "CHART_DELETED" } },
      select: { id: true },
    });
    const deletionType = chartCount > 0 || Boolean(deletedChartEvent)
      ? "ACCOUNT_AND_CHARTS_DELETED"
      : "ACCOUNT_DELETED";

    await prisma.$transaction(async (tx) => {
      await tx.actionToken.update({ where: { id: actionToken.id }, data: { usedAt: new Date() } });
      await tx.accountEvent.deleteMany({ where: { userId: user.id, type: { startsWith: "CHART_DELETED" } } });
      await tx.accountEvent.create({ data: { userId: user.id, type: deletionType, emailSnapshot: user.email } });
      await tx.user.delete({ where: { id: user.id } });
    });
    const response = NextResponse.json({ message: "კაბინეტი წაიშალა" });
    response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  return NextResponse.json({ error: "დადასტურების ტიპი უცნობია" }, { status: 400 });
}
