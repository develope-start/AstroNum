import { prisma } from "@/lib/db";
import { ELEMENT_SYNTHESIS, ELEMENT_TEMPERAMENTS } from "@/lib/elementTemperaments";
import { calculateElementBalance, ELEMENT_IDS, type BalancePlanet, type ElementBalance, type ElementId } from "@/lib/elementBalance";
import { translatedExternalLibraryEntries } from "./libraryStore";

export const ELEMENT_BALANCE_LIBRARY_VERSION = "2026.09.19.1";

const ELEMENT_NAMES: Record<ElementId, string> = {
  fire: "ცეცხლი",
  earth: "მიწა",
  air: "ჰაერი",
  water: "წყალი",
};

const ELEMENT_LEVELS: Record<ElementId, string> = {
  fire: "მოქმედების, ინიციატივისა და მიზანმიმართული იმპულსის წილი",
  earth: "სტაბილურობის, პრაქტიკულობისა და შედეგის შექმნის წილი",
  air: "აზროვნების, კომუნიკაციისა და სოციალური მოქნილობის წილი",
  water: "ემოციური აღქმის, ინტუიციისა და სიღრმის წილი",
};

function levelText(percentage: number) {
  if (percentage >= 60) return "ძალიან ძლიერი დომინირებაა";
  if (percentage >= 40) return "დომინანტურ, წამყვან ფენას ქმნის";
  if (percentage >= 25) return "გამოკვეთილ და ხშირად შესამჩნევ ტენდენციას ქმნის";
  return "დამხმარე, მაგრამ მაინც მოქმედი ფენაა";
}

function combinationText(active: ElementId[]) {
  if (active.length < 2) return "";
  const names = new Set(active.slice(0, 2).map((id) => ELEMENT_NAMES[id]));
  const match = ELEMENT_SYNTHESIS.find((item) => {
    const parts = item.combination.split(" + ");
    return parts.length === 2 && parts.every((part) => names.has(part));
  });
  return match ? `ამ წყვილის საერთო დინამიკა შეიძლება გამოიხატოს როგორც „${match.syndrome}“: ${match.manifestation}` : "ამ ორი წამყვანი ფენის კომბინაცია ქმნის ინდივიდუალურ სტილს, სადაც მათი რესურსები ერთდროულად მუშაობს.";
}

function builtInElementBalanceText(balance: ElementBalance) {
  if (!balance.total) {
    return "## სტიქიების პროცენტული სინთეზი\n\nსტიქიური განაწილება ვერ გამოითვალა, რადგან რუკაში შესაბამისი პლანეტური პოზიციები არ მოიძებნა.";
  }

  const ranked = [...ELEMENT_IDS].sort((a, b) => balance.percentages[b] - balance.percentages[a]);
  const active = ranked.filter((id) => balance.percentages[id] > 0);
  const distribution = ranked.map((id) => `${ELEMENT_TEMPERAMENTS[id].icon} ${ELEMENT_NAMES[id]} — ${balance.percentages[id]}% (${balance.counts[id]} პოზიცია)`).join(", ");
  const lines = [
    "## სტიქიების პროცენტული სინთეზი",
    `რუკის აქტიურ პლანეტურ პოზიციებში სტიქიები ასე ნაწილდება: ${distribution}. პროცენტები ასახავს შედარებით წონას და არა ადამიანის უცვლელ ტიპაჟს — საბოლოო სურათს ასპექტები, სახლები, კუთხეები და ცხოვრებისეული არჩევანი ავსებს.`,
  ];

  for (const id of active) {
    const guide = ELEMENT_TEMPERAMENTS[id];
    const percentage = balance.percentages[id];
    lines.push(`**${guide.icon} ${ELEMENT_NAMES[id]} — ${percentage}%** — ${levelText(percentage)}; ეს არის ${ELEMENT_LEVELS[id]}. ${guide.short} ${guide.description}`);
  }

  const combination = combinationText(active);
  if (combination) lines.push(`**საერთო კომბინაცია:** ${combination}.`);
  lines.push("ეს სინთეზი არის რუკის პროპორციული, საშუალო დონის დახასიათება: მაღალი პროცენტი მიუთითებს იმ თვისებების ხშირ აქტივაციაზე, დაბალი პროცენტი კი ნიშნავს, რომ შესაბამისი რესურსი სუსტ ფონად მუშაობს და სხვა სტიქიების ბალანსით ივსება.");
  return lines.join("\n\n");
}

export async function getElementBalanceInterpretation(balance: ElementBalance): Promise<string> {
  const cacheKey = `${ELEMENT_BALANCE_LIBRARY_VERSION}|${balance.distributionKey}`;
  const builtInText = builtInElementBalanceText(balance);
  if (!balance.total) return builtInText;

  try {
    const cached = await prisma.elementBalanceInterpretation.findUnique({
      where: { cacheKey },
      select: { interpretationText: true },
    });
    if (cached?.interpretationText) return cached.interpretationText;
  } catch (error) {
    console.error("Element balance cache lookup failed", error instanceof Error ? error.message : error);
  }

  let interpretationText = builtInText;
  try {
    const external = await translatedExternalLibraryEntries({
      chartType: "ELEMENT_TEMPERAMENT",
      elements: Object.fromEntries(ELEMENT_IDS.map((id) => [id, balance.percentages[id]])),
      requireElementTag: true,
      includeNativeLanguage: true,
    });
    const novelExternal = external.filter((item) => !builtInText.includes(item)).slice(0, 2);
    if (novelExternal.length) {
      interpretationText = `${builtInText}\n\n### დამატებითი ბიბლიოთეკური კონტექსტი\n\n${novelExternal.join("\n\n")}`;
    }
  } catch (error) {
    console.error("Element balance external lookup failed", error instanceof Error ? error.message : error);
  }

  try {
    await prisma.elementBalanceInterpretation.create({
      data: {
        cacheKey,
        distributionKey: balance.distributionKey,
        countsJson: JSON.stringify(balance.counts),
        percentagesJson: JSON.stringify(balance.percentages),
        sourceText: builtInText,
        interpretationText,
        sourceUrl: "https://en.wikipedia.org/wiki/Astrology_and_the_classical_elements",
        provider: externalProviderName(),
        providerVersion: ELEMENT_BALANCE_LIBRARY_VERSION,
      },
    });
  } catch (error) {
    try {
      const raced = await prisma.elementBalanceInterpretation.findUnique({ where: { cacheKey }, select: { interpretationText: true } });
      if (raced?.interpretationText) return raced.interpretationText;
    } catch { /* cache failures must never block a chart */ }
    console.error("Element balance cache write failed", error instanceof Error ? error.message : error);
  }
  return interpretationText;
}

function externalProviderName() {
  return process.env.LIBRETRANSLATE_URL?.trim() ? "builtin+library+libretranslate" : "builtin+library";
}

export async function appendElementBalanceInterpretation(existing: string | null | undefined, result: unknown): Promise<string | null> {
  if (existing?.includes("## სტიქიების პროცენტული სინთეზი")) return existing;
  if (!result || typeof result !== "object") return existing ?? null;
  const value = result as { planets?: unknown };
  if (!Array.isArray(value.planets)) return existing ?? null;
  const planets = value.planets.filter((planet): planet is BalancePlanet => Boolean(planet) && typeof planet === "object" && typeof (planet as { name?: unknown }).name === "string" && typeof (planet as { longitude?: unknown }).longitude === "number");
  const balance = calculateElementBalance(planets);
  const synthesis = await getElementBalanceInterpretation(balance);
  return existing ? `${existing}\n\n${synthesis}` : synthesis;
}

export function elementBalanceMetadata(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const planets = (result as { planets?: unknown }).planets;
  if (!Array.isArray(planets)) return null;
  const valid = planets.filter((planet): planet is BalancePlanet => Boolean(planet) && typeof planet === "object" && typeof (planet as { name?: unknown }).name === "string" && typeof (planet as { longitude?: unknown }).longitude === "number");
  const balance = calculateElementBalance(valid);
  return { counts: balance.counts, percentages: balance.percentages, total: balance.total, distributionKey: balance.distributionKey };
}
