import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/astro/geo";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "geocode:reverse"), 60, 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many location searches. Try again later." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } });
  }
  const latStr = req.nextUrl.searchParams.get("lat");
  const lonStr = req.nextUrl.searchParams.get("lon");
  const lat = latStr ? parseFloat(latStr) : NaN;
  const lon = lonStr ? parseFloat(lonStr) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "lat/lon პარამეტრები საჭიროა" }, { status: 400 });
  }

  const result = await reverseGeocode(lat, lon);
  return NextResponse.json(result);
}
