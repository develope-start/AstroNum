import { NextRequest, NextResponse } from "next/server";
import { computePlanetPositions } from "@/lib/astro/positions";
import { metadata, resolveCalculationOptions } from "@/lib/astro/ephemeris";
import { buildCurrentTransitElementSnapshot } from "@/lib/astro/currentTransitElements";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "transits:current-elements"), 30, 5 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "მიმდინარე ცის მოთხოვნების ლიმიტი ამოიწურა. სცადეთ მოგვიანებით." },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } },
    );
  }

  const computedAt = new Date();
  try {
    const options = resolveCalculationOptions();
    const positions = computePlanetPositions(computedAt, options)
      .filter((planet) => ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(planet.name));
    const snapshot = buildCurrentTransitElementSnapshot(computedAt, positions);
    return NextResponse.json(
      { ...snapshot, ephemeris: metadata(options, computedAt) },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } },
    );
  } catch (error) {
    console.error("Current transit element calculation failed:", error);
    return NextResponse.json(
      { error: "მიმდინარე ტრანზიტული სტიქიების გამოთვლა ვერ მოხერხდა." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
