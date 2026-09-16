import { DateTime } from "luxon";
import {
  computeAngles,
  computeHouseCusps,
  computePlanetPositions,
  computeNorthNode,
  houseOfLongitude,
  HouseSystem,
  PlanetPosition,
} from "./positions";
import { computeAspects, AspectHit } from "./aspects";

export interface BirthInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timezone: string; // IANA, მაგ. Asia/Tbilisi
  lat: number;
  lon: number;
}

export interface NatalResult {
  utcIso: string;
  planets: PlanetPosition[];
  ascendant: number;
  mc: number;
  descendant: number;
  ic: number;
  houseCusps: number[];
  houseSystem: HouseSystem;
  planetHouses: Record<string, number>;
  aspects: AspectHit[];
}

export function birthInputToUtcDate(input: BirthInput): Date {
  const dt = DateTime.fromISO(`${input.date}T${input.time}`, { zone: input.timezone });
  if (!dt.isValid) {
    throw new Error(`ბადრაბადის თარიღი/დრო/დროის ზონა არასწორია: ${dt.invalidExplanation}`);
  }
  return dt.toUTC().toJSDate();
}

export function computeNatalChart(input: BirthInput, houseSystem: HouseSystem = "whole_sign"): NatalResult {
  const utcDate = birthInputToUtcDate(input);

  const planets = computePlanetPositions(utcDate);
  const northNode = computeNorthNode(utcDate);
  const allPoints = [...planets, northNode];

  const angles = computeAngles(utcDate, input.lon, input.lat);
  const houses = computeHouseCusps(angles, houseSystem);

  const planetHouses: Record<string, number> = {};
  for (const p of allPoints) {
    planetHouses[p.name] = houseOfLongitude(p.longitude, houses.cusps);
  }

  const aspects = computeAspects(allPoints);

  return {
    utcIso: utcDate.toISOString(),
    planets: allPoints,
    ascendant: angles.ascendant,
    mc: angles.mc,
    descendant: angles.descendant,
    ic: angles.ic,
    houseCusps: houses.cusps,
    houseSystem,
    planetHouses,
    aspects,
  };
}

export function computeSynastryAspects(chartA: NatalResult, chartB: NatalResult): AspectHit[] {
  return computeAspects(chartA.planets, chartB.planets);
}

export function computeTransitAspects(natal: NatalResult, transitDate: Date): {
  transitPlanets: PlanetPosition[];
  aspects: AspectHit[];
} {
  const transitPlanets = computePlanetPositions(transitDate);
  const transitNode = computeNorthNode(transitDate);
  const allTransit = [...transitPlanets, transitNode];
  const aspects = computeAspects(allTransit, natal.planets);
  return { transitPlanets: allTransit, aspects };
}
