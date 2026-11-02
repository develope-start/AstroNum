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

export type AspectPatternKind = "grand_trine" | "t_square" | "grand_cross" | "yod" | "stellium";

export interface AspectPattern {
  kind: AspectPatternKind;
  nameKa: string;
  points: string[];
  /** Exactness score is the mean orb of the aspects that form the pattern. */
  meanOrb: number;
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

const PATTERN_PLANETS = new Set([
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
]);

function keyForPoints(points: string[]): string {
  return [...points].sort().join("|");
}

function hitBetween(aspects: AspectHit[], a: string, b: string, aspect: string): AspectHit | undefined {
  return aspects.find((hit) => hit.aspect === aspect && ((hit.a === a && hit.b === b) || (hit.a === b && hit.b === a)));
}

/**
 * Find only well-defined, geometry-based configurations. This deliberately
 * does not infer vague "patterns" from signs or houses: every returned item
 * is reconstructible from the listed aspect hits and their orbs.
 */
export function computeAspectPatterns(
  points: { name: string; longitude: number }[],
  aspects: AspectHit[],
): AspectPattern[] {
  const names = points.map((point) => point.name).filter((name) => PATTERN_PLANETS.has(name));
  const patterns: AspectPattern[] = [];
  const seen = new Set<string>();
  const add = (kind: AspectPatternKind, nameKa: string, pointNames: string[], hits: AspectHit[]) => {
    const key = `${kind}:${keyForPoints(pointNames)}`;
    if (seen.has(key)) return;
    seen.add(key);
    patterns.push({
      kind,
      nameKa,
      points: [...pointNames].sort(),
      meanOrb: hits.length
        ? Math.round((hits.reduce((sum, hit) => sum + hit.orb, 0) / hits.length) * 100) / 100
        : 0,
    });
  };

  // Sign-based concentration is reported separately from geometric figures.
  for (let sign = 0; sign < 12; sign += 1) {
    const clustered = points
      .filter((point) => PATTERN_PLANETS.has(point.name) && Math.floor((((point.longitude % 360) + 360) % 360) / 30) === sign)
      .map((point) => point.name);
    if (clustered.length >= 3) add("stellium", "ნიშნური კონცენტრაცია", clustered, []);
  }

  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      for (let k = j + 1; k < names.length; k += 1) {
        const [a, b, c] = [names[i]!, names[j]!, names[k]!];
        const abTrine = hitBetween(aspects, a, b, "Trine");
        const acTrine = hitBetween(aspects, a, c, "Trine");
        const bcTrine = hitBetween(aspects, b, c, "Trine");
        if (abTrine && acTrine && bcTrine) add("grand_trine", "დიდი ტრინი", [a, b, c], [abTrine, acTrine, bcTrine]);

        const pairs: Array<[string, string, string]> = [[a, b, c], [a, c, b], [b, c, a]];
        for (const [left, right, apex] of pairs) {
          const opposition = hitBetween(aspects, left, right, "Opposition");
          const squareLeft = hitBetween(aspects, apex, left, "Square");
          const squareRight = hitBetween(aspects, apex, right, "Square");
          if (opposition && squareLeft && squareRight) add("t_square", "T-კვადრატი", [left, right, apex], [opposition, squareLeft, squareRight]);

          const sextile = hitBetween(aspects, left, right, "Sextile");
          const inconjunctLeft = hitBetween(aspects, apex, left, "Quincunx");
          const inconjunctRight = hitBetween(aspects, apex, right, "Quincunx");
          if (sextile && inconjunctLeft && inconjunctRight) add("yod", "იოდი", [left, right, apex], [sextile, inconjunctLeft, inconjunctRight]);
        }
      }
    }
  }

  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const firstOpposition = hitBetween(aspects, names[i]!, names[j]!, "Opposition");
      if (!firstOpposition) continue;
      for (let k = i + 1; k < names.length; k += 1) {
        for (let l = k + 1; l < names.length; l += 1) {
          const group = [names[i]!, names[j]!, names[k]!, names[l]!];
          if (new Set(group).size !== 4) continue;
          const secondOpposition = hitBetween(aspects, names[k]!, names[l]!, "Opposition");
          const crossSquares = [
            hitBetween(aspects, names[i]!, names[k]!, "Square"), hitBetween(aspects, names[i]!, names[l]!, "Square"),
            hitBetween(aspects, names[j]!, names[k]!, "Square"), hitBetween(aspects, names[j]!, names[l]!, "Square"),
          ];
          if (secondOpposition && crossSquares.every(Boolean)) add("grand_cross", "დიდი ჯვარი", group, [firstOpposition, secondOpposition, ...crossSquares] as AspectHit[]);
        }
      }
    }
  }

  return patterns.sort((a, b) => a.meanOrb - b.meanOrb || a.nameKa.localeCompare(b.nameKa));
}
