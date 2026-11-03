import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { z } from "zod";
import { allocateMapNumber } from "@/lib/publicIds";
import { isWideDate } from "@/lib/astro/wideDate";
import { isValidPersonInput } from "@/lib/astro/inputSchemas";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const saveChartSchema = z.object({
  type: z.enum(["NATAL", "SYNASTRY", "TRANSIT"]).default("NATAL"),
  label: z.string().trim().min(1).max(120).optional(),
  mapNumber: z.string().trim().max(80).optional().nullable(),
  name1: z.string().trim().min(1).max(120),
  date1: z.string().refine(isWideDate),
  time1: z.string().regex(/^\d{2}:\d{2}$/),
  place1: z.string().trim().min(1).max(240),
  lat1: z.number().finite().min(-90).max(90),
  lon1: z.number().finite().min(-180).max(180),
  tz1: z.string().min(1).max(100),
  name2: z.string().trim().min(1).max(120).optional().nullable(),
  date2: z.string().refine(isWideDate).optional().nullable(),
  time2: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  place2: z.string().trim().min(1).max(240).optional().nullable(),
  lat2: z.number().finite().min(-90).max(90).optional().nullable(),
  lon2: z.number().finite().min(-180).max(180).optional().nullable(),
  tz2: z.string().min(1).max(100).optional().nullable(),
  transitDate: z.string().refine(isWideDate).optional().nullable(),
  houseSystem: z.enum(["placidus", "koch", "regiomontanus", "campanus", "alcabitius", "topocentric", "porphyry", "equal", "whole_sign"]).default("placidus"),
  result: z.unknown(),
  interpretation: z.string().max(500_000).nullable().optional(),
});

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

export async function POST(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "charts:save"), 30, 5 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "რუკის შენახვის მცდელობები ზედმეტად ხშირია. სცადეთ მოგვიანებით." }, {
      status: 429,
      headers: { "Retry-After": String(limiter.retryAfterSeconds) },
    });
  }

  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "რუკის ანგარიშში შესანახად საჭიროა შესვლა." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = saveChartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "რუკის მონაცემები არასწორია." }, { status: 400 });
  }
  const data = parsed.data;
  const person = {
    name: data.name1,
    date: data.date1,
    time: data.time1,
    place: data.place1,
    lat: data.lat1,
    lon: data.lon1,
    timezone: data.tz1,
  };
  if (!isValidPersonInput(person)) {
    return NextResponse.json({ error: "დაბადების მონაცემები არასწორია." }, { status: 400 });
  }
  if (data.type === "SYNASTRY") {
    if (!data.name2 || !data.date2 || !data.time2 || !data.place2 || data.lat2 == null || data.lon2 == null || !data.tz2) {
      return NextResponse.json({ error: "სინასტრიის შესანახად ორივე ადამიანის მონაცემებია საჭირო." }, { status: 400 });
    }
    if (!isValidPersonInput({
      name: data.name2,
      date: data.date2,
      time: data.time2,
      place: data.place2,
      lat: data.lat2,
      lon: data.lon2,
      timezone: data.tz2,
    })) {
      return NextResponse.json({ error: "მეორე ადამიანის დაბადების მონაცემები არასწორია." }, { status: 400 });
    }
  }
  if (data.type === "TRANSIT" && !data.transitDate) {
    return NextResponse.json({ error: "ტრანზიტული რუკის შესანახად თარიღია საჭირო." }, { status: 400 });
  }
  if (!data.result || typeof data.result !== "object" || Array.isArray(data.result)) {
    return NextResponse.json({ error: "რუკის გამოთვლილი შედეგი არასწორია." }, { status: 400 });
  }

  const resultJson = JSON.stringify(data.result);
  if (resultJson.length > 2_000_000) {
    return NextResponse.json({ error: "რუკის მონაცემები შენახვისთვის ზედმეტად დიდია." }, { status: 413 });
  }

  try {
    const mapNumber = data.mapNumber ?? await allocateMapNumber();
    const chart = await prisma.$transaction(async (tx) => {
      const savedChart = await tx.chart.create({
        data: {
          userId: session.userId,
          mapNumber,
          type: data.type,
          label: data.label ?? `${data.type === "NATAL" ? "ნატალური" : data.type === "SYNASTRY" ? "სინასტრია" : "ტრანზიტი"} — ${data.name1}`,
          name1: data.name1,
          date1: data.date1,
          time1: data.time1,
          place1: data.place1,
          lat1: data.lat1,
          lon1: data.lon1,
          tz1: data.tz1,
          name2: data.name2 ?? null,
          date2: data.date2 ?? null,
          time2: data.time2 ?? null,
          place2: data.place2 ?? null,
          lat2: data.lat2 ?? null,
          lon2: data.lon2 ?? null,
          tz2: data.tz2 ?? null,
          transitDate: data.transitDate ?? null,
          houseSystem: data.houseSystem,
          resultJson,
          interpretation: data.interpretation ?? "",
        },
        select: { id: true, mapNumber: true },
      });
      if (data.mapNumber) {
        await tx.calculation.updateMany({
          where: { mapNumber: data.mapNumber, userId: session.userId },
          data: { saved: true },
        });
      }
      return savedChart;
    });

    return NextResponse.json({ saved: true, savedId: chart.id, mapNumber: chart.mapNumber }, { status: 201 });
  } catch (error) {
    console.error("Could not save chart from interpretation room", error);
    return NextResponse.json({ error: "რუკის შენახვა ვერ შესრულდა. სცადეთ ხელახლა." }, { status: 500 });
  }
}
