import { prisma } from "@/lib/db";
import { allocatePublicId, ensureUserPublicId } from "@/lib/publicIds";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export interface CalculationHistoryInput {
  userId: string | null;
  type: string;
  name1: string;
  date1: string;
  time1: string;
  place1: string;
  lat1: number;
  lon1: number;
  tz1: string;
  name2: string | null;
  date2: string | null;
  time2: string | null;
  place2: string | null;
  lat2: number | null;
  lon2: number | null;
  tz2: string | null;
  transitDate: string | null;
  houseSystem: string;
  ipAddress: string | null;
  userAgent: string | null;
  resultJson: string;
  interpretation: string;
}

export async function recordCalculation(input: CalculationHistoryInput) {
  const now = new Date();
  const since = new Date(now.getTime() - TWELVE_HOURS_MS);
  const identity = {
    type: input.type,
    name1: input.name1,
    date1: input.date1,
    time1: input.time1,
    place1: input.place1,
    lat1: input.lat1,
    lon1: input.lon1,
    tz1: input.tz1,
    name2: input.name2,
    date2: input.date2,
    time2: input.time2,
    place2: input.place2,
    lat2: input.lat2,
    lon2: input.lon2,
    tz2: input.tz2,
    transitDate: input.transitDate,
    houseSystem: input.houseSystem,
  };
  const existing = input.userId
    ? await prisma.calculation.findFirst({
        where: { userId: input.userId, type: input.type, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const existingGuest = !input.userId && input.ipAddress && input.userAgent
    ? await prisma.calculation.findFirst({
        where: { userId: null, ipAddress: input.ipAddress, userAgent: input.userAgent, createdAt: { gte: since }, ...identity },
        orderBy: { createdAt: "desc" },
        select: { id: true, publicId: true },
      })
    : null;
  const recentGuestCalculation = !input.userId && input.ipAddress && input.userAgent
    ? await prisma.calculation.findFirst({
        where: { userId: null, ipAddress: input.ipAddress, userAgent: input.userAgent, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        select: { publicId: true },
      })
    : null;

  const publicId = input.userId
    ? await ensureUserPublicId(input.userId)
    : recentGuestCalculation?.publicId ?? await allocatePublicId("GUEST");
  const existingRecord = existing ?? existingGuest;
  const data = { ...input, saved: false, updatedAt: existingRecord ? now : null, publicId, createdAt: now };
  if (existing) {
    return prisma.calculation.update({ where: { id: existing.id }, data });
  }
  if (existingGuest) {
    return prisma.calculation.update({ where: { id: existingGuest.id }, data });
  }
  return prisma.calculation.create({ data });
}

export function twelveHoursAgo() {
  return new Date(Date.now() - TWELVE_HOURS_MS);
}

type CalculationRowForDedupe = {
  id: string;
  type: string;
  createdAt: Date | string;
  publicId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  user?: { email?: string } | null;
  name1: string;
  date1: string;
  time1: string;
  place1: string;
  lat1: number;
  lon1: number;
  tz1: string;
  name2?: string | null;
  date2?: string | null;
  time2?: string | null;
  place2?: string | null;
  lat2?: number | null;
  lon2?: number | null;
  tz2?: string | null;
  transitDate?: string | null;
  houseSystem: string;
};

export function groupGuestCalculations<T extends CalculationRowForDedupe>(rows: T[]) {
  const groups: Array<{
    id: string;
    key: string;
    latestAt: number;
    publicId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    calculations: T[];
  }> = [];

  for (const row of [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())) {
    const identity = row.publicId
      ? `public:${row.publicId}`
      : row.ipAddress && row.userAgent
        ? `guest:${row.ipAddress}:${row.userAgent}`
        : `row:${row.id}`;
    const createdAt = new Date(row.createdAt).getTime();
    let group = groups.find((candidate) => candidate.key === identity && candidate.latestAt - createdAt <= TWELVE_HOURS_MS);

    if (!group) {
      group = {
        id: `${identity}:${createdAt}`,
        key: identity,
        latestAt: createdAt,
        publicId: row.publicId ?? null,
        ipAddress: row.ipAddress ?? null,
        userAgent: row.userAgent ?? null,
        calculations: [],
      };
      groups.push(group);
    }
    group.calculations.push(row);
  }

  return groups.map(({ key, latestAt, ...group }) => group);
}

export function dedupeRecentCalculations<T extends CalculationRowForDedupe>(rows: T[]) {
  const seen = new Map<string, number>();
  return [...rows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((row) => {
      const createdAt = new Date(row.createdAt).getTime();
      const key = row.userId
        ? `user:${row.userId}:${row.type}`
        : row.user?.email
          ? `user-email:${row.user.email}:${row.type}`
          : row.ipAddress && row.userAgent
            ? `guest:${row.ipAddress}:${row.userAgent}:${row.type}`
            : `row:${row.id}`;
      const previous = seen.get(key);
      if (previous !== undefined && previous - createdAt <= TWELVE_HOURS_MS) return false;
      seen.set(key, createdAt);
      return true;
    });
}
