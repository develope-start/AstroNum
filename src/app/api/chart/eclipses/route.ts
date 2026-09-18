import { NextRequest, NextResponse } from "next/server";
import { dateToJulianDay, findNextLunarEclipse, findNextSolarEclipse, julianDayToDate } from "@swisseph/node";
import { z } from "zod";
import { isWideDate, wideDateToUtcDate } from "@/lib/astro/wideDate";

const schema = z.object({
  type: z.enum(["solar", "lunar"]),
  startDate: z.string().refine(isWideDate, "დაწყების თარიღი არასწორია"),
  backward: z.boolean().default(false),
});

function dateFromJulianDay(julianDay: number): string {
  const date = julianDayToDate(julianDay);
  return `${String(date.year).padStart(5, date.year < 0 ? "-" : "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")} ${date.hour.toFixed(4)} UTC`;
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "არასწორი მონაცემები" }, { status: 400 });
  const start = wideDateToUtcDate(parsed.data.startDate);
  if (!start) return NextResponse.json({ error: "დაწყების თარიღი ვერ გარდაიქმნა" }, { status: 400 });
  try {
    const eclipse = parsed.data.type === "solar"
      ? findNextSolarEclipse(dateToJulianDay(start), undefined, 0, parsed.data.backward)
      : findNextLunarEclipse(dateToJulianDay(start), undefined, 0, parsed.data.backward);
    return NextResponse.json({
      type: parsed.data.type,
      maximum: dateFromJulianDay(eclipse.maximum),
      partialBegin: dateFromJulianDay(eclipse.partialBegin),
      partialEnd: dateFromJulianDay(eclipse.partialEnd),
      totalBegin: "totalBegin" in eclipse && eclipse.totalBegin ? dateFromJulianDay(eclipse.totalBegin) : null,
      totalEnd: "totalEnd" in eclipse && eclipse.totalEnd ? dateFromJulianDay(eclipse.totalEnd) : null,
      centralBegin: "centralBegin" in eclipse && eclipse.centralBegin ? dateFromJulianDay(eclipse.centralBegin) : null,
      centralEnd: "centralEnd" in eclipse && eclipse.centralEnd ? dateFromJulianDay(eclipse.centralEnd) : null,
      eclipseType: eclipse.type,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "დაბნელების გამოთვლა ვერ შესრულდა" }, { status: 400 });
  }
}
