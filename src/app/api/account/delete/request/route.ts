import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest, verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { calculationWithoutInterpretationSelect } from "@/lib/calculationSelect";

const schema = z.object({ currentPassword: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა შესვლა" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "მიმდინარე პაროლი აუცილებელია" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      publicId: true,
      adminId: true,
      name: true,
      username: true,
      email: true,
      passwordHash: true,
      role: true,
      createdAt: true,
      charts: true,
      calculations: { select: calculationWithoutInterpretationSelect },
      accountEvents: true,
    },
  });

  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "მიმდინარე პაროლი არასწორია" }, { status: 400 });
  }

  const isPrimaryAdmin = user.role === "ADMIN" && user.adminId === "ADMIN";

  if (isPrimaryAdmin) {
    // მთავარი ადმინის შემთხვევაში არსად არ გადადის (ურნაში არ გადადის), იშლება მთლიანად
    await prisma.$transaction([
      prisma.chart.deleteMany({ where: { userId: user.id } }),
      prisma.calculation.deleteMany({ where: { userId: user.id } }),
      prisma.actionToken.deleteMany({ where: { userId: user.id } }),
      prisma.accountEvent.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
  } else {
    // ჩვეულებრივი იუზერის შემთხვევაში გადადის წაშლილი ანგარიშების ურნაში (DeletedUser)
    const chartCount = await prisma.chart.count({ where: { userId: user.id } });
    const deletedChartEvent = await prisma.accountEvent.findFirst({
      where: { userId: user.id, type: { startsWith: "CHART_DELETED" } },
      select: { id: true },
    });
    const deletionType = chartCount > 0 || Boolean(deletedChartEvent)
      ? "ACCOUNT_AND_CHARTS_DELETED"
      : "ACCOUNT_DELETED";

    await prisma.$transaction(async (tx) => {
      await tx.accountEvent.deleteMany({ where: { userId: user.id, type: { startsWith: "CHART_DELETED" } } });
      await tx.accountEvent.create({ data: { userId: user.id, type: deletionType, emailSnapshot: user.email } });
      const accountEvents = await tx.accountEvent.findMany({ where: { userId: user.id } });

      await tx.deletedUser.upsert({
        where: { email: user.email },
        create: {
          id: user.id,
          publicId: user.publicId,
          adminId: user.adminId,
          name: user.name,
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          originalCreatedAt: user.createdAt,
          chartsJson: JSON.stringify(user.charts),
          calculationsJson: JSON.stringify(user.calculations),
          accountEventsJson: JSON.stringify(accountEvents),
        },
        update: {
          publicId: user.publicId,
          adminId: user.adminId,
          name: user.name,
          username: user.username,
          passwordHash: user.passwordHash,
          role: user.role,
          chartsJson: JSON.stringify(user.charts),
          calculationsJson: JSON.stringify(user.calculations),
          accountEventsJson: JSON.stringify(accountEvents),
        },
      });

      await tx.calculation.deleteMany({ where: { userId: user.id } });
      await tx.chart.deleteMany({ where: { userId: user.id } });
      await tx.actionToken.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  }

  const response = NextResponse.json({ ok: true, message: "ანგარიში წარმატებით წაიშალა", selfDeleted: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0,
  });
  return response;
}
