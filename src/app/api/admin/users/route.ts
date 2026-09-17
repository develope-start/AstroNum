import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { groupGuestCalculations } from "@/lib/calculationHistory";
import { ensureAdminIds } from "@/lib/publicIds";

// ადმინის პანელი: ყველა რეგისტრირებული მომხმარებელი და მათ მიერ შენახული ყველა რუკის
// შესაყვანი მონაცემები (სახელი, დაბადების თარიღი/დრო/ადგილი). მხოლოდ role === "ADMIN"-ისთვის.
export async function GET(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია — მხოლოდ ადმინისთვის" }, { status: 403 });
  }

  await ensureAdminIds();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      publicId: true,
      adminId: true,
      name: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      charts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          label: true,
          name1: true,
          date1: true,
          time1: true,
          place1: true,
          name2: true,
          date2: true,
          time2: true,
          place2: true,
          transitDate: true,
          houseSystem: true,
          createdAt: true,
        },
      },
    },
  });

  const [allCalculations, savedCharts] = await Promise.all([
    prisma.calculation.findMany({
      orderBy: { createdAt: "desc" },
      select: {
      id: true,
      publicId: true,
      userId: true,
      saved: true,
      type: true,
      name1: true,
      date1: true,
      time1: true,
      place1: true,
      lat1: true,
      lon1: true,
      tz1: true,
      name2: true,
      date2: true,
      time2: true,
      place2: true,
      lat2: true,
      lon2: true,
      tz2: true,
      transitDate: true,
      houseSystem: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      updatedAt: true,
        user: { select: { email: true, username: true, publicId: true, adminId: true, role: true } },
      },
    }),
    prisma.chart.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        type: true,
        name1: true,
        date1: true,
        time1: true,
        place1: true,
        lat1: true,
        lon1: true,
        tz1: true,
        name2: true,
        date2: true,
        time2: true,
        place2: true,
        lat2: true,
        lon2: true,
        tz2: true,
        transitDate: true,
        houseSystem: true,
        createdAt: true,
        user: { select: { email: true, username: true, publicId: true, adminId: true, role: true } },
      },
    }),
  ]);

  const sameInput = (left: typeof savedCharts[number], right: typeof allCalculations[number]) =>
    left.userId === right.userId &&
    left.type === right.type &&
    left.name1 === right.name1 &&
    left.date1 === right.date1 &&
    left.time1 === right.time1 &&
    left.place1 === right.place1 &&
    left.lat1 === right.lat1 &&
    left.lon1 === right.lon1 &&
    left.tz1 === right.tz1 &&
    left.name2 === right.name2 &&
    left.date2 === right.date2 &&
    left.time2 === right.time2 &&
    left.place2 === right.place2 &&
    left.lat2 === right.lat2 &&
    left.lon2 === right.lon2 &&
    left.tz2 === right.tz2 &&
    left.transitDate === right.transitDate &&
    left.houseSystem === right.houseSystem;

  const chartFallbacks = savedCharts
    .filter((chart) => !allCalculations.some((calculation) => sameInput(chart, calculation)))
    .map((chart) => ({
      id: chart.id,
      publicId: chart.user.publicId,
      userId: chart.userId,
      saved: true,
      type: chart.type,
      name1: chart.name1,
      date1: chart.date1,
      time1: chart.time1,
      place1: chart.place1,
      lat1: chart.lat1,
      lon1: chart.lon1,
      tz1: chart.tz1,
      name2: chart.name2,
      date2: chart.date2,
      time2: chart.time2,
      place2: chart.place2,
      lat2: chart.lat2,
      lon2: chart.lon2,
      tz2: chart.tz2,
      transitDate: chart.transitDate,
      houseSystem: chart.houseSystem,
      ipAddress: null,
      userAgent: null,
      createdAt: chart.createdAt,
      updatedAt: null,
      user: chart.user,
    }));

  const calculations = [
    ...allCalculations.filter((calculation) => calculation.userId),
    ...chartFallbacks,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const guestCalculationGroups = groupGuestCalculations(allCalculations.filter((calculation) => !calculation.userId));

  const accountEvents = await prisma.accountEvent.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      emailSnapshot: true,
      oldEmail: true,
      newEmail: true,
      createdAt: true,
      user: { select: { email: true, username: true, role: true, adminId: true } },
    },
  });

  return NextResponse.json({
    admin: { email: session.email, adminId: users.find((user) => user.id === session.userId)?.adminId ?? null },
    users,
    calculations,
    guestCalculationGroups,
    accountEvents,
  });
}
