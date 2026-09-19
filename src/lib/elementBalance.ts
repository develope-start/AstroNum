import { eclipticToSign } from "@/lib/astro/signs";

export const ELEMENT_IDS = ["fire", "earth", "air", "water"] as const;
export type ElementId = (typeof ELEMENT_IDS)[number];
export type BalancePlanet = { name: string; longitude: number };

export type ElementBalance = {
  counts: Record<ElementId, number>;
  percentages: Record<ElementId, number>;
  total: number;
  distributionKey: string;
};

function isNode(name: string) {
  return name === "TrueNode" || name === "MeanNode";
}

function elementFromLongitude(longitude: number): ElementId {
  const index = eclipticToSign(longitude).signIndex;
  return ELEMENT_IDS[index % 4] ?? "fire";
}

function percentageParts(counts: Record<ElementId, number>, total: number): Record<ElementId, number> {
  if (!total) return { fire: 0, earth: 0, air: 0, water: 0 };

  const raw = ELEMENT_IDS.map((id, index) => ({
    id,
    index,
    value: (counts[id] / total) * 100,
    floor: Math.floor((counts[id] / total) * 100),
  }));
  let remainder = 100 - raw.reduce((sum, item) => sum + item.floor, 0);
  const percentages = Object.fromEntries(ELEMENT_IDS.map((id) => [id, counts[id] ? Math.floor((counts[id] / total) * 100) : 0])) as Record<ElementId, number>;
  for (const item of [...raw].sort((a, b) => (b.value - b.floor) - (a.value - a.floor) || a.index - b.index)) {
    if (remainder <= 0) break;
    if (item.floor > 0 || counts[item.id] > 0) {
      percentages[item.id] += 1;
      remainder -= 1;
    }
  }
  return percentages;
}

export function calculateElementBalance(planets: readonly BalancePlanet[]): ElementBalance {
  const counts: Record<ElementId, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const planet of planets) {
    if (isNode(planet.name) || !Number.isFinite(planet.longitude)) continue;
    counts[elementFromLongitude(planet.longitude)] += 1;
  }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const percentages = percentageParts(counts, total);
  return {
    counts,
    percentages,
    total,
    distributionKey: ELEMENT_IDS.map((id) => `${id}:${percentages[id]}`).join("|"),
  };
}
