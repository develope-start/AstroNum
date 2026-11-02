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
  // Astronomy Engine is bundled under MIT and is always the deploy-safe
  // baseline. Swiss is optional, so its absence must not make the app fail.
  const healthy = database;
  return NextResponse.json(
    {
      ok: healthy,
      node: process.version,
      database: { connected: database },
      ephemeris: { astronomyAvailable: true, swissAvailable: swiss },
      checkedAt: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
