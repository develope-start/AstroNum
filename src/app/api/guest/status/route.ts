import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestInfo } from "@/lib/requestInfo";

const allowedTypes = new Set(["NATAL", "SYNASTRY", "TRANSIT"]);

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type")?.toUpperCase() ?? "";
  if (!allowedTypes.has(type)) return NextResponse.json({ active: false }, { status: 400 });

  const { ipAddress, userAgent } = getRequestInfo(req);
  const calculation = await prisma.calculation.findFirst({
    where: {
      userId: null,
      type: type as "NATAL" | "SYNASTRY" | "TRANSIT",
      ipAddress,
      userAgent,
      createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });

  return NextResponse.json({ active: Boolean(calculation) }, { headers: { "Cache-Control": "no-store" } });
}
