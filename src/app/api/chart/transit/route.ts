import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { computeNatalChart, computeTransitAspects } from "@/lib/astro/chart";
import { generateTransitInterpretation } from "@/lib/interpretations/natal";
import { getRequestInfo } from "@/lib/requestInfo";
import { tryRecordCalculation } from "@/lib/calculationHistory";
import { allocateMapNumber } from "@/lib/publicIds";
import { compareWideDates, isWideDate, wideDateToUtcDate } from "@/lib/astro/wideDate";

const wideDateSchema = z.string().refine(isWideDate, "თარიღი უნდა იყოს -10000-დან 10000 წლამდე და ჰქონდეს სწორი თვე/დღე");

const schema = z.object({
  natal: z.object({
    name: z.string().min(1),
    date: z.string().refine(isWideDate, "თარიღი უნდა იყოს -10000-დან 10000 წლამდე და ჰქონდეს სწორი თვე/დღე"),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    place: z.string().min(1),
    lat: z.number(),
    lon: z.number(),
    timezone: z.string().min(1),
  }),
  transitDate: wideDateSchema,
  transitStartDate: wideDateSchema.optional(),
  transitEndDate: wideDateSchema.optional(),
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
  const { natal, transitDate, houseSystem, save, label } = parsed.data;
  const transitStartDate = parsed.data.transitStartDate ?? transitDate;
  const transitEndDate = parsed.data.transitEndDate ?? transitDate;
  if (compareWideDates(transitStartDate, transitEndDate) > 0) {
    return NextResponse.json({ error: "ტრანზიტის ინტერვალში საწყისი თარიღი საბოლოო თარიღზე გვიანია" }, { status: 400 });
  }
  if (compareWideDates(transitDate, transitStartDate) < 0 || compareWideDates(transitDate, transitEndDate) > 0) {
    return NextResponse.json({ error: "ტრანზიტის თარიღი არჩეული ინტერვალის ფარგლებში უნდა იყოს" }, { status: 400 });
  }

  let natalChart;
  try {
    natalChart = computeNatalChart(natal, houseSystem);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "გამოთვლის შეცდომა" }, { status: 400 });
  }

  const transitUtc = wideDateToUtcDate(transitDate);
  if (!transitUtc) {
    return NextResponse.json({ error: "ტრანზიტის თარიღის დამუშავება ვერ მოხერხდა" }, { status: 400 });
  }
  // შუადღე UTC — ტრანზიტული დღის საერთო მდგომარეობისთვის
  const { transitPlanets, aspects } = computeTransitAspects(natalChart, transitUtc);
  const interpretation = generateTransitInterpretation(aspects, transitDate);

  const responseBody = { natalChart, transitPlanets, aspects, interpretation, transitStartDate, transitEndDate };
  const session = await getActiveSessionFromRequest(req);
  if (save && !session) {
    return NextResponse.json({ error: "რუკის შესანახად საჭიროა შესვლა კაბინეტში" }, { status: 401 });
  }
  const sessionUserId = session?.userId ?? null;
  const requestInfo = getRequestInfo(req);

  const calculation = await tryRecordCalculation({
    userId: session?.userId ?? null,
    type: "TRANSIT",
    name1: natal.name,
    date1: natal.date,
    time1: natal.time,
    place1: natal.place,
    lat1: natal.lat,
    lon1: natal.lon,
    tz1: natal.timezone,
    name2: null,
    date2: null,
    time2: null,
    place2: null,
    lat2: null,
    lon2: null,
    tz2: null,
    transitDate,
    houseSystem,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent,
    resultJson: JSON.stringify({ natalChart, transitPlanets, aspects, transitStartDate, transitEndDate }),
    interpretation,
  });

  if (save) {
    if (!sessionUserId) return NextResponse.json({ error: "რუკის შესანახად საჭიროა შესვლა კაბინეტში" }, { status: 401 });
    const mapNumber = calculation?.mapNumber ?? await allocateMapNumber();
    const chart = await prisma.chart.create({
      data: {
        userId: sessionUserId,
        mapNumber,
        type: "TRANSIT",
        label: label || `ტრანზიტი — ${natal.name} (${transitStartDate} — ${transitEndDate})`,
        name1: natal.name,
        date1: natal.date,
        time1: natal.time,
        place1: natal.place,
        lat1: natal.lat,
        lon1: natal.lon,
        tz1: natal.timezone,
        transitDate,
        houseSystem,
        resultJson: JSON.stringify({ natalChart, transitPlanets, aspects, transitStartDate, transitEndDate }),
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
