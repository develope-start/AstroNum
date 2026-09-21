import * as Astronomy from "astronomy-engine";
import type { PlanetPosition } from "./positions";

export type DignityStatus = "domicile" | "exaltation" | "detriment" | "fall" | "peregrine" | "not_classified";

export interface DignityResult {
  planet: string;
  signIndex: number;
  ruler: string | null;
  status: DignityStatus;
  score: number;
  dispositorChain: string[];
  dispositorCycle: boolean;
}

export interface AngularityResult {
  planet: string;
  angle: "ASC" | "MC" | "DSC" | "IC" | null;
  distance: number;
  strength: "exact" | "angular" | "cadent";
}

export interface DeclinationContact {
  a: string;
  b: string;
  type: "parallel" | "contraparallel";
  orb: number;
}

export interface FixedStarContact {
  star: string;
  planet: string;
  longitude: number;
  declination: number;
  orb: number;
}

const TRADITIONAL_RULERS = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
] as const;

const EXALTATIONS: Array<string | null> = [
  "Sun", "Moon", null, null, null, "Mars", null, null, "Jupiter", "Saturn", null, "Venus",
];

const CLASSICAL_PLANETS = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]);

export const FIXED_STAR_CATALOG = [
  { id: "Star1", name: "Sirius", nameKa: "სირიუსი", raHours: 6.752481, dec: -16.716116 },
  { id: "Star2", name: "Aldebaran", nameKa: "ალდებარანი", raHours: 4.598677, dec: 16.509302 },
  { id: "Star3", name: "Regulus", nameKa: "რეგულუსი", raHours: 10.139531, dec: 11.967208 },
  { id: "Star4", name: "Spica", nameKa: "სპიკა", raHours: 13.419883, dec: -11.161322 },
  { id: "Star5", name: "Antares", nameKa: "ანტარესი", raHours: 16.490128, dec: -26.431946 },
  { id: "Star6", name: "Fomalhaut", nameKa: "ფომალჰაუტი", raHours: 22.960848, dec: -29.622236 },
] as const;

const EXTENDED_FIXED_STAR_CATALOG = [
  { id: "Star7", name: "Arcturus", nameKa: "არქტურუსი", raHours: 14.26103, dec: 19.1825 },
  { id: "Star8", name: "Vega", nameKa: "ვეგა", raHours: 18.61565, dec: 38.7837 },
] as const;

function oppositeSign(signIndex: number): number {
  return (signIndex + 6) % 12;
}

function rulerForSign(signIndex: number): string {
  return TRADITIONAL_RULERS[signIndex];
}

function dignityFor(planet: string, signIndex: number): { status: DignityStatus; score: number } {
  if (!CLASSICAL_PLANETS.has(planet)) return { status: "not_classified", score: 0 };
  if (rulerForSign(signIndex) === planet) return { status: "domicile", score: 5 };
  if (EXALTATIONS[signIndex] === planet) return { status: "exaltation", score: 4 };
  if (rulerForSign(oppositeSign(signIndex)) === planet) return { status: "detriment", score: -5 };
  if (EXALTATIONS[oppositeSign(signIndex)] === planet) return { status: "fall", score: -4 };
  return { status: "peregrine", score: 0 };
}

function dispositorChain(planet: string, signByPlanet: Map<string, number>): { chain: string[]; cycle: boolean } {
  const chain: string[] = [planet];
  const seen = new Set(chain);
  let current = planet;
  for (let index = 0; index < 12; index++) {
    const sign = signByPlanet.get(current);
    if (sign === undefined || !CLASSICAL_PLANETS.has(current)) return { chain, cycle: false };
    const next = rulerForSign(sign);
    chain.push(next);
    if (seen.has(next)) return { chain, cycle: true };
    seen.add(next);
    current = next;
  }
  return { chain, cycle: false };
}

export function calculateTraditionalDignities(planets: PlanetPosition[]): DignityResult[] {
  const signByPlanet = new Map(planets.map((planet) => [planet.name, Math.floor((((planet.longitude % 360) + 360) % 360) / 30)]));
  return planets.map((planet) => {
    const signIndex = signByPlanet.get(planet.name) ?? 0;
    const dignity = dignityFor(planet.name, signIndex);
    const chain = dispositorChain(planet.name, signByPlanet);
    return {
      planet: planet.name,
      signIndex,
      ruler: CLASSICAL_PLANETS.has(planet.name) ? rulerForSign(signIndex) : null,
      ...dignity,
      dispositorChain: chain.chain,
      dispositorCycle: chain.cycle,
    };
  });
}

function angularDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return Math.min(raw, 360 - raw);
}

export function calculateAngularity(planets: PlanetPosition[], angles: { ascendant: number; mc: number }): AngularityResult[] {
  const points: Array<[AngularityResult["angle"], number]> = [
    ["ASC", angles.ascendant],
    ["MC", angles.mc],
    ["DSC", (angles.ascendant + 180) % 360],
    ["IC", (angles.mc + 180) % 360],
  ];
  return planets.map((planet) => {
    const nearest = points
      .map(([angle, longitude]) => ({ angle, distance: angularDistance(planet.longitude, longitude) }))
      .sort((a, b) => a.distance - b.distance)[0];
    return {
      planet: planet.name,
      angle: nearest.distance <= 10 ? nearest.angle : null,
      distance: Math.round(nearest.distance * 100) / 100,
      strength: nearest.distance <= 3 ? "exact" : nearest.distance <= 10 ? "angular" : "cadent",
    };
  });
}

export function calculateDeclinationContacts(planets: PlanetPosition[], orb = 1): DeclinationContact[] {
  const contacts: DeclinationContact[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if (a.declination === undefined || b.declination === undefined) continue;
      const direct = Math.abs(a.declination - b.declination);
      const opposite = Math.abs(a.declination + b.declination);
      if (direct <= orb) contacts.push({ a: a.name, b: b.name, type: "parallel", orb: Math.round(direct * 100) / 100 });
      else if (opposite <= orb) contacts.push({ a: a.name, b: b.name, type: "contraparallel", orb: Math.round(opposite * 100) / 100 });
    }
  }
  return contacts.sort((a, b) => a.orb - b.orb);
}

function eclipticLongitudeFromEquatorial(raHours: number, declination: number, obliquity: number): number {
  const ra = (raHours * 15 * Math.PI) / 180;
  const dec = (declination * Math.PI) / 180;
  const epsilon = (obliquity * Math.PI) / 180;
  const longitude = (Math.atan2(
    Math.sin(ra) * Math.cos(epsilon) + Math.tan(dec) * Math.sin(epsilon),
    Math.cos(ra),
  ) * 180) / Math.PI;
  return (longitude + 360) % 360;
}

export function calculateFixedStarContacts(
  date: Date,
  planets: PlanetPosition[],
  orb = 1,
): FixedStarContact[] {
  const observer = new Astronomy.Observer(0, 0, 0);
  const obliquity = Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl;
  const contacts: FixedStarContact[] = [];
  for (const star of [...FIXED_STAR_CATALOG, ...EXTENDED_FIXED_STAR_CATALOG]) {
    const body = Astronomy.Body[star.id as keyof typeof Astronomy.Body];
    Astronomy.DefineStar(body, star.raHours, star.dec, 1000);
    const equatorial = Astronomy.Equator(body, date, observer, true, false);
    const longitude = eclipticLongitudeFromEquatorial(equatorial.ra, equatorial.dec, obliquity);
    for (const planet of planets) {
      const raw = Math.abs((((planet.longitude - longitude) % 360) + 540) % 360 - 180);
      if (raw <= orb) contacts.push({ star: star.name, planet: planet.name, longitude, declination: equatorial.dec, orb: Math.round(raw * 100) / 100 });
    }
  }
  return contacts.sort((a, b) => a.orb - b.orb);
}
