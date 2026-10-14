import { calculateElementBalance, ELEMENT_IDS, type ElementId } from "@/lib/elementBalance";
import { computeAspects, type AspectHit } from "@/lib/astro/aspects";
import type { PlanetPosition } from "@/lib/astro/positions";
import { eclipticToSign, formatDegree } from "@/lib/astro/signs";

export const ELEMENT_PLANET_NAMES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;

const ELEMENT_NAMES: Record<ElementId, string> = {
  fire: "ცეცხლი",
  earth: "მიწა",
  air: "ჰაერი",
  water: "წყალი",
};

const PLANET_NAMES_KA: Record<(typeof ELEMENT_PLANET_NAMES)[number], string> = {
  Sun: "მზე",
  Moon: "მთვარე",
  Mercury: "მერკური",
  Venus: "ვენერა",
  Mars: "მარსი",
  Jupiter: "იუპიტერი",
  Saturn: "სატურნი",
  Uranus: "ურანი",
  Neptune: "ნეპტუნი",
  Pluto: "პლუტონი",
};

export type CurrentTransitElementSnapshot = {
  computedAt: string;
  balance: ReturnType<typeof calculateElementBalance>;
  elements: Array<{ id: ElementId; name: string; count: number; percentage: number }>;
  planets: Array<{
    name: string;
    nameKa: string;
    longitude: number;
    sign: string;
    degree: string;
    retrograde: boolean;
  }>;
  aspects: AspectHit[];
};

export function buildCurrentTransitElementSnapshot(
  at: Date,
  positions: readonly PlanetPosition[],
): CurrentTransitElementSnapshot {
  if (!Number.isFinite(at.getTime())) throw new Error("Invalid current transit timestamp");

  const planets = ELEMENT_PLANET_NAMES.map((name) => positions.find((position) => position.name === name))
    .filter((position): position is PlanetPosition => Boolean(position));
  if (planets.length !== ELEMENT_PLANET_NAMES.length) {
    throw new Error("Current transit calculation is missing one or more classical planets");
  }

  const balance = calculateElementBalance(planets);
  const elements = ELEMENT_IDS.map((id) => ({
    id,
    name: ELEMENT_NAMES[id],
    count: balance.counts[id],
    percentage: balance.percentages[id],
  }));
  const planetDetails = planets.map((planet) => {
    const sign = eclipticToSign(planet.longitude);
    const name = planet.name as (typeof ELEMENT_PLANET_NAMES)[number];
    return {
      name: planet.name,
      nameKa: PLANET_NAMES_KA[name],
      longitude: planet.longitude,
      sign: sign.signName,
      degree: formatDegree(sign.degreeInSign),
      retrograde: planet.retrograde,
    };
  });
  const aspects = computeAspects(planets).filter((aspect) => aspect.kind === "major").slice(0, 8);

  return {
    computedAt: at.toISOString(),
    balance,
    elements,
    planets: planetDetails,
    aspects,
  };
}
