export interface AspectDef {
  name: string;
  nameKa: string;
  angle: number;
  orb: number;
  kind: "major" | "minor";
}

export const MAJOR_ASPECTS: AspectDef[] = [
  { name: "Conjunction", nameKa: "შეერთება", angle: 0, orb: 8, kind: "major" },
  { name: "Sextile", nameKa: "სექსტილი", angle: 60, orb: 4, kind: "major" },
  { name: "Square", nameKa: "კვადრატურა", angle: 90, orb: 6, kind: "major" },
  { name: "Trine", nameKa: "ტრინი", angle: 120, orb: 6, kind: "major" },
  { name: "Opposition", nameKa: "ოპოზიცია", angle: 180, orb: 8, kind: "major" },
];

export const MINOR_ASPECTS: AspectDef[] = [
  { name: "SemiSextile", nameKa: "ნახევარსექსტილი", angle: 30, orb: 2, kind: "minor" },
  { name: "SemiSquare", nameKa: "ნახევარკვადრატურა", angle: 45, orb: 2, kind: "minor" },
  { name: "Quintile", nameKa: "ქვინტილი", angle: 72, orb: 2, kind: "minor" },
  { name: "Sesquiquadrate", nameKa: "სესკიქვადრატურა", angle: 135, orb: 2, kind: "minor" },
  { name: "Biquintile", nameKa: "ბიქვინტილი", angle: 144, orb: 2, kind: "minor" },
  { name: "Quincunx", nameKa: "ქვინკუნქსი", angle: 150, orb: 3, kind: "minor" },
];

export const ALL_ASPECTS: AspectDef[] = [...MAJOR_ASPECTS, ...MINOR_ASPECTS];

export interface AspectHit {
  a: string;
  b: string;
  aspect: string;
  aspectKa: string;
  exactAngle: number;
  orb: number;
  applying: boolean;
  kind: "major" | "minor";
}

function angularDistance(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

export function computeAspects(
  pointsA: { name: string; longitude: number; speed?: number }[],
  pointsB?: { name: string; longitude: number; speed?: number }[],
  aspectDefs: AspectDef[] = ALL_ASPECTS,
): AspectHit[] {
  const hits: AspectHit[] = [];
  const listB = pointsB ?? pointsA;
  const sameSet = !pointsB;

  for (let i = 0; i < pointsA.length; i += 1) {
    const startJ = sameSet ? i + 1 : 0;
    for (let j = startJ; j < listB.length; j += 1) {
      const p1 = pointsA[i]!;
      const p2 = listB[j]!;
      if (sameSet && p1.name === p2.name) continue;

      const dist = angularDistance(p1.longitude, p2.longitude);
      for (const def of aspectDefs) {
        const delta = Math.abs(dist - def.angle);
        if (delta > def.orb) continue;

        const probeDays = 1 / 1440;
        const probeDistance = angularDistance(
          p1.longitude + (p1.speed ?? 0) * probeDays,
          p2.longitude + (p2.speed ?? 0) * probeDays,
        );
        const probeDelta = Math.abs(probeDistance - def.angle);
        hits.push({
          a: p1.name,
          b: p2.name,
          aspect: def.name,
          aspectKa: def.nameKa,
          exactAngle: def.angle,
          orb: Math.round(delta * 100) / 100,
          applying: probeDelta < delta - 1e-9,
          kind: def.kind,
        });
        break;
      }
    }
  }

  return hits.sort((a, b) => a.orb - b.orb);
}
