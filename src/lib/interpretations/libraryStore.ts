import { prisma } from "@/lib/db";
import type { LibraryInsight } from "./library";
import { localizeInterpretation } from "./translation";

export interface LibraryMatchContext {
  chartType: "NATAL" | "SYNASTRY" | "TRANSIT" | "ELEMENT_TEMPERAMENT";
  planets?: Array<{ name: string; sign?: string; house?: number }>;
  aspects?: Array<{ a: string; b: string; aspect: string }>;
  elements?: Record<string, number>;
  requireElementTag?: boolean;
  includeNativeLanguage?: boolean;
}

/** Persist only curated/original entries; failure must never block a chart. */
export async function persistLibraryEntries(entries: LibraryInsight[]): Promise<void> {
  if (process.env.PERSIST_INTERPRETATION_LIBRARY === "false") return;
  try {
    await Promise.all(entries.map((entry) => prisma.interpretationLibraryEntry.upsert({
      where: { entryKey: entry.key },
      create: {
        entryKey: entry.key,
        chartType: entry.chartType,
        language: entry.language,
        sourceText: entry.text,
        sourceUrl: entry.sourceUrl,
        license: entry.license,
        sourceHash: entry.fingerprint,
        tagsJson: JSON.stringify([]),
        active: true,
      },
      update: {
        sourceText: entry.text,
        sourceHash: entry.fingerprint,
        sourceUrl: entry.sourceUrl,
        license: entry.license,
        active: true,
      },
    })));
  } catch (error) {
    console.error("Interpretation library persistence failed", error instanceof Error ? error.message : error);
  }
}

function matchesTags(tags: Record<string, unknown>, context: LibraryMatchContext): boolean {
  if (context.requireElementTag && typeof tags.element !== "string") return false;
  if (typeof tags.element === "string" && (!context.elements || !(tags.element in context.elements))) return false;
  if (typeof tags.planet === "string" && !context.planets?.some((planet) => planet.name === tags.planet)) return false;
  if (typeof tags.sign === "string" && !context.planets?.some((planet) => planet.sign === tags.sign)) return false;
  if (typeof tags.house === "number" && !context.planets?.some((planet) => planet.house === tags.house)) return false;
  if (typeof tags.aspect === "string" && !context.aspects?.some((aspect) => aspect.aspect === tags.aspect)) return false;
  if (typeof tags.a === "string" && !context.aspects?.some((aspect) => aspect.a === tags.a || aspect.b === tags.a)) return false;
  if (typeof tags.b === "string" && !context.aspects?.some((aspect) => aspect.a === tags.b || aspect.b === tags.b)) return false;
  return true;
}

/** Load only external-language entries and translate them through the cache. */
export async function translatedExternalLibraryEntries(context: LibraryMatchContext): Promise<string[]> {
  try {
    const rows = await prisma.interpretationLibraryEntry.findMany({
      where: { chartType: context.chartType, active: true, language: context.includeNativeLanguage ? undefined : { not: "ka" } },
      orderBy: { entryKey: "asc" },
      take: 80,
    });
    const result: string[] = [];
    for (const row of rows) {
      let tags: Record<string, unknown> = {};
      try { tags = JSON.parse(row.tagsJson) as Record<string, unknown>; } catch { /* malformed optional tags are ignored */ }
      if (!matchesTags(tags, context)) continue;
      const translated = await localizeInterpretation(row.sourceText, row.language, "ka");
      result.push(translated.text);
    }
    return result;
  } catch (error) {
    console.error("External interpretation library lookup failed", error instanceof Error ? error.message : error);
    return [];
  }
}
