import { DateTime } from "luxon";
import {
  computeAngles,
  computeHouseCusps,
  computePlanetPositions,
  computeNorthNode,
  computeSouthNode,
  houseOfLongitude,
  HouseSystem,
  PlanetPosition,
} from "./positions";
import { computeAspects, AspectHit } from "./aspects";
import { parseWideDate } from "./wideDate";
import { CalculationOptions, metadata as ephemerisMetadata, EphemerisMetadata } from "./ephemeris";

export interface BirthInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timezone: string; // IANA, მაგ. Asia/Tbilisi
  lat: number;
  lon: number;
  calculation?: CalculationOptions;
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
  latitude: number;
  longitude: number;
  ephemeris: EphemerisMetadata;
}

export function birthInputToUtcDate(input: BirthInput): Date {
  const date = parseWideDate(input.date);
  const [hourText, minuteText] = input.time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!date || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error("დაბადების თარიღი ან დრო არასწორ ფორმატშია");
  }
  const dt = DateTime.fromObject(
    { year: date.year, month: date.month, day: date.day, hour, minute },
    { zone: input.timezone },
  );
  if (!dt.isValid) {
    throw new Error(`ბადრაბადის თარიღი/დრო/დროის ზონა არასწორია: ${dt.invalidExplanation}`);
  }
  return dt.toUTC().toJSDate();
}

export function computeNatalChart(input: BirthInput, houseSystem: HouseSystem = "whole_sign"): NatalResult {
  const utcDate = birthInputToUtcDate(input);
  return computeNatalChartAtUtc(utcDate, input.lat, input.lon, input.calculation, houseSystem);
}

/** Compute the same chart pipeline for a derived UTC moment (progressions/returns). */
export function computeNatalChartAtUtc(
  utcDate: Date,
  latitude: number,
  longitude: number,
  calculation?: CalculationOptions,
  houseSystem: HouseSystem = "whole_sign",
): NatalResult {
  const planets = computePlanetPositions(utcDate, calculation, longitude, latitude);
  const northNode = computeNorthNode(utcDate, calculation, longitude, latitude);
  const southNode = computeSouthNode(northNode);
  const allPoints = [...planets, northNode, southNode];

  const angles = computeAngles(utcDate, longitude, latitude, calculation);
  const houses = computeHouseCusps(angles, houseSystem, utcDate, longitude, latitude, calculation);

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
    latitude,
    longitude,
    ephemeris: ephemerisMetadata(calculation, utcDate),
  };
}

export function computeSynastryAspects(chartA: NatalResult, chartB: NatalResult): AspectHit[] {
  return computeAspects(chartA.planets, chartB.planets);
}

export function computeTransitAspects(natal: NatalResult, transitDate: Date): {
  transitPlanets: PlanetPosition[];
  aspects: AspectHit[];
} {
  const calculation = natal.ephemeris;
  const options: CalculationOptions = {
    ephemeris: calculation.source,
    zodiac: calculation.zodiac,
    nodeType: calculation.nodeType,
    topocentric: calculation.topocentric,
    siderealMode: calculation.siderealMode,
    includeAsteroids: calculation.includeAsteroids,
  };
  const transitPlanets = computePlanetPositions(transitDate, options, natal.longitude, natal.latitude);
  const transitNode = computeNorthNode(transitDate, options, natal.longitude, natal.latitude);
  const transitSouthNode = computeSouthNode(transitNode);
  const allTransit = [...transitPlanets, transitNode, transitSouthNode];
  const aspects = computeAspects(allTransit, natal.planets);
  return { transitPlanets: allTransit, aspects };
}

export interface TransitIntervalSample {
  utcIso: string;
  aspects: AspectHit[];
}

export interface TransitIntervalResult {
  startUtcIso: string;
  endUtcIso: string;
  stepHours: number;
  samples: TransitIntervalSample[];
  peakAspects: AspectHit[];
}

/** Scan an interval instead of silently calculating only its first date. */
export function computeTransitInterval(natal: NatalResult, start: Date, end: Date): TransitIntervalResult {
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    throw new Error("Invalid transit interval");
  }
  const durationHours = Math.max(0, (endMs - startMs) / 3_600_000);
  const maxSamples = 2_000;
  const preferredStepHours = durationHours <= 48 ? 1 : durationHours <= 370 * 24 ? 6 : 24;
  const stepHours = Math.max(
    preferredStepHours,
    Math.ceil(durationHours / maxSamples / preferredStepHours) * preferredStepHours,
  );
  const stepMs = stepHours * 3_600_000;
  const samples: TransitIntervalSample[] = [];
  for (let timestamp = startMs; timestamp <= endMs && samples.length < maxSamples; timestamp += stepMs) {
    const date = new Date(timestamp);
    samples.push({ utcIso: date.toISOString(), aspects: computeTransitAspects(natal, date).aspects });
  }
  if (!samples.length || new Date(samples[samples.length - 1].utcIso).getTime() < endMs) {
    const date = new Date(endMs);
    samples.push({ utcIso: date.toISOString(), aspects: computeTransitAspects(natal, date).aspects });
  }
  const peakAspects = samples
    .flatMap((sample) => sample.aspects)
    .sort((a, b) => a.orb - b.orb)
    .filter((hit, index, all) => all.findIndex((candidate) => candidate.a === hit.a && candidate.b === hit.b && candidate.aspect === hit.aspect) === index)
    .slice(0, 30);
  return {
    startUtcIso: start.toISOString(),
    endUtcIso: end.toISOString(),
    stepHours,
    samples,
    peakAspects,
  };
}
