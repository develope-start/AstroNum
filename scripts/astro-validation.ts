import { computeNatalChart, computeTransitInterval } from "../src/lib/astro/chart";
import { computePlanetPositions } from "../src/lib/astro/positions";
import { wideDateToUtcDate } from "../src/lib/astro/wideDate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Astro validation failed: ${message}`);
}

function angularDifference(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return Math.min(raw, 360 - raw);
}

const input = {
  date: "2000-01-01",
  time: "12:00",
  timezone: "UTC",
  lat: 41.7151,
  lon: 44.8271,
};

const swiss = computeNatalChart({ ...input, calculation: { ephemeris: "swiss" } }, "placidus");
const sun = swiss.planets.find((planet) => planet.name === "Sun");
assert(sun, "Sun is present");
assert(Math.abs(sun.longitude - 280.3689186985535) < 1e-7, "Swiss J2000 Sun reference changed");
assert(Math.abs(swiss.ascendant - 78.45236330142991) < 1e-7, "Swiss Placidus Ascendant reference changed");
assert(swiss.houseCusps.length === 12, "Swiss house cusp count is 12");
assert(swiss.ephemeris.source === "swiss", "Swiss metadata is present");
assert(swiss.planets.some((planet) => planet.name === "MeanNode"), "Mean Node is explicitly identified");

const astronomy = computePlanetPositions(
  new Date("2000-01-01T12:00:00.000Z"),
  { ephemeris: "astronomy" },
);
for (const swissPlanet of swiss.planets.filter((planet) => planet.name !== "MeanNode")) {
  const astronomyPlanet = astronomy.find((planet) => planet.name === swissPlanet.name);
  assert(astronomyPlanet, `${swissPlanet.name} exists in fallback engine`);
  assert(angularDifference(swissPlanet.longitude, astronomyPlanet.longitude) < 0.5, `${swissPlanet.name} engine delta is below 0.5°`);
}

for (const value of ["-10000-01-01", "-5400-06-15", "10000-12-31"]) {
  const date = wideDateToUtcDate(value);
  assert(date && Number.isFinite(date.getTime()), `wide date ${value} converts to UTC`);
  const chart = computeNatalChart({ ...input, date: value, calculation: { ephemeris: "swiss" } });
  assert(chart.planets.every((planet) => Number.isFinite(planet.longitude)), `wide date ${value} has finite positions`);
}

const start = new Date("2025-01-01T12:00:00.000Z");
const end = new Date("2025-01-04T12:00:00.000Z");
const interval = computeTransitInterval(swiss, start, end);
assert(interval.samples.length > 1, "transit interval scans multiple samples");
assert(interval.peakAspects.length >= 0, "transit interval returns peak aspect collection");

console.log(`Astro validation passed: Swiss Ephemeris, fallback comparison, wide dates, and ${interval.samples.length} transit samples.`);
