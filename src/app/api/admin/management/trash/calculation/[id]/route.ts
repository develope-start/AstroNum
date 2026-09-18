import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { allocateMapNumber, allocatePublicId, ensureUserPublicId, numberFromPublicId } from "@/lib/publicIds";

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function chartData(source: Record<string, unknown>, userId: string, fallbackId: string) {
  return {
    id: typeof source.id === "string" ? source.id : fallbackId,
    userId,
    mapNumber: typeof source.mapNumber === "string" ? source.mapNumber : null,
    type: String(source.type ?? "NATAL"),
    label: String(source.label ?? "შენახული რუკა"),
    name1: String(source.name1 ?? ""),
    date1: String(source.date1 ?? ""),
    time1: String(source.time1 ?? ""),
    place1: String(source.place1 ?? ""),
    lat1: Number(source.lat1 ?? 0),
    lon1: Number(source.lon1 ?? 0),
    tz1: String(source.tz1 ?? "UTC"),
    name2: typeof source.name2 === "string" ? source.name2 : null,
    date2: typeof source.date2 === "string" ? source.date2 : null,
    time2: typeof source.time2 === "string" ? source.time2 : null,
    place2: typeof source.place2 === "string" ? source.place2 : null,
    lat2: typeof source.lat2 === "number" ? source.lat2 : null,
    lon2: typeof source.lon2 === "number" ? source.lon2 : null,
    tz2: typeof source.tz2 === "string" ? source.tz2 : null,
    transitDate: typeof source.transitDate === "string" ? source.transitDate : null,
    houseSystem: String(source.houseSystem ?? "placidus"),
    resultJson: String(source.resultJson ?? "{}"),
    interpretation: typeof source.interpretation === "string" ? source.interpretation : "",
    createdAt: new Date(String(source.createdAt ?? new Date().toISOString())),
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }

  const deleted = await prisma.deletedCalculation.findUnique({ where: { id: params.id } });
  if (!deleted) return NextResponse.json({ error: "ურნაში ეს რუკა აღარ არსებობს" }, { status: 404 });

  const archived = parseJsonObject(deleted.dataJson);
  if (!archived) return NextResponse.json({ error: "არქივის მონაცემები დაზიანებულია" }, { status: 422 });

  const sourceType = typeof archived.sourceType === "string" ? archived.sourceType : "CALCULATION";
  const isSavedChart = sourceType === "SAVED_CHART";
  const isChartOnly = sourceType === "CHART";
  const isLegacyChart = sourceType === "LEGACY_CHART";
  const chartSnapshot = archived.chartSnapshot && typeof archived.chartSnapshot === "object" && !Array.isArray(archived.chartSnapshot)
    ? archived.chartSnapshot as Record<string, unknown>
    : null;
  const userId = typeof archived.userId === "string" ? archived.userId : null;

  let user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, publicId: true, email: true } })
    : null;
  if (!user && userId) {
    const deletedOwner = await prisma.deletedUser.findUnique({ where: { id: userId }, select: { email: true } });
    user = deletedOwner
      ? await prisma.user.findUnique({ where: { email: deletedOwner.email }, select: { id: true, publicId: true, email: true } })
      : null;
  }
  if (!user && typeof archived.ownerEmail === "string") {
    user = await prisma.user.findUnique({ where: { email: archived.ownerEmail }, select: { id: true, publicId: true, email: true } });
  }

  if ((isSavedChart || isChartOnly) && !user) {
    return NextResponse.json({ error: "ჯერ აღადგინეთ რუკის მფლობელი მომხმარებლის ანგარიში" }, { status: 409 });
  }

  const calculation = { ...archived };
  delete calculation.interpretation;
  delete calculation.ownerEmail;
  delete calculation.sourceType;
  delete calculation.chartSnapshot;
  delete calculation.chartId;

  if (user) {
    calculation.userId = user.id;
    calculation.publicId = user.publicId || await ensureUserPublicId(user.id);
  } else {
    calculation.userId = null;
    calculation.publicId = await allocatePublicId("GUEST", numberFromPublicId(typeof archived.publicId === "string" ? archived.publicId : null));
  }
  calculation.mapNumber = typeof archived.mapNumber === "string" ? archived.mapNumber : await allocateMapNumber();

  await prisma.$transaction(async (tx) => {
    if (!isChartOnly) {
      await tx.calculation.create({
        data: {
          ...(calculation as any),
          id: deleted.originalId,
          createdAt: new Date(String(archived.createdAt ?? new Date().toISOString())),
        },
      });
    }

    if ((isSavedChart || isChartOnly) && user) {
      const source = isSavedChart ? chartSnapshot : archived;
      if (!source) throw new Error("Saved chart snapshot is missing");
      await tx.chart.create({ data: chartData(source, user.id, typeof archived.chartId === "string" ? archived.chartId : deleted.originalId) });
    }

    if (user) {
      await tx.accountEvent.create({
        data: {
          userId: user.id,
          type: (isSavedChart || isChartOnly || isLegacyChart) ? `CHART_RESTORED:${deleted.originalId}` : `CALCULATION_RESTORED:${deleted.originalId}`,
          emailSnapshot: user.email,
        },
      });
    }
    await tx.deletedCalculation.delete({ where: { id: deleted.id } });
  });

  return NextResponse.json({ message: "რუკა წარმატებით აღდგა" });
}
