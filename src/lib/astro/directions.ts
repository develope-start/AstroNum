import { computeAspects, type AspectHit } from "./aspects";
import { computeSecondaryProgression } from "./progressions";
import type { BirthInput } from "./chart";
import type { HouseSystem, PlanetPosition } from "./positions";

export interface SolarArcDirectionResult {
  method: "solar_arc";
  targetDate: string;
  arc: number;
  directedPlanets: PlanetPosition[];
  aspects: AspectHit[];
}

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signedAngle(value: number): number {
  return ((value + 540) % 360) - 180;
}

export function computeSolarArcDirections(
  birthInput: BirthInput,
  targetDate: string,
  houseSystem: HouseSystem = "whole_sign",
): SolarArcDirectionResult {
  const progression = computeSecondaryProgression(birthInput, targetDate, houseSystem);
  const natalSun = progression.natal.planets.find((planet) => planet.name === "Sun");
  const progressedSun = progression.progressed.planets.find((planet) => planet.name === "Sun");
  if (!natalSun || !progressedSun) throw new Error("Solar Arc-ისთვის მზე ვერ მოიძებნა");
  const arc = signedAngle(progressedSun.longitude - natalSun.longitude);
  const directedPlanets = progression.natal.planets.map((planet) => ({
    ...planet,
    longitude: normalize(planet.longitude + arc),
  }));
  return {
    method: "solar_arc",
    targetDate,
    arc: Math.round(arc * 1000000) / 1000000,
    directedPlanets,
    aspects: computeAspects(directedPlanets, progression.natal.planets),
  };
}
