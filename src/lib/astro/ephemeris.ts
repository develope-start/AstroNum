import type * as Swiss from "@swisseph/node";
import { createRequire } from "node:module";

export type EphemerisSource = "swiss" | "astronomy";
export type Zodiac = "tropical" | "sidereal";
export type NodeType = "mean" | "true";

export interface CalculationOptions {
  ephemeris?: EphemerisSource;
  zodiac?: Zodiac;
  siderealMode?: number;
  nodeType?: NodeType;
  topocentric?: boolean;
  altitudeMeters?: number;
  includeAsteroids?: boolean;
}

export interface EphemerisMetadata {
  source: EphemerisSource;
  requestedSource: EphemerisSource;
  zodiac: Zodiac;
  nodeType: NodeType;
  topocentric: boolean;
  includeAsteroids: boolean;
  siderealMode?: number;
  precision: "swiss" | "astronomy-engine";
  fallbackReason?: string;
}

type SwissModule = typeof Swiss;
let swissModule: SwissModule | null | undefined;
let swissLoadError: string | undefined;

/** Load the native library only on the server and only when it is usable. */
function loadSwiss(): SwissModule | null {
  if (swissModule !== undefined) return swissModule;
  try {
    let dynamicRequire: (moduleName: string) => SwissModule;
    try {
      dynamicRequire = eval("require") as (moduleName: string) => SwissModule;
    } catch {
      const makeRequire = createRequire;
      dynamicRequire = makeRequire(`${process.cwd()}/package.json`) as (moduleName: string) => SwissModule;
    }
    swissModule = dynamicRequire("@swisseph/node");
  } catch (error) {
    swissModule = null;
    swissLoadError = error instanceof Error ? error.message : String(error);
  }
  return swissModule;
}

export function isSwissAvailable(): boolean {
  return loadSwiss() !== null;
}

export function isSwissAvailableForDate(
  date: Date,
  inputOptions?: CalculationOptions,
  lon = 0,
  lat = 0,
): boolean {
  const swiss = loadSwiss();
  if (!swiss) return false;
  const options = resolveCalculationOptions(inputOptions);
  try {
    configureSwiss(options, lon, lat);
    swiss.calculatePosition(toJulianDay(date), 0, swissFlags(options));
    return true;
  } catch (error) {
    swissLoadError = error instanceof Error ? error.message : String(error);
    return false;
  }
}

export function swissFallbackReason(): string | undefined {
  loadSwiss();
  return swissLoadError;
}

export const DEFAULT_CALCULATION_OPTIONS: Required<CalculationOptions> = {
  ephemeris: "swiss",
  zodiac: "tropical",
  siderealMode: 1,
  nodeType: "mean",
  topocentric: false,
  altitudeMeters: 0,
  includeAsteroids: false,
};

const SWISS_EPHEMERIS = 2;
const SPEED3 = 128;
const SIDEREAL = 65536;
const TOPOCENTRIC = 32768;

export function resolveCalculationOptions(options?: CalculationOptions): Required<CalculationOptions> {
  return { ...DEFAULT_CALCULATION_OPTIONS, ...options };
}

export function toJulianDay(date: Date): number {
  const swiss = loadSwiss();
  if (!swiss) throw new Error(swissLoadError ?? "Swiss Ephemeris is unavailable");
  return swiss.dateToJulianDay(date);
}

export function configureSwiss(options: Required<CalculationOptions>, lon = 0, lat = 0): void {
  const swiss = loadSwiss();
  if (!swiss) throw new Error(swissLoadError ?? "Swiss Ephemeris is unavailable");
  if (options.zodiac === "sidereal") swiss.setSiderealMode(options.siderealMode);
  if (options.topocentric) swiss.setTopocentric(lon, lat, options.altitudeMeters);
}

export function swissFlags(options: Required<CalculationOptions>): number {
  let flags = SWISS_EPHEMERIS | SPEED3;
  if (options.zodiac === "sidereal") flags |= SIDEREAL;
  if (options.topocentric) flags |= TOPOCENTRIC;
  return flags;
}

export const SWISS_PLANETS = [
  [0, "Sun"], [1, "Moon"], [2, "Mercury"], [3, "Venus"], [4, "Mars"],
  [5, "Jupiter"], [6, "Saturn"], [7, "Uranus"], [8, "Neptune"], [9, "Pluto"],
] as const;

export const SWISS_ASTEROIDS = [
  [15, "Chiron"], [17, "Ceres"], [18, "Pallas"], [19, "Juno"], [20, "Vesta"],
] as const;

export function calculateSwissPosition(
  date: Date,
  body: number,
  options: Required<CalculationOptions>,
  lon = 0,
  lat = 0,
) {
  const swiss = loadSwiss();
  if (!swiss) throw new Error(swissLoadError ?? "Swiss Ephemeris is unavailable");
  configureSwiss(options, lon, lat);
  return swiss.calculatePosition(toJulianDay(date), body, swissFlags(options));
}

export function calculateSwissNode(
  date: Date,
  options: Required<CalculationOptions>,
  lon = 0,
  lat = 0,
) {
  const body = options.nodeType === "true" ? 11 : 10;
  return calculateSwissPosition(date, body, options, lon, lat);
}

export function calculateSwissHouses(
  date: Date,
  lat: number,
  lon: number,
  system: string,
  options: Required<CalculationOptions>,
) {
  const swiss = loadSwiss();
  if (!swiss) throw new Error(swissLoadError ?? "Swiss Ephemeris is unavailable");
  const result = swiss.calculateHouses(toJulianDay(date), lat, lon, system as Swiss.HouseSystem);
  if (options.zodiac !== "sidereal") return result;

  const ayanamsa = swiss.getAyanamsa(toJulianDay(date));
  const shift = (value: number) => (value - ayanamsa + 360) % 360;
  return {
    ...result,
    cusps: result.cusps.map((value) => (value ? shift(value) : value)),
    ascendant: shift(result.ascendant),
    mc: shift(result.mc),
    armc: shift(result.armc),
    vertex: shift(result.vertex),
    equatorialAscendant: shift(result.equatorialAscendant),
    coAscendant1: shift(result.coAscendant1),
    coAscendant2: shift(result.coAscendant2),
    polarAscendant: shift(result.polarAscendant),
  };
}

export function metadata(options?: CalculationOptions, date?: Date): EphemerisMetadata {
  const resolved = resolveCalculationOptions(options);
  const available = resolved.ephemeris !== "swiss" || (date ? isSwissAvailableForDate(date, resolved) : isSwissAvailable());
  const source: EphemerisSource = available ? resolved.ephemeris : "astronomy";
  return {
    source,
    requestedSource: resolved.ephemeris,
    zodiac: resolved.zodiac,
    nodeType: resolved.nodeType,
    topocentric: resolved.topocentric,
    includeAsteroids: resolved.includeAsteroids,
    siderealMode: resolved.zodiac === "sidereal" ? resolved.siderealMode : undefined,
    precision: source === "swiss" ? "swiss" : "astronomy-engine",
    fallbackReason: source === "astronomy" && resolved.ephemeris === "swiss" ? swissFallbackReason() : undefined,
  };
}
