import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeSolarArcDirections } from "@/lib/astro/directions";
import { isWideDate } from "@/lib/astro/wideDate";
import type { CalculationOptions } from "@/lib/astro/ephemeris";

const calculationSchema = z.object({
  ephemeris: z.enum(["swiss", "astronomy"]).default("swiss"),
  zodiac: z.enum(["tropical", "sidereal"]).default("tropical"),
  siderealMode: z.number().int().min(0).max(255).default(1),
  nodeType: z.enum(["mean", "true"]).default("mean"),
  topocentric: z.boolean().default(false), altitudeMeters: z.number().finite().min(-500).max(10000).default(0),
  includeAsteroids: z.boolean().default(false),
}) satisfies z.ZodType<CalculationOptions>;

const schema = z.object({
  natal: z.object({
    name: z.string().min(1), date: z.string().refine(isWideDate), time: z.string().regex(/^\d{2}:\d{2}$/),
    place: z.string().min(1), lat: z.number(), lon: z.number(), timezone: z.string().min(1),
  }),
  targetDate: z.string().refine(isWideDate),
  houseSystem: z.enum(["whole_sign", "equal", "porphyry", "placidus"]).default("placidus"),
  calculation: calculationSchema.optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "არასწორი მონაცემები" }, { status: 400 });
  try {
    const result = computeSolarArcDirections({ ...parsed.data.natal, calculation: parsed.data.calculation }, parsed.data.targetDate, parsed.data.houseSystem);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Solar Arc-ის გამოთვლა ვერ შესრულდა" }, { status: 400 });
  }
}
