import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Astronomy from "astronomy-engine";
import { isWideDate, wideDateToUtcDate } from "@/lib/astro/wideDate";
import { requireFeatureAccess } from "@/lib/billing/access";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const schema = z.object({
  type: z.enum(["solar", "lunar"]),
  startDate: z.string().refine(isWideDate, "დაწყების თარიღი არასწორია"),
  backward: z.boolean().default(false),
});

function formatUtc(date: Date): string {
  return `${date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC")}`;
}

function offsetMinutes(date: Date, minutes: number): string | null {
  return minutes !== 0 ? formatUtc(new Date(date.getTime() + minutes * 60_000)) : null;
}

/** Astronomy Engine has forward searches; this bounded scan finds the last event without Swiss. */
function previousEclipse(type: "solar" | "lunar", start: Date) {
  const minimum = new Date(start.getTime() - 400 * 86_400_000);
  let event = type === "solar" ? Astronomy.SearchGlobalSolarEclipse(minimum) : Astronomy.SearchLunarEclipse(minimum);
  let previous = event;
  for (let index = 0; index < 8; index += 1) {
    if (event.peak.date.getTime() >= start.getTime()) break;
    previous = event;
    event = type === "solar" ? Astronomy.NextGlobalSolarEclipse(event.peak) : Astronomy.NextLunarEclipse(event.peak);
  }
  return previous;
}

export async function POST(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "chart:eclipses"), 20, 5 * 60 * 1000);
  if (!limiter.allowed) return NextResponse.json({ error: "მოთხოვნების ლიმიტი ამოიწურა. სცადეთ მოგვიანებით." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } });
  const accessDenied = await requireFeatureAccess(req, "eclipses");
  if (accessDenied) return accessDenied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "არასწორი მონაცემები" }, { status: 400 });
  const start = wideDateToUtcDate(parsed.data.startDate);
  if (!start) return NextResponse.json({ error: "დაწყების თარიღი ვერ გარდაიქმნა" }, { status: 400 });
  try {
    if (parsed.data.type === "solar") {
      const eclipse = (parsed.data.backward ? previousEclipse("solar", start) : Astronomy.SearchGlobalSolarEclipse(start)) as Astronomy.GlobalSolarEclipseInfo;
      return NextResponse.json({
        engine: "astronomy", type: "solar", maximum: formatUtc(eclipse.peak.date),
        partialBegin: null, partialEnd: null, totalBegin: null, totalEnd: null, centralBegin: null, centralEnd: null,
        eclipseType: eclipse.kind, obscuration: eclipse.obscuration ?? null,
        centralLatitude: eclipse.latitude ?? null, centralLongitude: eclipse.longitude ?? null,
      });
    }
    const eclipse = (parsed.data.backward ? previousEclipse("lunar", start) : Astronomy.SearchLunarEclipse(start)) as Astronomy.LunarEclipseInfo;
    return NextResponse.json({
      engine: "astronomy", type: "lunar", maximum: formatUtc(eclipse.peak.date),
      partialBegin: offsetMinutes(eclipse.peak.date, -eclipse.sd_partial), partialEnd: offsetMinutes(eclipse.peak.date, eclipse.sd_partial),
      totalBegin: offsetMinutes(eclipse.peak.date, -eclipse.sd_total), totalEnd: offsetMinutes(eclipse.peak.date, eclipse.sd_total),
      centralBegin: null, centralEnd: null, eclipseType: eclipse.kind,
      penumbralBegin: offsetMinutes(eclipse.peak.date, -eclipse.sd_penum), penumbralEnd: offsetMinutes(eclipse.peak.date, eclipse.sd_penum), obscuration: eclipse.obscuration,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "დაბნელების გამოთვლა ვერ შესრულდა" }, { status: 400 });
  }
}
