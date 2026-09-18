import { computeNatalChart, computeNatalChartAtUtc, type BirthInput, type NatalResult } from "./chart";
import { computePlanetPositions, type PlanetPosition } from "./positions";
import type { CalculationOptions } from "./ephemeris";

export type ReturnPlanet = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";

export interface PlanetaryReturnResult {
  method: "return";
  planet: ReturnPlanet;
  natalUtcIso: string;
  returnUtcIso: string;
  targetLongitude: number;
  returnedLongitude: number;
  orb: number;
  natal: NatalResult;
  returned: NatalResult;
}

function signedAngle(value: number): number {
  return ((value + 540) % 360) - 180;
}

function positionOf(planet: ReturnPlanet, date: Date, options: CalculationOptions | undefined, longitude: number, latitude: number): PlanetPosition {
  const found = computePlanetPositions(date, options, longitude, latitude).find((item) => item.name === planet);
  if (!found) throw new Error(`პლანეტის პოზიცია ვერ მოიძებნა: ${planet}`);
  return found;
}

function findBracket(
  planet: ReturnPlanet,
  targetLongitude: number,
  start: Date,
  end: Date,
  options: CalculationOptions | undefined,
  longitude: number,
  latitude: number,
): [Date, Date] | null {
  const stepDays = planet === "Moon" ? 0.25 : 1;
  const stepMs = stepDays * 86_400_000;
  let left = start.getTime();
  const endMs = end.getTime();
  let leftValue = signedAngle(positionOf(planet, new Date(left), options, longitude, latitude).longitude - targetLongitude);
  for (let right = Math.min(left + stepMs, endMs); right <= endMs; right = Math.min(right + stepMs, endMs)) {
    const rightValue = signedAngle(positionOf(planet, new Date(right), options, longitude, latitude).longitude - targetLongitude);
    const crossesZero = leftValue * rightValue < 0 && Math.min(Math.abs(leftValue), Math.abs(rightValue)) < 20;
    if (Math.abs(leftValue) < 1e-9 || leftValue === 0 || rightValue === 0 || crossesZero) return [new Date(left), new Date(right)];
    left = right;
    leftValue = rightValue;
    if (right === endMs) break;
  }
  return null;
}

/** Find the first directed longitude return in the requested interval. */
export function findPlanetaryReturn(
  birthInput: BirthInput,
  planet: ReturnPlanet,
  start: Date,
  end: Date,
  houseSystem: NatalResult["houseSystem"] = "whole_sign",
): PlanetaryReturnResult {
  if (end.getTime() <= start.getTime()) throw new Error("დაბრუნების პერიოდი არასწორია");
  const natal = computeNatalChart(birthInput, houseSystem);
  const natalPlanet = natal.planets.find((item) => item.name === planet);
  if (!natalPlanet) throw new Error(`ნატალურ რუკაში პლანეტი ვერ მოიძებნა: ${planet}`);
  const bracket = findBracket(planet, natalPlanet.longitude, start, end, natal.ephemeris, natal.longitude, natal.latitude);
  if (!bracket) throw new Error("მითითებულ პერიოდში დაბრუნების ზუსტი მომენტი ვერ მოიძებნა");
  let left = bracket[0].getTime();
  let right = bracket[1].getTime();
  for (let i = 0; i < 45; i++) {
    const middle = (left + right) / 2;
    const leftValue = signedAngle(positionOf(planet, new Date(left), natal.ephemeris, natal.longitude, natal.latitude).longitude - natalPlanet.longitude);
    const middleValue = signedAngle(positionOf(planet, new Date(middle), natal.ephemeris, natal.longitude, natal.latitude).longitude - natalPlanet.longitude);
    if (Math.abs(middleValue) < 1e-8) { left = middle; right = middle; break; }
    if (leftValue * middleValue <= 0) right = middle;
    else left = middle;
  }
  const returnUtc = new Date((left + right) / 2);
  const returnedPlanet = positionOf(planet, returnUtc, natal.ephemeris, natal.longitude, natal.latitude);
  const returned = computeNatalChartAtUtc(returnUtc, birthInput.lat, birthInput.lon, birthInput.calculation, houseSystem);
  return {
    method: "return",
    planet,
    natalUtcIso: natal.utcIso,
    returnUtcIso: returnUtc.toISOString(),
    targetLongitude: natalPlanet.longitude,
    returnedLongitude: returnedPlanet.longitude,
    orb: Math.round(Math.abs(signedAngle(returnedPlanet.longitude - natalPlanet.longitude)) * 1e6) / 1e6,
    natal,
    returned,
  };
}
