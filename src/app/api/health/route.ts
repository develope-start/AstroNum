import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSwissAvailable } from "@/lib/astro/ephemeris";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  const swiss = isSwissAvailable();
  const healthy = database && swiss;
  return NextResponse.json(
    {
      ok: healthy,
      node: process.version,
      database: { connected: database },
      ephemeris: { swissAvailable: swiss, fallbackAvailable: true },
      checkedAt: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
