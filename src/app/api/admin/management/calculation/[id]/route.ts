import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";

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
  const calculation = await prisma.calculation.findUnique({ where: { id: params.id } });
  if (!calculation) return NextResponse.json({ error: "Calculation not found" }, { status: 404 });

  let result: unknown = null;
  try {
    result = JSON.parse(calculation.resultJson);
  } catch {
    return NextResponse.json({ error: "Calculation result is invalid" }, { status: 500 });
  }

  let interpretation = calculation.interpretation;
  if (!interpretation && calculation.userId) {
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
  const calculation = await prisma.calculation.findUnique({ where: { id: params.id } });
  if (!calculation) return NextResponse.json({ error: "Calculation not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.deletedCalculation.create({
      data: {
        originalId: calculation.id,
        type: calculation.type,
        summary: `${calculation.name1} · ${calculation.date1} · ${calculation.place1}`,
        dataJson: JSON.stringify(calculation),
      },
    }),
    prisma.calculation.delete({ where: { id: calculation.id } }),
  ]);
  return NextResponse.json({ message: "Calculation moved to trash" });
}
