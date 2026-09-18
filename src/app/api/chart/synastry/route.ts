import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { computeNatalChart, computeSynastryAspects } from "@/lib/astro/chart";
import { generateSynastryInterpretation } from "@/lib/interpretations/natal";
import { getRequestInfo } from "@/lib/requestInfo";
import { tryRecordCalculation } from "@/lib/calculationHistory";
import { allocateMapNumber } from "@/lib/publicIds";
import { isWideDate } from "@/lib/astro/wideDate";
import type { CalculationOptions } from "@/lib/astro/ephemeris";
import { aspectLibraryInsight } from "@/lib/interpretations/library";
import { persistLibraryEntries, translatedExternalLibraryEntries } from "@/lib/interpretations/libraryStore";

const calculationSchema = z.object({
  ephemeris: z.enum(["swiss", "astronomy"]).default("swiss"),
  zodiac: z.enum(["tropical", "sidereal"]).default("tropical"),
  siderealMode: z.number().int().min(0).max(255).default(1),
  nodeType: z.enum(["mean", "true"]).default("mean"),
  topocentric: z.boolean().default(false),
  altitudeMeters: z.number().finite().min(-500).max(10000).default(0),
  includeAsteroids: z.boolean().default(false),
}) satisfies z.ZodType<CalculationOptions>;

const person = z.object({
  name: z.string().min(1),
  date: z.string().refine(isWideDate, "თარიღი უნდა იყოს -10000-დან 10000 წლამდე და ჰქონდეს სწორი თვე/დღე"),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  place: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
  timezone: z.string().min(1),
  calculation: calculationSchema.optional(),
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
  const baseInterpretation = generateSynastryInterpretation(personA.name, personB.name, aspects);
  void persistLibraryEntries(aspects.map((aspect) => aspectLibraryInsight(aspect, "SYNASTRY")));
  const externalEntries = await translatedExternalLibraryEntries({ chartType: "SYNASTRY", aspects });
  const interpretation = [baseInterpretation, ...externalEntries].join("\n\n");

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
    const mapNumber = calculation?.mapNumber ?? await allocateMapNumber();
    const chart = await prisma.chart.create({
      data: {
        userId: sessionUserId,
        mapNumber,
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
    return NextResponse.json({ ...responseBody, mapNumber, savedId: chart.id });
  }

  return NextResponse.json({ ...responseBody, mapNumber: calculation?.mapNumber ?? null });
}
