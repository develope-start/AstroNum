import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";

// მხოლოდ საკუთარი შენახული რუკების სია — ჩვეულებრივი, შესული მომხმარებლისთვის
export async function GET(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "საჭიროა შესვლა" }, { status: 401 });

  const charts = await prisma.chart.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, mapNumber: true, type: true, label: true, name1: true, name2: true,
      date1: true, transitDate: true, houseSystem: true, createdAt: true,
    },
  });
  return NextResponse.json({ charts });
}
