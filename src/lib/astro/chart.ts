import { DateTime, IANAZone } from "luxon";
import tzlookup from "tz-lookup";
import {
  computeNorthNode,
  computePlanetPositions,
  computeSouthNode,
  computeTraditionalLots,
  houseOfLongitude,
  HouseSystem,
  PlanetPosition,
} from "./positions";
import { getEphemerisEngine } from "./engineAdapter";
import { computeAspectPatterns, computeAspects, AspectHit, AspectPattern } from "./aspects";
import { parseWideDate } from "./wideDate";
import {
  CalculationOptions,
  assertEngineCapabilities,
  isSwissAvailableForDate,
  metadata as ephemerisMetadata,
  EphemerisMetadata,
  resolveCalculationOptions,
  swissFallbackReason,
  toJulianDay,
} from "./ephemeris";

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
  /** Auditable conversion data: IANA local time -> UTC -> Julian Date. */
  timeZone: string;
  utcOffsetMinutes: number;
  julianDay: number;
  planets: PlanetPosition[];
  ascendant: number;
  mc: number;
  descendant: number;
  ic: number;
  houseCusps: number[];
  houseSystem: HouseSystem;
  planetHouses: Record<string, number>;
  aspects: AspectHit[];
  patterns: AspectPattern[];
  latitude: number;
  longitude: number;
  ephemeris: EphemerisMetadata;
}

export function birthInputToUtcDate(input: BirthInput): Date {
  if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90 || !Number.isFinite(input.lon) || input.lon < -180 || input.lon > 180) {
    throw new Error("Invalid geographic coordinates.");
  }
  if (!IANAZone.isValidZone(input.timezone)) {
    throw new Error("Timezone must be a valid IANA Time Zone Database identifier.");
  }
  let coordinateZone: string;
  try {
    coordinateZone = tzlookup(input.lat, input.lon);
  } catch {
    throw new Error("An IANA timezone could not be resolved for these coordinates.");
  }
  if (input.timezone !== coordinateZone) {
    throw new Error(`Timezone ${input.timezone} does not match the IANA timezone ${coordinateZone} resolved from the coordinates.`);
  }
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
  if (dt.getPossibleOffsets().length !== 1) {
    throw new Error("The local time is ambiguous because of a daylight-saving transition; an exact UTC instant cannot be selected automatically.");
  }
  return dt.toUTC().toJSDate();
}

function requireEngineOptions(date: Date, calculation: CalculationOptions | undefined, houseSystem: HouseSystem): Required<CalculationOptions> {
  const options = resolveCalculationOptions(calculation);
  assertEngineCapabilities(options, houseSystem);
  if (options.ephemeris === "swiss" && !isSwissAvailableForDate(date, options)) {
    throw new Error(`Swiss Ephemeris cannot calculate this date: ${swissFallbackReason() ?? "unknown reason"}`);
  }
  return options;
}

export function computeNatalChart(input: BirthInput, houseSystem: HouseSystem = "whole_sign"): NatalResult {
  const utcDate = birthInputToUtcDate(input);
  const result = computeNatalChartAtUtc(utcDate, input.lat, input.lon, input.calculation, houseSystem);
  const utcOffsetMinutes = DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(input.timezone).offset;
  return { ...result, timeZone: input.timezone, utcOffsetMinutes };
}

/** Compute the same chart pipeline for a derived UTC moment (progressions/returns). */
export function computeNatalChartAtUtc(
  utcDate: Date,
  latitude: number,
  longitude: number,
  calculation?: CalculationOptions,
  houseSystem: HouseSystem = "whole_sign",
): NatalResult {
  const options = requireEngineOptions(utcDate, calculation, houseSystem);
  const frame = getEphemerisEngine(options).calcBodies(utcDate, latitude, longitude, houseSystem);
  const { planets, northNode, angles, houses } = frame;
  const southNode = computeSouthNode(northNode);
  const primaryPoints = [...planets, northNode, southNode];
  if (options.ephemeris === "swiss" && houseSystem === "placidus" && Math.abs((((houses.cusps[9]! - angles.mc) + 540) % 360) - 180) > 1e-7) {
    throw new Error("Swiss Ephemeris Placidus MC and tenth-house cusp disagree; result was not published.");
  }

  const sun = planets.find((planet) => planet.name === "Sun");
  const moon = planets.find((planet) => planet.name === "Moon");
  if (!sun || !moon) throw new Error("The Sun and Moon are required to calculate traditional Lots.");
  // Houses VII–XII are above the horizon in every supported house system.
  const isDayChart = houseOfLongitude(sun.longitude, houses.cusps) >= 7;
  const derivedPoints = [
    ...(angles.vertex === undefined ? [] : [{ name: "Vertex", longitude: angles.vertex, speed: 0, retrograde: false }]),
    ...computeTraditionalLots(angles.ascendant, sun.longitude, moon.longitude, isDayChart),
  ];
  const allPoints = [...primaryPoints, ...derivedPoints];

  const planetHouses: Record<string, number> = {};
  for (const p of allPoints) {
    planetHouses[p.name] = houseOfLongitude(p.longitude, houses.cusps);
  }

  const aspects = computeAspects(allPoints).filter((hit) => {
    const includesDerivedPoint = ["Vertex", "Fortune", "Spirit"].includes(hit.a) || ["Vertex", "Fortune", "Spirit"].includes(hit.b);
    // Derived points remain fully visible in the table; their minor and wide
    // contacts are deliberately suppressed so they do not drown out planets.
    return !includesDerivedPoint || (hit.kind === "major" && hit.orb <= 2);
  });
  const patterns = computeAspectPatterns(primaryPoints, aspects);

  return {
    utcIso: utcDate.toISOString(),
    timeZone: "UTC",
    utcOffsetMinutes: 0,
    julianDay: toJulianDay(utcDate),
    planets: allPoints,
    ascendant: angles.ascendant,
    mc: angles.mc,
    descendant: angles.descendant,
    ic: angles.ic,
    houseCusps: houses.cusps,
    houseSystem,
    planetHouses,
    aspects,
    patterns,
    latitude,
    longitude,
    ephemeris: ephemerisMetadata(options, utcDate),
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
