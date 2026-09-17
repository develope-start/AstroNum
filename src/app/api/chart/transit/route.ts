import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { computeNatalChart, computeTransitAspects } from "@/lib/astro/chart";
import { generateTransitInterpretation } from "@/lib/interpretations/natal";
import { getRequestInfo } from "@/lib/requestInfo";
import { tryRecordCalculation } from "@/lib/calculationHistory";
import { allocateMapNumber } from "@/lib/publicIds";

const schema = z.object({
  natal: z.object({
    name: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    place: z.string().min(1),
    lat: z.number(),
    lon: z.number(),
    timezone: z.string().min(1),
  }),
  transitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ტრანზიტის თარიღის ფორმატია YYYY-MM-DD"),
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

  let natalChart;
  try {
    natalChart = computeNatalChart(natal, houseSystem);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "გამოთვლის შეცდომა" }, { status: 400 });
  }

  const transitUtc = new Date(`${transitDate}T12:00:00Z`); // შუადღე UTC — ტრანზიტული დღის საერთო მდგომარეობისთვის
  const { transitPlanets, aspects } = computeTransitAspects(natalChart, transitUtc);
  const interpretation = generateTransitInterpretation(aspects, transitDate);

  const responseBody = { natalChart, transitPlanets, aspects, interpretation };
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
    resultJson: JSON.stringify({ natalChart, transitPlanets, aspects }),
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
        label: label || `ტრანზიტი — ${natal.name} (${transitDate})`,
        name1: natal.name,
        date1: natal.date,
        time1: natal.time,
        place1: natal.place,
        lat1: natal.lat,
        lon1: natal.lon,
        tz1: natal.timezone,
        transitDate,
        houseSystem,
        resultJson: JSON.stringify({ natalChart, transitPlanets, aspects }),
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
