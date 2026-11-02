import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import * as Astronomy from "astronomy-engine";
import { computeAngles, computePlanetPositions } from "@/lib/astro/positions";
import { eclipticToSign, PLANET_NAMES_KA } from "@/lib/astro/signs";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TBILISI = { latitude: 41.6938, longitude: 44.8015, timezone: "Asia/Tbilisi" };
const CLASSICAL_PLANETS = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]);
const SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃",
  Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};
const COLORS: Record<string, string> = {
  Sun: "text-amber-300", Moon: "text-sky-200", Mercury: "text-slate-300", Venus: "text-pink-300", Mars: "text-rose-400",
  Jupiter: "text-orange-300", Saturn: "text-yellow-600", Uranus: "text-teal-300", Neptune: "text-indigo-300", Pluto: "text-violet-400",
};
const SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const SIGN_ELEMENTS = ["fire", "earth", "air", "water", "fire", "earth", "air", "water", "fire", "earth", "air", "water"] as const;
const ASPECTS = [
  { name: "კონიუნქცია", symbol: "☌", angle: 0, orb: 8, score: 7, type: "harmonic" as const },
  { name: "სექსტილი", symbol: "⚹", angle: 60, orb: 6, score: 6, type: "harmonic" as const },
  { name: "ტრიგონი", symbol: "△", angle: 120, orb: 8, score: 9, type: "harmonic" as const },
  { name: "კვადრატი", symbol: "□", angle: 90, orb: 8, score: -7, type: "tense" as const },
  { name: "ოპოზიცია", symbol: "☍", angle: 180, orb: 8, score: -8, type: "tense" as const },
  { name: "კვინკუნქსი", symbol: "⚻", angle: 150, orb: 3, score: -4, type: "tense" as const },
];

function livePoint(name: string, longitude: number, speed: number) {
  const sign = eclipticToSign(longitude);
  const degree = Math.floor(sign.degreeInSign);
  return {
    name,
    nameKa: PLANET_NAMES_KA[name] ?? name,
    symbol: SYMBOLS[name] ?? "•",
    longitude,
    signIndex: sign.signIndex,
    signKa: sign.signName,
    signSymbol: SIGN_SYMBOLS[sign.signIndex]!,
    deg: degree,
    min: Math.floor((sign.degreeInSign - degree) * 60),
    retrograde: speed < 0,
    element: SIGN_ELEMENTS[sign.signIndex]!,
    color: COLORS[name] ?? "text-slate-300",
  };
}

type LivePlanet = ReturnType<typeof livePoint>;

function elementBalance(planets: LivePlanet[]) {
  const counts = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const planet of planets) counts[planet.element] += 1;
  const total = planets.length || 1;
  return {
    fire: Math.round((counts.fire / total) * 100),
    earth: Math.round((counts.earth / total) * 100),
    air: Math.round((counts.air / total) * 100),
    water: Math.round((counts.water / total) * 100),
  };
}

function strongestAspects(planets: LivePlanet[]) {
  const hits: Array<{ planet1: string; planet2: string; symbol1: string; symbol2: string; aspectName: string; aspectSymbol: string; orb: number; score: number; type: "harmonic" | "tense" }> = [];
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const first = planets[i]!;
      const second = planets[j]!;
      const distance = Math.min(Math.abs(first.longitude - second.longitude), 360 - Math.abs(first.longitude - second.longitude));
      const aspect = ASPECTS.find((candidate) => Math.abs(distance - candidate.angle) <= candidate.orb);
      if (!aspect) continue;
      hits.push({
        planet1: first.nameKa,
        planet2: second.nameKa,
        symbol1: first.symbol,
        symbol2: second.symbol,
        aspectName: aspect.name,
        aspectSymbol: aspect.symbol,
        orb: Math.round(Math.abs(distance - aspect.angle) * 10) / 10,
        score: aspect.score,
        type: aspect.type,
      });
    }
  }
  return hits.sort((a, b) => Math.abs(b.score) - Math.abs(a.score) || a.orb - b.orb).slice(0, 6);
}

function lunarCalendar(now: Date, local: DateTime) {
  const localDate = local.toFormat("yyyy-MM-dd");
  const lastNewMoon = Astronomy.SearchMoonPhase(0, now, -35);
  const nextFullMoon = Astronomy.SearchMoonPhase(180, now, 35);
  const previousFullMoon = Astronomy.SearchMoonPhase(180, now, -35);
  const nextNewMoon = Astronomy.SearchMoonPhase(0, now, 35);
  if (!lastNewMoon || !nextFullMoon || !previousFullMoon || !nextNewMoon) throw new Error("Could not calculate lunar phases.");

  const phaseDate = (event: { date: Date }) => DateTime.fromJSDate(event.date, { zone: "utc" }).setZone(TBILISI.timezone).toFormat("yyyy-MM-dd");
  const phase = [lastNewMoon, nextNewMoon].some((event) => phaseDate(event) === localDate)
    ? "new" as const
    : [previousFullMoon, nextFullMoon].some((event) => phaseDate(event) === localDate)
      ? "full" as const
      : null;
  const month = local.month;
  const year = local.year;
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1, 8));
  const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, 1 - mondayOffset + index, 8));
    const previousNewMoon = Astronomy.SearchMoonPhase(0, date, -35);
    if (!previousNewMoon) throw new Error("Could not calculate a lunar calendar day.");
    return {
      date: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`,
      dayOfMonth: date.getUTCDate(),
      lunarDay: Math.floor((date.getTime() - previousNewMoon.date.getTime()) / 86_400_000) + 1,
      isCurrentMonth: date.getUTCMonth() === month - 1 && date.getUTCFullYear() === year,
    };
  });
  return {
    lunarDay: Math.floor((now.getTime() - lastNewMoon.date.getTime()) / 86_400_000) + 1,
    daysSinceNewMoon: (now.getTime() - lastNewMoon.date.getTime()) / 86_400_000,
    daysUntilFullMoon: (nextFullMoon.date.getTime() - now.getTime()) / 86_400_000,
    phase,
    month,
    year,
    days,
  };
}

export async function GET(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "transits:live"), 30, 5 * 60 * 1000);
  if (!limiter.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } });

  try {
    const instant = new Date();
    const options = { ephemeris: "astronomy" as const };
    const planets = computePlanetPositions(instant, options, TBILISI.longitude, TBILISI.latitude)
      .filter((planet) => CLASSICAL_PLANETS.has(planet.name))
      .map((planet) => livePoint(planet.name, planet.longitude, planet.speed));
    const angles = computeAngles(instant, TBILISI.longitude, TBILISI.latitude, options);
    const ascendant = livePoint("Ascendant", angles.ascendant, 0);
    const mc = livePoint("MC", angles.mc, 0);
    const local = DateTime.fromJSDate(instant, { zone: "utc" }).setZone(TBILISI.timezone);

    return NextResponse.json({
      planets,
      elements: elementBalance(planets),
      synastryAspects: strongestAspects(planets),
      lunarCalendar: lunarCalendar(instant, local),
      angles: {
        ascendant: angles.ascendant,
        mc: angles.mc,
        ascSignKa: ascendant.signKa,
        ascSignSymbol: ascendant.signSymbol,
        ascDeg: ascendant.deg,
        ascMin: ascendant.min,
        mcSignKa: mc.signKa,
        mcSignSymbol: mc.signSymbol,
        mcDeg: mc.deg,
        mcMin: mc.min,
      },
      utcIso: instant.toISOString(),
      utcTime: `${instant.toISOString().slice(11, 16)} UTC`,
      tbilisiTime: `${local.toFormat("HH:mm")} (${local.toFormat("ZZ")})`,
      date: local.toFormat("yyyy-MM-dd"),
      ephemeris: "astronomy",
    }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } });
  } catch (error) {
    console.error("Astronomy Engine live transit calculation failed:", error);
    return NextResponse.json({ error: "Live Astronomy Engine calculation is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
