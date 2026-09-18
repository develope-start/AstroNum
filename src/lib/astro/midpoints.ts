import type { AspectHit } from "./aspects";
import { computeAspects } from "./aspects";
import type { PlanetPosition } from "./positions";

export interface MidpointResult {
  a: string;
  b: string;
  longitude: number;
}

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signedAngle(value: number): number {
  return ((value + 540) % 360) - 180;
}

export function calculateMidpoints(planets: PlanetPosition[]): MidpointResult[] {
  const result: MidpointResult[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      result.push({
        a: planets[i].name,
        b: planets[j].name,
        longitude: normalize(planets[i].longitude + signedAngle(planets[j].longitude - planets[i].longitude) / 2),
      });
    }
  }
  return result;
}

/** A harmonic chart multiplies ecliptic longitude by the selected harmonic. */
export function calculateHarmonicPlanets(planets: PlanetPosition[], harmonic: number): PlanetPosition[] {
  if (!Number.isInteger(harmonic) || harmonic < 1 || harmonic > 360) throw new Error("ჰარმონიკა უნდა იყოს 1-დან 360-მდე მთელი რიცხვი");
  return planets.map((planet) => ({
    ...planet,
    longitude: normalize(planet.longitude * harmonic),
    speed: planet.speed * harmonic,
  }));
}

export function calculateHarmonicAspects(planets: PlanetPosition[], harmonic: number): AspectHit[] {
  return computeAspects(calculateHarmonicPlanets(planets, harmonic));
}
