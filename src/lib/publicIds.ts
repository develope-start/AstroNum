import { prisma } from "@/lib/db";

type IdKind = "REGISTERED" | "GUEST";
type DbClient = typeof prisma;

function formatNumber(value: number) {
  return value <= 10000 ? String(value).padStart(5, "0") : String(value);
}

function randomFiveDigitNumber() {
  return 10001 + Math.floor(Math.random() * 89999);
}

async function getTakenIds(db: DbClient, kind: IdKind) {
  if (kind === "REGISTERED") {
    const users = await db.user.findMany({ where: { publicId: { not: null } }, select: { publicId: true } });
    return new Set(users.map((user) => user.publicId).filter((id): id is string => Boolean(id)));
  }
  const calculations = await db.calculation.findMany({ where: { publicId: { not: null } }, select: { publicId: true } });
  return new Set(calculations.map((calculation) => calculation.publicId).filter((id): id is string => Boolean(id)));
}

async function allocateWithClient(db: DbClient, kind: IdKind, preferredNumber?: number) {
  const sequence = await db.idSequence.upsert({
    where: { key: kind },
    update: {},
    create: { key: kind, nextNumber: 1 },
  });
  const takenIds = await getTakenIds(db, kind);
  const preferred = preferredNumber && preferredNumber >= 1 && preferredNumber <= 99999 ? preferredNumber : undefined;

  let candidate: number;
  if (preferred) {
    candidate = preferred;
  } else if (sequence.nextNumber <= 10000) {
    candidate = sequence.nextNumber;
    // Reuse the lowest released sequential number before opening the random range.
    for (let number = 1; number < sequence.nextNumber; number += 1) {
      const id = kind === "REGISTERED" ? `R${formatNumber(number)}` : formatNumber(number);
      if (!takenIds.has(id)) {
        candidate = number;
        break;
      }
    }
  } else {
    candidate = randomFiveDigitNumber();
  }

  let attempts = 0;
  while (attempts < 100000) {
    const formatted = formatNumber(candidate);
    const publicId = kind === "REGISTERED" ? `R${formatted}` : formatted;
    if (!takenIds.has(publicId)) {
      await db.idSequence.update({
        where: { key: kind },
        data: { nextNumber: Math.max(sequence.nextNumber, candidate + 1) },
      });
      return publicId;
    }
    candidate = candidate < 99999 ? candidate + 1 : randomFiveDigitNumber();
    attempts += 1;
  }
  throw new Error("Unable to allocate a public ID");
}

export async function allocatePublicId(kind: IdKind, preferredNumber?: number) {
  return prisma.$transaction((tx) => allocateWithClient(tx as unknown as DbClient, kind, preferredNumber));
}

export async function allocateMapNumber() {
  return prisma.$transaction(async (tx) => {
    const sequence = await tx.idSequence.upsert({
      where: { key: "MAP" },
      update: {},
      create: { key: "MAP", nextNumber: 1 },
    });
    const updated = await tx.idSequence.update({
      where: { key: "MAP" },
      data: { nextNumber: { increment: 1 } },
      select: { nextNumber: true },
    });
    const number = Math.max(1, updated.nextNumber - 1, sequence.nextNumber);
    return `Z-${formatNumber(number)}`;
  });
}

export async function ensureUserPublicId(userId: string, preferredNumber?: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { publicId: true } });
  if (user?.publicId) return user.publicId;
  const publicId = await allocatePublicId("REGISTERED", preferredNumber);
  try {
    const updated = await prisma.user.update({ where: { id: userId }, data: { publicId }, select: { publicId: true } });
    return updated.publicId as string;
  } catch {
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { publicId: true } });
    if (existing?.publicId) return existing.publicId;
    throw new Error("Unable to assign a public ID to the user");
  }
}

async function allocateAdminIdWithClient(db: DbClient, preferredId?: string | null) {
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { adminId: true } });
  const taken = new Set(admins.map((admin) => admin.adminId).filter((id): id is string => Boolean(id)));
  if (preferredId && /^ADMIN(?:[1-9]\d*)?$/.test(preferredId) && !taken.has(preferredId)) return preferredId;
  if (!taken.has("ADMIN")) return "ADMIN";

  const sequence = await db.idSequence.upsert({
    where: { key: "ADMIN" },
    update: {},
    create: { key: "ADMIN", nextNumber: 1 },
  });
  let candidate = Math.max(1, sequence.nextNumber);
  for (let number = 1; number < candidate; number += 1) {
    if (!taken.has(`ADMIN${number}`)) {
      candidate = number;
      break;
    }
  }
  while (taken.has(`ADMIN${candidate}`)) candidate += 1;
  await db.idSequence.update({ where: { key: "ADMIN" }, data: { nextNumber: candidate + 1 } });
  return `ADMIN${candidate}`;
}

export async function allocateAdminId(preferredId?: string | null) {
  return prisma.$transaction((tx) => allocateAdminIdWithClient(tx as unknown as DbClient, preferredId));
}

export async function ensureAdminIds() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (adminEmail) {
    const primaryUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (primaryUser) {
      if (primaryUser.role !== "ADMIN" || primaryUser.adminId !== "ADMIN") {
        await prisma.user.update({
          where: { id: primaryUser.id },
          data: { role: "ADMIN", adminId: "ADMIN" },
        });
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const admins = await tx.user.findMany({
      where: { role: "ADMIN" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, email: true, adminId: true },
    });
    if (!admins.length) return;

    const hasPrimary = admins.some((a) => a.adminId === "ADMIN");

    for (let index = 0; index < admins.length; index += 1) {
      const admin = admins[index];
      if (admin.adminId) continue;
      const isPrimaryEmail = adminEmail && admin.email.toLowerCase() === adminEmail;
      const adminId = (isPrimaryEmail || (!hasPrimary && index === 0))
        ? await allocateAdminIdWithClient(tx as unknown as DbClient, "ADMIN")
        : await allocateAdminIdWithClient(tx as unknown as DbClient);
      await tx.user.update({ where: { id: admin.id }, data: { adminId } });
    }
  });
}

export function numberFromPublicId(publicId: string | null | undefined) {
  if (!publicId) return undefined;
  const numeric = Number(publicId.replace(/^R/, ""));
  return Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
}
