import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { calculationWithoutInterpretationSelect } from "@/lib/calculationSelect";
import { generateNatalInterpretation, generateSynastryInterpretation, generateTransitInterpretation } from "@/lib/interpretations/natal";
import { houseOfLongitude } from "@/lib/astro/positions";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";
import { appendElementBalanceInterpretation } from "@/lib/interpretations/elementBalance";
import { recordChartView } from "@/lib/chartViews";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "ბრაუზერის სესია არ არის აქტიური" }, { status: 401 });

  const chart = await prisma.chart.findUnique({ where: { id: params.id } });
  if (!chart) return NextResponse.json({ error: "რუკა ვერ მოიძებნა" }, { status: 404 });
  if (chart.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }

  let lastViewedAt: string | null = null;
  try {
    const view = await recordChartView(params.id, session.userId, session.role);
    lastViewedAt = view.viewedAt.toISOString();
  } catch (error) {
    console.error("Could not record chart view", error);
  }

  let result: unknown;
  try {
    result = JSON.parse(chart.resultJson);
  } catch {
    return NextResponse.json({ error: "რუკის შედეგის მონაცემები დაზიანებულია" }, { status: 422 });
  }

  let interpretation: string | null = chart.interpretation;
  if (!interpretation && result && typeof result === "object") {
    const value = result as Record<string, any>;
    try {
      if (chart.type === "NATAL" && Array.isArray(value.planets) && Array.isArray(value.houseCusps)) {
        interpretation = generateNatalInterpretation({
          planets: value.planets,
          houseCusps: value.houseCusps,
          ascendant: value.ascendant,
          mc: value.mc,
          aspects: value.aspects ?? [],
          houseOfFn: (longitude: number) => houseOfLongitude(longitude, value.houseCusps),
        });
      } else if (chart.type === "SYNASTRY") {
        interpretation = generateSynastryInterpretation(chart.name1, chart.name2 ?? "", value.aspects ?? []);
      } else if (chart.type === "TRANSIT") {
        interpretation = generateTransitInterpretation(value.aspects ?? [], chart.transitDate ?? "");
      }
    } catch {
      interpretation = null;
    }
  }
  if (chart.type === "NATAL") {
    interpretation = await appendElementBalanceInterpretation(interpretation, result);
  }

  return NextResponse.json({ ...chart, result, interpretation, lastViewedAt });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "სესია არ არის აქტიური" }, { status: 401 });

  const chart = await prisma.chart.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
      mapNumber: true,
      type: true,
      label: true,
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
      resultJson: true,
      interpretation: true,
      createdAt: true,
    },
  });
  if (!chart) {
    const archived = await prisma.deletedCalculation.findUnique({ where: { originalId: params.id }, select: { id: true } });
    return archived
      ? NextResponse.json({ ok: true, message: "რუკა უკვე წაშლილია" })
      : NextResponse.json({ error: "რუკა ვერ მოიძებნა" }, { status: 404 });
  }
  if (chart.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "წვდომა აკრძალულია" }, { status: 403 });
  }

  const owner = await prisma.user.findUnique({ where: { id: chart.userId }, select: { email: true } });
  const ownerEmail = owner?.email ?? session.email;
  const matchingCalculations = await prisma.calculation.findMany({
    where: {
      userId: chart.userId,
      type: chart.type,
      name1: chart.name1,
      date1: chart.date1,
      time1: chart.time1,
      place1: chart.place1,
      lat1: chart.lat1,
      lon1: chart.lon1,
      tz1: chart.tz1,
      name2: chart.name2,
      date2: chart.date2,
      time2: chart.time2,
      place2: chart.place2,
      lat2: chart.lat2,
      lon2: chart.lon2,
      tz2: chart.tz2,
      transitDate: chart.transitDate,
      houseSystem: chart.houseSystem,
    },
    orderBy: { createdAt: "desc" },
    select: calculationWithoutInterpretationSelect,
  });

  try {
    await prisma.$transaction(async (tx) => {
      if (matchingCalculations.length > 0) {
        for (const matchingCalculation of matchingCalculations) {
          await tx.deletedCalculation.upsert({
            where: { originalId: matchingCalculation.id },
            create: {
              originalId: matchingCalculation.id,
              type: matchingCalculation.type,
              summary: `${matchingCalculation.name1} · ${formatWideDateDisplay(matchingCalculation.date1)} · ${matchingCalculation.place1}`,
              dataJson: JSON.stringify({
                ...matchingCalculation,
                ownerEmail,
                sourceType: "SAVED_CHART",
                chartSnapshot: chart,
              }),
            },
            update: {
              type: matchingCalculation.type,
              summary: `${matchingCalculation.name1} · ${formatWideDateDisplay(matchingCalculation.date1)} · ${matchingCalculation.place1}`,
              dataJson: JSON.stringify({
                ...matchingCalculation,
                ownerEmail,
                sourceType: "SAVED_CHART",
                chartSnapshot: chart,
              }),
              deletedAt: new Date(),
            },
          });
        }
        await tx.calculation.deleteMany({ where: { id: { in: matchingCalculations.map((item) => item.id) } } });
      } else {
        await tx.deletedCalculation.upsert({
          where: { originalId: chart.id },
          create: {
            originalId: chart.id,
            type: chart.type,
              summary: `${chart.name1} · ${formatWideDateDisplay(chart.date1)} · ${chart.place1}`,
            dataJson: JSON.stringify({ ...chart, ownerEmail, sourceType: "CHART" }),
          },
          update: {
            type: chart.type,
              summary: `${chart.name1} · ${formatWideDateDisplay(chart.date1)} · ${chart.place1}`,
            dataJson: JSON.stringify({ ...chart, ownerEmail, sourceType: "CHART" }),
            deletedAt: new Date(),
          },
        });
      }

      await tx.chart.delete({ where: { id: chart.id } });
      await tx.accountEvent.create({
        data: {
          userId: chart.userId,
          type: `CHART_DELETED:${chart.id}`,
          emailSnapshot: ownerEmail,
        },
      });
    });
  } catch (error) {
    console.error("Saved chart deletion failed", error);
    return NextResponse.json({ error: "რუკის წაშლა და ურნაში გადატანა ვერ შესრულდა" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
