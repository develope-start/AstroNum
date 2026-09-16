import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/astro/geo";

export async function GET(req: NextRequest) {
  const latStr = req.nextUrl.searchParams.get("lat");
  const lonStr = req.nextUrl.searchParams.get("lon");
  const lat = latStr ? parseFloat(latStr) : NaN;
  const lon = lonStr ? parseFloat(lonStr) : NaN;

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "lat/lon პარამეტრები საჭიროა" }, { status: 400 });
  }

  const result = await reverseGeocode(lat, lon);
  return NextResponse.json(result);
}
