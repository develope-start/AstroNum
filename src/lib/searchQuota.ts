import { prisma } from "@/lib/db";

const MONTHLY_SEARCH_LIMIT = 900;

export async function reserveWebSearchRequest(): Promise<boolean> {
  const month = new Date().toISOString().slice(0, 7);
  const key = `tavily:${month}`;
  await prisma.webSearchQuota.upsert({
    where: { key },
    create: { key, requests: 0 },
    update: {},
  });
  const reserved = await prisma.webSearchQuota.updateMany({
    where: { key, requests: { lt: MONTHLY_SEARCH_LIMIT } },
    data: { requests: { increment: 1 } },
  });
  return reserved.count === 1;
}
