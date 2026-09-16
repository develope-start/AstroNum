import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { dedupeRecentCalculations, groupGuestCalculations } from "@/lib/calculationHistory";
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

  const allCalculations = await prisma.calculation.findMany({
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
      user: { select: { email: true, publicId: true, adminId: true, role: true } },
    },
  });
  const calculations = dedupeRecentCalculations(allCalculations.filter((calculation) => calculation.userId));
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
      user: { select: { email: true, role: true, adminId: true } },
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
