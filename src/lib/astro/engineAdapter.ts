import {
  CalculationOptions,
  EphemerisSource,
  resolveCalculationOptions,
} from "./ephemeris";
import {
  ChartAngles,
  computeAngles,
  computeHouseCusps,
  computeNorthNode,
  computePlanetPositions,
  HouseCusps,
  HouseSystem,
  PlanetPosition,
} from "./positions";

/**
 * Common, intentionally engine-neutral result used by the chart pipeline.
 * Both implementations return this exact shape, so aspects, houses and
 * interpretation code never need to know which ephemeris produced a chart.
 */
export interface EngineChartFrame {
  planets: PlanetPosition[];
  northNode: PlanetPosition;
  lilith: PlanetPosition | null;
  /** Null is an explicit capability result, never a Swiss fallback. */
  chiron: PlanetPosition | null;
  angles: ChartAngles;
  houses: HouseCusps;
}

export interface EphemerisEngine {
  readonly source: EphemerisSource;
  calcBodies(utc: Date, latitude: number, longitude: number, houseSystem: HouseSystem): EngineChartFrame;
}

class ChartEngineAdapter implements EphemerisEngine {
  constructor(
    public readonly source: EphemerisSource,
    private readonly options: Required<CalculationOptions>,
  ) {}

  calcBodies(utc: Date, latitude: number, longitude: number, houseSystem: HouseSystem): EngineChartFrame {
    // Pin the requested source inside this adapter. This prevents an
    // accidental mixed-source result when callers reuse option objects.
    const options = { ...this.options, ephemeris: this.source } as Required<CalculationOptions>;
    const planets = computePlanetPositions(utc, options, longitude, latitude);
    const northNode = computeNorthNode(utc, options, longitude, latitude);
    const angles = computeAngles(utc, longitude, latitude, options);
    const houses = computeHouseCusps(angles, houseSystem, utc, longitude, latitude, options);
    return {
      planets,
      northNode,
      lilith: planets.find((point) => point.name === "Lilith") ?? null,
      chiron: planets.find((point) => point.name === "Chiron") ?? null,
      angles,
      houses,
    };
  }
}

/** Selects one of two interchangeable implementations behind one contract. */
export function getEphemerisEngine(input?: CalculationOptions): EphemerisEngine {
  const options = resolveCalculationOptions(input);
  return new ChartEngineAdapter(options.ephemeris, options);
}
