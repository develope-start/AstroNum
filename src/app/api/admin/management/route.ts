import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { dedupeRecentCalculations, groupGuestCalculations } from "@/lib/calculationHistory";
import { ensureAdminIds } from "@/lib/publicIds";

const calculationSelect = {
  id: true,
  userId: true,
  saved: true,
  publicId: true,
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
  updatedAt: true,
} as const;

function parseJsonArray(value: string): Array<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as Array<Record<string, unknown>> : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }
  await ensureAdminIds();

  const [users, guestCalculations, deletedUsers, deletedCalculations] = await Promise.all([
    prisma.user.findMany({
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
        calculations: { orderBy: { createdAt: "desc" }, select: calculationSelect },
      },
    }),
    prisma.calculation.findMany({
      where: { userId: null },
      orderBy: { createdAt: "desc" },
      select: { ...calculationSelect, ipAddress: true, userAgent: true, user: { select: { email: true, username: true, publicId: true, adminId: true, role: true } } },
    }),
    prisma.deletedUser.findMany({
      orderBy: { deletedAt: "desc" },
      select: { id: true, publicId: true, adminId: true, name: true, username: true, email: true, role: true, originalCreatedAt: true, deletedAt: true, chartsJson: true, calculationsJson: true },
    }),
    prisma.deletedCalculation.findMany({
      orderBy: { deletedAt: "desc" },
      select: { id: true, originalId: true, type: true, summary: true, dataJson: true, deletedAt: true },
    }),
  ]);

  const dedupedUsers = users.map((user) => ({
    ...user,
    calculations: dedupeRecentCalculations(user.calculations),
  }));
  const guestCalculationGroups = groupGuestCalculations(guestCalculations);

  return NextResponse.json({
    currentUserId: session.userId,
    currentUserAdminId: users.find((user) => user.id === session.userId)?.adminId ?? null,
    users: dedupedUsers,
    guestCalculations,
    guestCalculationGroups,
    deletedUsers: deletedUsers.map((user) => {
      const calculations = parseJsonArray(user.calculationsJson);
      const charts = parseJsonArray(user.chartsJson);
      return {
        id: user.id,
        publicId: user.publicId,
        adminId: user.adminId,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        originalCreatedAt: user.originalCreatedAt,
        deletedAt: user.deletedAt,
        chartCount: charts.length,
        calculationCount: calculations.length,
        calculations: calculations.map(({ resultJson, interpretation, ipAddress, userAgent, ...calculation }) => calculation),
      };
    }),
    deletedCalculations: deletedCalculations.map(({ dataJson, ...item }) => {
      const data = parseJsonObject(dataJson) as { userId?: string | null };
      const userEmail = data.userId
        ? users.find((user) => user.id === data.userId)?.email ?? deletedUsers.find((user) => user.id === data.userId)?.email ?? null
        : null;
      return { ...item, data, userEmail };
    }),
  });
}
