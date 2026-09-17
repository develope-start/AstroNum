import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { generateNatalInterpretation, generateSynastryInterpretation, generateTransitInterpretation } from "@/lib/interpretations/natal";
import { houseOfLongitude } from "@/lib/astro/positions";
import { calculationWithoutInterpretationSelect } from "@/lib/calculationSelect";

const nullableString = z.string().nullable().optional();
const schema = z.object({
  type: z.enum(["NATAL", "SYNASTRY", "TRANSIT"]).optional(),
  name1: z.string().min(1).optional(), date1: z.string().min(1).optional(), time1: z.string().min(1).optional(), place1: z.string().min(1).optional(),
  lat1: z.number().optional(), lon1: z.number().optional(), tz1: z.string().min(1).optional(),
  name2: nullableString, date2: nullableString, time2: nullableString, place2: nullableString,
  lat2: z.number().nullable().optional(), lon2: z.number().nullable().optional(), tz2: nullableString,
  transitDate: nullableString, houseSystem: z.string().min(1).optional(),
});

async function authorized(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  return session?.role === "ADMIN";
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await authorized(req))) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  // Keep this select explicit so an older database missing the optional
  // interpretation column can still open a calculation.
  let calculation = await prisma.calculation.findUnique({
    where: { id: params.id },
    select: {
      id: true, userId: true, publicId: true, mapNumber: true, saved: true, type: true,
      name1: true, date1: true, time1: true, place1: true, lat1: true, lon1: true, tz1: true,
      name2: true, date2: true, time2: true, place2: true, lat2: true, lon2: true, tz2: true,
      transitDate: true, houseSystem: true, ipAddress: true, userAgent: true,
      resultJson: true, updatedAt: true, createdAt: true,
    },
  });
  if (!calculation) {
    const savedChart = await prisma.chart.findUnique({
      where: { id: params.id },
      select: {
        id: true, userId: true, mapNumber: true, type: true,
        name1: true, date1: true, time1: true, place1: true, lat1: true, lon1: true, tz1: true,
        name2: true, date2: true, time2: true, place2: true, lat2: true, lon2: true, tz2: true,
        transitDate: true, houseSystem: true, resultJson: true, createdAt: true,
      },
    });
    if (!savedChart) return NextResponse.json({ error: "Calculation not found" }, { status: 404 });
    calculation = {
      ...savedChart,
      publicId: null,
      saved: true,
      ipAddress: null,
      userAgent: null,
      updatedAt: null,
    };
  }

  let result: unknown = null;
  try {
    result = JSON.parse(calculation.resultJson);
  } catch {
    return NextResponse.json({ error: "Calculation result is invalid" }, { status: 500 });
  }

  let interpretation: string | null = null;
  if (calculation.userId) {
    const savedChart = await prisma.chart.findFirst({
      where: {
        userId: calculation.userId,
        type: calculation.type,
        name1: calculation.name1,
        date1: calculation.date1,
        time1: calculation.time1,
        place1: calculation.place1,
        lat1: calculation.lat1,
        lon1: calculation.lon1,
        tz1: calculation.tz1,
        name2: calculation.name2,
        date2: calculation.date2,
        time2: calculation.time2,
        place2: calculation.place2,
        lat2: calculation.lat2,
        lon2: calculation.lon2,
        tz2: calculation.tz2,
        transitDate: calculation.transitDate,
        houseSystem: calculation.houseSystem,
      },
      select: { interpretation: true },
    });
    interpretation = savedChart?.interpretation ?? null;
  }

  if (!interpretation && result && typeof result === "object") {
    const value = result as Record<string, any>;
    try {
      if (calculation.type === "NATAL" && Array.isArray(value.planets) && Array.isArray(value.houseCusps)) {
        interpretation = generateNatalInterpretation({
          planets: value.planets,
          houseCusps: value.houseCusps,
          ascendant: value.ascendant,
          mc: value.mc,
          aspects: value.aspects ?? [],
          houseOfFn: (lon: number) => houseOfLongitude(lon, value.houseCusps),
        });
      } else if (calculation.type === "SYNASTRY") {
        interpretation = generateSynastryInterpretation(calculation.name1, calculation.name2 ?? "", value.aspects ?? []);
      } else if (calculation.type === "TRANSIT") {
        interpretation = generateTransitInterpretation(value.aspects ?? [], calculation.transitDate ?? "");
      }
    } catch {
      interpretation = null;
    }
  }

  const { resultJson, ...metadata } = calculation;
  return NextResponse.json({ ...metadata, result, interpretation });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await authorized(req))) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  try {
    await prisma.calculation.update({ where: { id: params.id }, data: parsed.data });
  } catch {
    return NextResponse.json({ error: "Calculation not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Calculation updated" });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await authorized(req))) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const calculation = await prisma.calculation.findUnique({
    where: { id: params.id },
    select: calculationWithoutInterpretationSelect,
  });
  if (!calculation) {
    const alreadyInTrash = await prisma.deletedCalculation.findUnique({ where: { originalId: params.id }, select: { id: true } });
    if (alreadyInTrash) return NextResponse.json({ message: "Calculation is already in trash" });
    return NextResponse.json({ error: "Calculation not found" }, { status: 404 });
  }

  const owner = calculation.userId
    ? await prisma.user.findUnique({ where: { id: calculation.userId }, select: { email: true } })
    : null;
  const duplicateWhere = {
    userId: calculation.userId,
    type: calculation.type,
    name1: calculation.name1,
    date1: calculation.date1,
    time1: calculation.time1,
    place1: calculation.place1,
    lat1: calculation.lat1,
    lon1: calculation.lon1,
    tz1: calculation.tz1,
    name2: calculation.name2,
    date2: calculation.date2,
    time2: calculation.time2,
    place2: calculation.place2,
    lat2: calculation.lat2,
    lon2: calculation.lon2,
    tz2: calculation.tz2,
    transitDate: calculation.transitDate,
    houseSystem: calculation.houseSystem,
    ...(calculation.userId ? {} : { ipAddress: calculation.ipAddress, userAgent: calculation.userAgent }),
  };
  const duplicateCalculations = await prisma.calculation.findMany({
    where: duplicateWhere,
    select: calculationWithoutInterpretationSelect,
  });
  const calculationsToDelete = duplicateCalculations.length > 0 ? duplicateCalculations : [calculation];

  try {
    for (const item of calculationsToDelete) {
      await prisma.deletedCalculation.upsert({
        where: { originalId: item.id },
        create: {
          originalId: item.id,
          type: item.type,
          summary: `${item.name1} · ${item.date1} · ${item.place1}`,
          dataJson: JSON.stringify(item),
        },
        update: {
          type: item.type,
          summary: `${item.name1} · ${item.date1} · ${item.place1}`,
          dataJson: JSON.stringify(item),
        },
      });
    }
  } catch (error) {
    console.error("Could not write to deletedCalculation table", error);
    return NextResponse.json({ error: "რუკის ურნაში გადატანა ვერ მოხერხდა" }, { status: 500 });
  }

  try {
    const deleted = await prisma.calculation.deleteMany({ where: { id: { in: calculationsToDelete.map((item) => item.id) } } });
    if (deleted.count === 0) {
      return NextResponse.json({ message: "Calculation is already deleted" });
    }
  } catch (error) {
    console.error("Calculation deletion failed", error);
    return NextResponse.json({ error: "რუკის ძირითადი ჩანაწერის წაშლა ვერ მოხერხდა" }, { status: 500 });
  }
  if (owner) {
    try {
      await prisma.accountEvent.create({
        data: { userId: calculation.userId, type: `CALCULATION_DELETED:${calculation.id}`, emailSnapshot: owner.email },
      });
    } catch {
      console.error("Calculation deletion status could not be stored");
    }
  }
  return NextResponse.json({ message: "Calculation moved to trash" });
}
