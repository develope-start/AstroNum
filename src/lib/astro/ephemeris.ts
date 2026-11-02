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
  /** Features that are calculated natively by the selected engine. */
  capabilities: {
    houseSystems: string[];
    sidereal: boolean;
    trueNode: boolean;
    asteroids: boolean;
    chiron: boolean;
  };
}

export const ASTRONOMY_ENGINE_HOUSE_SYSTEMS = ["placidus", "whole_sign", "equal", "porphyry"] as const;

/**
 * Astronomy Engine is intentionally kept independent from Swiss Ephemeris.
 * It provides the ten major planets and mathematical chart layers without a
 * native asteroid catalogue, sidereal modes, or true lunar node. Rejecting
 * unsupported requests is preferable to silently mixing engines or faking a
 * result.
 */
export function assertEngineCapabilities(options: Required<CalculationOptions>, houseSystem?: string): void {
  if (options.ephemeris !== "astronomy") return;
  if (options.zodiac !== "tropical") throw new Error("Astronomy Engine currently supports the tropical zodiac only.");
  if (options.nodeType !== "mean") throw new Error("Astronomy Engine currently supports the mean lunar node only.");
  if (options.includeAsteroids) throw new Error("Astronomy Engine has no built-in asteroid catalogue; disable additional asteroids or choose Swiss Ephemeris.");
  if (houseSystem && !ASTRONOMY_ENGINE_HOUSE_SYSTEMS.includes(houseSystem as typeof ASTRONOMY_ENGINE_HOUSE_SYSTEMS[number])) {
    throw new Error(`Astronomy Engine supports ${ASTRONOMY_ENGINE_HOUSE_SYSTEMS.join(", ")} houses in this app.`);
  }
}

/** Deliberately structural: Swiss Ephemeris is loaded only at runtime so the
 * MIT Astronomy Engine build remains valid when the optional Swiss package is
 * not installed. */
type SwissModule = Record<string, (...args: any[]) => any>;
let swissModule: SwissModule | null | undefined;
let swissLoadError: string | undefined;

/** Load the native library only on the server and only when it is usable. */
function loadSwiss(): SwissModule | null {
  if (swissModule !== undefined) return swissModule;
  try {
    const nodeModule = process.getBuiltinModule("module") as typeof import("node:module") | undefined;
    if (!nodeModule) throw new Error("Node module loader is unavailable");
    const requireFromApp = nodeModule.createRequire(`${process.cwd()}/package.json`);
    swissModule = requireFromApp("@swisseph/node") as SwissModule;
  } catch (error) {
    swissModule = null;
    swissLoadError = error instanceof Error ? error.message : String(error);
    console.error("Unable to load Swiss Ephemeris native module:", swissLoadError);
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
    const bodies = [
      ...SWISS_PLANETS,
      [options.nodeType === "true" ? 11 : 10, "Node"],
      [12, "MeanLilith"],
      [15, "Chiron"],
      ...(options.includeAsteroids ? SWISS_ASTEROIDS : []),
    ];
    for (const entry of bodies) swiss.calculatePosition(toJulianDay(date), entry[0] as number, swissFlags(options));
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
  // Julian Date is a time-scale conversion, not a Swiss-only operation.
  // Keeping it pure makes the Astronomy Engine path deployable by itself.
  return date.getTime() / 86_400_000 + 2_440_587.5;
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

/** Mean Black Moon Lilith is Swiss Ephemeris body 12. Selena is represented
 * by the commonly used White Moon opposition to the mean apogee. */
export function calculateSwissLilith(
  date: Date,
  options: Required<CalculationOptions>,
  lon = 0,
  lat = 0,
) {
  return calculateSwissPosition(date, 12, options, lon, lat);
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
  // Sidereal mode is global state in Swiss Ephemeris. Configure it immediately
  // before the house calculation so a prior request cannot affect these cusps.
  configureSwiss(options, lon, lat);
  const result = swiss.calculateHouses(toJulianDay(date), lat, lon, system);
  if (options.zodiac !== "sidereal") return result;

  const ayanamsa = swiss.getAyanamsa(toJulianDay(date));
  const shift = (value: number) => (value - ayanamsa + 360) % 360;
  return {
    ...result,
    cusps: result.cusps.map((value: number) => (value ? shift(value) : value)),
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
    capabilities: source === "swiss"
      ? { houseSystems: ["placidus", "koch", "regiomontanus", "campanus", "alcabitius", "topocentric", "porphyry", "equal", "whole_sign"], sidereal: true, trueNode: true, asteroids: true, chiron: true }
      : { houseSystems: [...ASTRONOMY_ENGINE_HOUSE_SYSTEMS], sidereal: false, trueNode: false, asteroids: false, chiron: false },
  };
}
