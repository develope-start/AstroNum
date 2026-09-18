export interface AspectDef {
  name: string;
  nameKa: string;
  angle: number;
  orb: number;
}

export const MAJOR_ASPECTS: AspectDef[] = [
  { name: "Conjunction", nameKa: "შეერთება", angle: 0, orb: 8 },
  { name: "Sextile", nameKa: "სექსტილი", angle: 60, orb: 4 },
  { name: "Square", nameKa: "კვადრატურა", angle: 90, orb: 6 },
  { name: "Trine", nameKa: "ტრინი", angle: 120, orb: 6 },
  { name: "Opposition", nameKa: "ოპოზიცია", angle: 180, orb: 8 },
];

export interface AspectHit {
  a: string;
  b: string;
  aspect: string;
  aspectKa: string;
  exactAngle: number;
  orb: number;
  applying: boolean;
}

function angularDistance(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

/**
 * ორ წერტილთა სიმრავლეს შორის ასპექტების გამოთვლა (ნატალურ-ნატალურ, ან ნატალურ-ტრანზიტულ შედარებაში).
 * pointsB-ს არ გადაცემისას თავად pointsA-ს შიგნით ითვლის ასპექტებს (თითო წყვილს ერთხელ).
 */
export function computeAspects(
  pointsA: { name: string; longitude: number; speed?: number }[],
  pointsB?: { name: string; longitude: number; speed?: number }[],
  aspectDefs: AspectDef[] = MAJOR_ASPECTS,
): AspectHit[] {
  const hits: AspectHit[] = [];
  const listB = pointsB ?? pointsA;
  const sameSet = !pointsB;

  for (let i = 0; i < pointsA.length; i++) {
    const startJ = sameSet ? i + 1 : 0;
    for (let j = startJ; j < listB.length; j++) {
      const p1 = pointsA[i];
      const p2 = listB[j];
      if (sameSet && p1.name === p2.name) continue;

      const dist = angularDistance(p1.longitude, p2.longitude);
      for (const def of aspectDefs) {
        const delta = Math.abs(dist - def.angle);
        if (delta <= def.orb) {
          // მიახლოებადია თუ არა: სწრაფი სხეული ნელს უახლოვდება ზუსტ კუთხეს
          const probeDays = 1 / 24;
          const probeDistance = angularDistance(
            p1.longitude + (p1.speed ?? 0) * probeDays,
            p2.longitude + (p2.speed ?? 0) * probeDays,
          );
          const probeDelta = Math.abs(probeDistance - def.angle);
          const applying = probeDelta < delta - 1e-9;
          hits.push({
            a: p1.name,
            b: p2.name,
            aspect: def.name,
            aspectKa: def.nameKa,
            exactAngle: def.angle,
            orb: Math.round(delta * 100) / 100,
            applying,
          });
          break; // ერთი წყვილისთვის ერთი ყველაზე მოსალოდნელი ასპექტი საკმარისია
        }
      }
    }
  }
  return hits;
}
