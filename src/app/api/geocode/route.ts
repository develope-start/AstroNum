import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/astro/geo";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(10, Math.max(1, parseInt(limitParam, 10) || 6)) : 6;

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "მოძებნეთ ადგილის სახელით (მინ. 2 სიმბოლო)" }, { status: 400 });
  }
  const results = await searchPlaces(q.trim(), limit);
  if (!results.length) {
    return NextResponse.json({ results: [], error: "ადგილი ვერ მოიძებნა — სცადეთ უფრო ზუსტი დასახელება" }, { status: 200 });
  }
  return NextResponse.json({ results });
}
