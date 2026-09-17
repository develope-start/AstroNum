import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { computeNatalChart } from "@/lib/astro/chart";
import { generateNatalInterpretation } from "@/lib/interpretations/natal";
import { houseOfLongitude } from "@/lib/astro/positions";
import { getRequestInfo } from "@/lib/requestInfo";
import { tryRecordCalculation } from "@/lib/calculationHistory";
import { allocateMapNumber } from "@/lib/publicIds";

const schema = z.object({
  name: z.string().min(1, "სახელი აუცილებელია"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "თარიღის ფორმატია YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "დროის ფორმატია HH:mm"),
  place: z.string().min(1, "დაბადების ადგილი აუცილებელია"),
  lat: z.number(),
  lon: z.number(),
  timezone: z.string().min(1),
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
  const data = parsed.data;

  let result;
  try {
    result = computeNatalChart(
      { date: data.date, time: data.time, timezone: data.timezone, lat: data.lat, lon: data.lon },
      data.houseSystem
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "გამოთვლის შეცდომა" }, { status: 400 });
  }

  const interpretation = generateNatalInterpretation({
    planets: result.planets,
    houseCusps: result.houseCusps,
    ascendant: result.ascendant,
    mc: result.mc,
    aspects: result.aspects,
    houseOfFn: (lon: number) => houseOfLongitude(lon, result.houseCusps),
  });

  const responseBody = { result, interpretation };
  const session = await getActiveSessionFromRequest(req);
  if (data.save && !session) {
    return NextResponse.json({ error: "რუკის შესანახად საჭიროა შესვლა კაბინეტში" }, { status: 401 });
  }
  const sessionUserId = session?.userId ?? null;
  const requestInfo = getRequestInfo(req);

  const calculation = await tryRecordCalculation({
    userId: session?.userId ?? null,
    type: "NATAL",
    name1: data.name,
    date1: data.date,
    time1: data.time,
    place1: data.place,
    lat1: data.lat,
    lon1: data.lon,
    tz1: data.timezone,
    name2: null,
    date2: null,
    time2: null,
    place2: null,
    lat2: null,
    lon2: null,
    tz2: null,
    transitDate: null,
    houseSystem: data.houseSystem,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent,
    resultJson: JSON.stringify(result),
    interpretation,
  });

  if (data.save) {
    if (!sessionUserId) return NextResponse.json({ error: "რუკის შესანახად საჭიროა შესვლა კაბინეტში" }, { status: 401 });
    const mapNumber = calculation?.mapNumber ?? await allocateMapNumber();
    const chart = await prisma.chart.create({
      data: {
        userId: sessionUserId,
        mapNumber,
        type: "NATAL",
        label: data.label || `ნატალური — ${data.name}`,
        name1: data.name,
        date1: data.date,
        time1: data.time,
        place1: data.place,
        lat1: data.lat,
        lon1: data.lon,
        tz1: data.timezone,
        houseSystem: data.houseSystem,
        resultJson: JSON.stringify(result),
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
