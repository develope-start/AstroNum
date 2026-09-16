import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { computeNatalChart, computeSynastryAspects } from "@/lib/astro/chart";
import { generateSynastryInterpretation } from "@/lib/interpretations/natal";
import { getRequestInfo } from "@/lib/requestInfo";
import { tryRecordCalculation } from "@/lib/calculationHistory";

const person = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  place: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
  timezone: z.string().min(1),
});

const schema = z.object({
  personA: person,
  personB: person,
  houseSystem: z.enum(["whole_sign", "equal", "porphyry", "placidus"]).default("placidus"),
  save: z.boolean().default(false),
  label: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "არასწორი მონაცემები" }, { status: 400 });
  }
  const { personA, personB, houseSystem, save, label } = parsed.data;

  let chartA, chartB;
  try {
    chartA = computeNatalChart(personA, houseSystem);
    chartB = computeNatalChart(personB, houseSystem);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "გამოთვლის შეცდომა" }, { status: 400 });
  }

  const aspects = computeSynastryAspects(chartA, chartB);
  const interpretation = generateSynastryInterpretation(personA.name, personB.name, aspects);

  const responseBody = { chartA, chartB, aspects, interpretation };
  const session = await getActiveSessionFromRequest(req);
  if (save && !session) {
    return NextResponse.json({ error: "რუკის შესანახად საჭიროა შესვლა კაბინეტში" }, { status: 401 });
  }
  const sessionUserId = session?.userId ?? null;
  const requestInfo = getRequestInfo(req);

  const calculation = await tryRecordCalculation({
    userId: session?.userId ?? null,
    type: "SYNASTRY",
    name1: personA.name,
    date1: personA.date,
    time1: personA.time,
    place1: personA.place,
    lat1: personA.lat,
    lon1: personA.lon,
    tz1: personA.timezone,
    name2: personB.name,
    date2: personB.date,
    time2: personB.time,
    place2: personB.place,
    lat2: personB.lat,
    lon2: personB.lon,
    tz2: personB.timezone,
    transitDate: null,
    houseSystem,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent,
    resultJson: JSON.stringify({ chartA, chartB, aspects }),
    interpretation,
  });

  if (save) {
    if (!sessionUserId) return NextResponse.json({ error: "რუკის შესანახად საჭიროა შესვლა კაბინეტში" }, { status: 401 });
    const chart = await prisma.chart.create({
      data: {
        userId: sessionUserId,
        type: "SYNASTRY",
        label: label || `სინასტრია — ${personA.name} & ${personB.name}`,
        name1: personA.name,
        date1: personA.date,
        time1: personA.time,
        place1: personA.place,
        lat1: personA.lat,
        lon1: personA.lon,
        tz1: personA.timezone,
        name2: personB.name,
        date2: personB.date,
        time2: personB.time,
        place2: personB.place,
        lat2: personB.lat,
        lon2: personB.lon,
        tz2: personB.timezone,
        houseSystem,
        resultJson: JSON.stringify({ chartA, chartB, aspects }),
        interpretation,
      },
    });
    if (calculation) {
      await prisma.calculation.update({ where: { id: calculation.id }, data: { saved: true } });
    }
    return NextResponse.json({ ...responseBody, savedId: chart.id });
  }

  return NextResponse.json(responseBody);
}
