import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ELEMENTS = ["fire", "earth", "air", "water"] as const;

type TemperamentEntry = {
  temperament?: string;
  short?: string;
  description?: string;
};

export async function GET() {
  try {
    const rows = await prisma.interpretationLibraryEntry.findMany({
      where: { chartType: "ELEMENT_TEMPERAMENT", language: "ka", active: true },
      orderBy: { entryKey: "asc" },
      select: { tagsJson: true, sourceText: true },
    });

    const entries: Record<string, TemperamentEntry> = {};
    for (const row of rows) {
      let tags: { element?: string; temperament?: string; short?: string } = {};
      try {
        tags = JSON.parse(row.tagsJson) as typeof tags;
      } catch {
        tags = {};
      }

      if (tags.element && ELEMENTS.includes(tags.element as (typeof ELEMENTS)[number])) {
        entries[tags.element] = {
          temperament: tags.temperament,
          short: tags.short,
          description: row.sourceText,
        };
      }
    }

    return NextResponse.json({ entries, source: "interpretation-library" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // The page has a curated local fallback, so a temporary database outage must not hide the UI.
    return NextResponse.json({ entries: {}, source: "local-fallback" }, { headers: { "Cache-Control": "no-store" } });
  }
}
