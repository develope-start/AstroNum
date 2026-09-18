import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const events = await prisma.accountEvent.findMany({
    where: { type: { startsWith: "CHART_DELETED:" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, type: true, emailSnapshot: true, createdAt: true },
  });

  let repaired = 0;
  let skipped = 0;

  for (const event of events) {
    const chartId = event.type.slice("CHART_DELETED:".length);
    const alreadyArchived = await prisma.deletedCalculation.findUnique({ where: { originalId: chartId }, select: { id: true } });
    if (alreadyArchived || !event.userId) continue;

    const candidates = await prisma.calculation.findMany({
      where: { userId: event.userId, createdAt: { lte: event.createdAt } },
      orderBy: { createdAt: "desc" },
    });

    if (candidates.length !== 1) {
      skipped += 1;
      continue;
    }

    const calculation = candidates[0];
    await prisma.$transaction(async (tx) => {
      await tx.deletedCalculation.upsert({
        where: { originalId: calculation.id },
        create: {
          originalId: calculation.id,
          type: calculation.type,
          summary: `${calculation.name1} · ${calculation.date1} · ${calculation.place1}`,
          dataJson: JSON.stringify({ ...calculation, ownerEmail: event.emailSnapshot, sourceType: "LEGACY_CHART", chartId }),
        },
        update: {
          type: calculation.type,
          summary: `${calculation.name1} · ${calculation.date1} · ${calculation.place1}`,
          dataJson: JSON.stringify({ ...calculation, ownerEmail: event.emailSnapshot, sourceType: "LEGACY_CHART", chartId }),
          deletedAt: new Date(),
        },
      });
      await tx.calculation.delete({ where: { id: calculation.id } });
    });
    repaired += 1;
    console.log(`Repaired chart deletion ${chartId} -> archived calculation ${calculation.id}`);
  }

  console.log(JSON.stringify({ repaired, skipped }));
} finally {
  await prisma.$disconnect();
}
