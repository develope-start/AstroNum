import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";
import { getActiveSessionFromRequest, verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { calculationWithoutInterpretationSelect } from "@/lib/calculationSelect";

const schema = z.object({ currentPassword: z.string().min(1) });

function archiveArray(value: string | null | undefined) {
  try {
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
    return NextResponse.json({ error: "მთავარი ადმინისტრატორის კაბინეტის წაშლა შეუძლებელია" }, { status: 403 });
  }

  if (isPrimaryAdmin) {
    const deletionType = user.charts.length > 0 || user.accountEvents.some((event) => event.type.startsWith("CHART_DELETED"))
      ? "ACCOUNT_AND_CHARTS_DELETED"
      : "ACCOUNT_DELETED";

    await prisma.$transaction(async (tx) => {
      await tx.accountEvent.create({ data: { userId: user.id, type: deletionType, emailSnapshot: user.email } });
      const accountEvents = await tx.accountEvent.findMany({ where: { userId: user.id } });
      const previous = await tx.deletedUser.findUnique({ where: { email: user.email } });
      const charts = [...archiveArray(previous?.chartsJson), ...user.charts];
      const calculations = [...archiveArray(previous?.calculationsJson), ...user.calculations];
      const previousEvents = archiveArray(previous?.accountEventsJson);
      const mergedEvents = [...previousEvents, ...accountEvents];

      for (const calculation of user.calculations) {
        await tx.deletedCalculation.upsert({
          where: { originalId: calculation.id },
          create: {
            originalId: calculation.id,
            type: calculation.type,
            summary: `${calculation.name1} · ${formatWideDateDisplay(calculation.date1)} · ${calculation.place1}`,
            dataJson: JSON.stringify({ ...calculation, ownerEmail: user.email }),
          },
          update: {
            type: calculation.type,
            summary: `${calculation.name1} · ${formatWideDateDisplay(calculation.date1)} · ${calculation.place1}`,
            dataJson: JSON.stringify({ ...calculation, ownerEmail: user.email }),
            deletedAt: new Date(),
          },
        });
      }

      if (previous) {
        await tx.deletedUser.update({
          where: { id: previous.id },
          data: {
            publicId: user.publicId,
            adminId: user.adminId,
            name: user.name,
            username: user.username,
            passwordHash: user.passwordHash,
            role: user.role,
            originalCreatedAt: previous.originalCreatedAt < user.createdAt ? previous.originalCreatedAt : user.createdAt,
            deletedAt: new Date(),
            chartsJson: JSON.stringify(charts),
            calculationsJson: JSON.stringify(calculations),
            accountEventsJson: JSON.stringify(mergedEvents),
          },
        });
      } else {
        await tx.deletedUser.create({
          data: {
            id: user.id,
            publicId: user.publicId,
            adminId: user.adminId,
            name: user.name,
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role,
            originalCreatedAt: user.createdAt,
            chartsJson: JSON.stringify(charts),
            calculationsJson: JSON.stringify(calculations),
            accountEventsJson: JSON.stringify(mergedEvents),
          },
        });
      }

      await tx.chart.deleteMany({ where: { userId: user.id } });
      await tx.calculation.deleteMany({ where: { userId: user.id } });
      await tx.actionToken.deleteMany({ where: { userId: user.id } });
      await tx.accountEvent.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
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
