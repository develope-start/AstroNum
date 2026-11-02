import { readFileSync } from "node:fs";
import { computeNatalChart, computeNatalChartAtUtc, computeTransitInterval } from "../src/lib/astro/chart";
import { computeAspectPatterns, computeAspects } from "../src/lib/astro/aspects";
import { computePlanetPositions, HOUSE_SYSTEM_VALUES } from "../src/lib/astro/positions";
import { buildCurrentTransitElementSnapshot, ELEMENT_PLANET_NAMES } from "../src/lib/astro/currentTransitElements";
import { wideDateToUtcDate } from "../src/lib/astro/wideDate";
import { calculateAngularity, calculateDeclinationContacts, calculateFixedStarContacts, calculateTraditionalDignities } from "../src/lib/astro/advanced";
import { computeSecondaryProgression } from "../src/lib/astro/progressions";
import { findPlanetaryReturn } from "../src/lib/astro/returns";
import { computeSolarArcDirections } from "../src/lib/astro/directions";
import { calculateRectification } from "../src/lib/astro/rectification";
import { calculateHarmonicAspects, calculateHarmonicPlanets, calculateMidpoints } from "../src/lib/astro/midpoints";
import { formatDegree } from "../src/lib/astro/signs";
import { dateToJulianDay, findNextSolarEclipse } from "@swisseph/node";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Astro validation failed: ${message}`);
}

function angularDifference(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return Math.min(raw, 360 - raw);
}

assert(formatDegree(4.99999) === "4°59'", "degree formatting never rounds minutes to 60");
assert(formatDegree(29.99999) === "29°59'", "degree formatting remains valid at a sign boundary");

const input = {
  date: "2000-01-01",
  // 16:00 Asia/Tbilisi is 12:00 UTC on this date; the reference below
  // therefore verifies the mandatory local-time -> UTC conversion.
  time: "16:00",
  timezone: "Asia/Tbilisi",
  lat: 41.7151,
  lon: 44.8271,
};

const swiss = computeNatalChart({ ...input, calculation: { ephemeris: "swiss" } }, "placidus");
for (const houseSystem of HOUSE_SYSTEM_VALUES) {
  const chart = computeNatalChart({ ...input, calculation: { ephemeris: "swiss" } }, houseSystem);
  assert(chart.houseSystem === houseSystem && chart.houseCusps.length === 12 && chart.houseCusps.every(Number.isFinite), `${houseSystem} houses are calculated by Swiss Ephemeris`);
}
const elementReferencePlanets = ELEMENT_PLANET_NAMES.map((name, index) => ({
  name,
  longitude: index * 30,
  speed: 1,
  retrograde: false,
}));
const currentElementSnapshot = buildCurrentTransitElementSnapshot(new Date("2026-10-14T12:00:00.000Z"), [
  ...elementReferencePlanets,
  { name: "Chiron", longitude: 0, speed: 0, retrograde: false },
]);
assert(currentElementSnapshot.balance.total === 10, "current transit element balance counts the ten classical planets only");
assert(currentElementSnapshot.elements.reduce((sum, item) => sum + item.percentage, 0) === 100, "current transit element percentages sum to 100");
assert(currentElementSnapshot.planets.length === 10, "current transit snapshot reports each classical planet once");
assert(currentElementSnapshot.aspects.every((aspect) => aspect.kind === "major"), "current transit snapshot lists only major aspects");
assert(currentElementSnapshot.aspects.length > 0, "current transit snapshot includes computed planetary aspects");
let incompleteTransitRejected = false;
try {
  buildCurrentTransitElementSnapshot(new Date("2026-10-14T12:00:00.000Z"), elementReferencePlanets.slice(1));
} catch (error) {
  incompleteTransitRejected = error instanceof Error && error.message.includes("missing one or more classical planets");
}
assert(incompleteTransitRejected, "current transit snapshot rejects incomplete planetary data");
const sun = swiss.planets.find((planet) => planet.name === "Sun");
assert(sun, "Sun is present");
assert(Math.abs(sun.longitude - 280.3689186985535) < 1e-7, "Swiss J2000 Sun reference changed");
assert(Math.abs(swiss.ascendant - 78.45236330142991) < 1e-7, "Swiss Placidus Ascendant reference changed");
assert(swiss.houseCusps.length === 12, "Swiss house cusp count is 12");
assert(angularDifference(swiss.houseCusps[9]!, swiss.mc) < 1e-7, "Placidus tenth-house cusp is exactly the Swiss MC");
assert(swiss.ephemeris.source === "swiss", "Swiss metadata is present");
assert(swiss.timeZone === "Asia/Tbilisi", "the resolved IANA timezone is retained in chart metadata");
assert(swiss.utcOffsetMinutes === 240, "the historical IANA UTC offset is retained in chart metadata");
assert(Math.abs(swiss.julianDay - 2451545) < 1e-9, "UTC instant is converted to the expected Swiss Julian Date");

// Historical Georgian daylight-saving regression: Rustavi observed UTC+5 in June 1995.
// This verifies that a modern UTC+4 offset is never incorrectly applied to old birth records.
const rustavi1995 = computeNatalChart({
  date: "1995-06-22",
  time: "09:50",
  timezone: "Asia/Tbilisi",
  lat: 41.5495,
  lon: 45.0,
  calculation: { ephemeris: "swiss", zodiac: "tropical", nodeType: "mean" },
}, "placidus");
assert(rustavi1995.utcIso === "1995-06-22T04:50:00.000Z", "1995 Rustavi local time uses the historical UTC+5 daylight-saving offset");
assert(rustavi1995.utcOffsetMinutes === 300, "1995 Rustavi UTC offset is +05:00");
assert(Math.abs(rustavi1995.houseCusps[9]! - 29.473202062065987) < 1e-7, "1995 Rustavi Placidus tenth-house cusp remains Aries 29°28′");
assert(rustavi1995.planetHouses.Moon === 9, "1995 Rustavi Moon remains in the ninth Placidus house");
assert(rustavi1995.planetHouses.MeanNode === 4 && rustavi1995.planetHouses.SouthNode === 10, "1995 Rustavi lunar nodes remain in the fourth and tenth houses");

// Independent oracle supplied with the project. The same output contract is
// tested for both adapters; Astronomy Engine intentionally returns no Chiron.
const swissephReference = JSON.parse(readFileSync("data/reference_swisseph.json", "utf8")) as {
  input: { lat: number; lon: number };
  tolerance_arcmin: { planets: number; houses_asc_mc: number; node_lilith: number; chiron: number };
  planets_ecliptic_longitude_deg: Record<string, number>;
  retrograde: Record<string, boolean>;
  placidus_cusps_deg: number[];
};
const referenceBirth = {
  date: "1995-06-22",
  time: "09:50",
  timezone: "Asia/Tbilisi",
  lat: swissephReference.input.lat,
  lon: swissephReference.input.lon,
};
const referenceName = (name: string) => name === "NNode" ? "MeanNode" : name === "SNode" ? "SouthNode" : name;
const referencePoint = (chart: ReturnType<typeof computeNatalChart>, name: string) => {
  if (name === "ASC") return chart.ascendant;
  if (name === "MC") return chart.mc;
  return chart.planets.find((point) => point.name === referenceName(name))?.longitude;
};
for (const source of ["swiss", "astronomy"] as const) {
  const chart = computeNatalChart({ ...referenceBirth, calculation: { ephemeris: source, zodiac: "tropical", nodeType: "mean" } }, "placidus");
  for (const [name, expected] of Object.entries(swissephReference.planets_ecliptic_longitude_deg)) {
    const actual = referencePoint(chart, name);
    if (source === "astronomy" && name === "Chiron") {
      assert(actual === undefined, "Astronomy Engine explicitly reports Chiron as unavailable");
      continue;
    }
    assert(actual !== undefined, `${source} returns ${name} in the common result contract`);
    const toleranceArcmin = name === "NNode" || name === "SNode" || name === "Lilith"
      ? swissephReference.tolerance_arcmin.node_lilith
      : name === "Chiron"
        ? swissephReference.tolerance_arcmin.chiron
        : name === "ASC" || name === "MC"
          ? swissephReference.tolerance_arcmin.houses_asc_mc
          : swissephReference.tolerance_arcmin.planets;
    assert(
      angularDifference(actual, expected) * 60 <= toleranceArcmin,
      `${source} ${name} differs from reference by ${(angularDifference(actual, expected) * 60).toFixed(4)}′ (limit ${toleranceArcmin}′)`,
    );
  }
  if (source === "swiss") {
    for (const [name, retrograde] of Object.entries(swissephReference.retrograde)) {
      assert(chart.planets.find((point) => point.name === name)?.retrograde === retrograde, `Swiss reference retrograde state is retained for ${name}`);
    }
    swissephReference.placidus_cusps_deg.forEach((expected, index) => {
      assert(angularDifference(chart.houseCusps[index]!, expected) * 60 <= 0.001, `Swiss Placidus cusp ${index + 1} matches the reference oracle`);
    });
  }
}

const comparisonDates = [
  "1969-07-20T20:17:00.000Z",
  "1987-11-09T12:00:00.000Z",
  "1995-06-22T04:50:00.000Z",
  "2000-01-01T12:00:00.000Z",
  "2025-10-14T12:00:00.000Z",
  "2045-03-20T09:00:00.000Z",
];
const engineComparison = comparisonDates.map((utcIso) => {
  const date = new Date(utcIso);
  const swissChart = computeNatalChartAtUtc(date, swissephReference.input.lat, swissephReference.input.lon, { ephemeris: "swiss" }, "placidus");
  const astronomyChart = computeNatalChartAtUtc(date, swissephReference.input.lat, swissephReference.input.lon, { ephemeris: "astronomy" }, "placidus");
  const names = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  const planetDeltaArcmin = Math.max(...names.map((name) => angularDifference(
    swissChart.planets.find((point) => point.name === name)!.longitude,
    astronomyChart.planets.find((point) => point.name === name)!.longitude,
  ) * 60));
  const angleDeltaArcmin = Math.max(
    angularDifference(swissChart.ascendant, astronomyChart.ascendant) * 60,
    angularDifference(swissChart.mc, astronomyChart.mc) * 60,
  );
  const nodeDeltaArcmin = angularDifference(
    swissChart.planets.find((point) => point.name === "MeanNode")!.longitude,
    astronomyChart.planets.find((point) => point.name === "MeanNode")!.longitude,
  ) * 60;
  const lilithDeltaArcmin = angularDifference(
    swissChart.planets.find((point) => point.name === "Lilith")!.longitude,
    astronomyChart.planets.find((point) => point.name === "Lilith")!.longitude,
  ) * 60;
  assert(planetDeltaArcmin <= swissephReference.tolerance_arcmin.planets, `${utcIso}: planet comparison remains within 1′`);
  assert(angleDeltaArcmin <= swissephReference.tolerance_arcmin.houses_asc_mc, `${utcIso}: ASC/MC comparison remains within 1′`);
  assert(nodeDeltaArcmin <= swissephReference.tolerance_arcmin.node_lilith && lilithDeltaArcmin <= swissephReference.tolerance_arcmin.node_lilith, `${utcIso}: node/Lilith comparison remains within 2′`);
  return {
    utc: utcIso.slice(0, 10),
    "max planet Δ′": Number(planetDeltaArcmin.toFixed(3)),
    "max ASC/MC Δ′": Number(angleDeltaArcmin.toFixed(3)),
    "node Δ′": Number(nodeDeltaArcmin.toFixed(3)),
    "Lilith Δ′": Number(lilithDeltaArcmin.toFixed(3)),
  };
});
console.table(engineComparison);
assert(swiss.planets.some((planet) => planet.name === "MeanNode"), "Mean Node is explicitly identified");
assert(swiss.planets.some((planet) => planet.name === "SouthNode"), "South Node is explicitly identified");
assert(swiss.planets.some((planet) => planet.name === "Vertex"), "Swiss House calculation supplies Vertex");
assert(swiss.planets.some((planet) => planet.name === "Fortune"), "traditional Part of Fortune is calculated");
assert(swiss.planets.some((planet) => planet.name === "Spirit"), "traditional Part of Spirit is calculated");
assert(swiss.patterns.every((pattern) => Number.isFinite(pattern.meanOrb)), "aspect pattern scores are finite");
const fortune = swiss.planets.find((planet) => planet.name === "Fortune");
const spirit = swiss.planets.find((planet) => planet.name === "Spirit");
assert(fortune && spirit && angularDifference(fortune.longitude, (2 * swiss.ascendant - spirit.longitude + 720) % 360) < 1e-9, "traditional Lots mirror around the Ascendant");
const grandTrinePoints = [
  { name: "Sun", longitude: 0, speed: 0 },
  { name: "Moon", longitude: 120, speed: 0 },
  { name: "Jupiter", longitude: 240, speed: 0 },
];
assert(computeAspectPatterns(grandTrinePoints, computeAspects(grandTrinePoints)).some((pattern) => pattern.kind === "grand_trine"), "exact grand trine is identified from aspect geometry");
const meanNode = swiss.planets.find((planet) => planet.name === "MeanNode");
const southNode = swiss.planets.find((planet) => planet.name === "SouthNode");
assert(meanNode && southNode && angularDifference(meanNode.longitude, southNode.longitude) === 180, "South Node is exactly opposite the selected North Node");

const advanced = computeNatalChart(
  { ...input, calculation: { ephemeris: "swiss", zodiac: "sidereal", siderealMode: 1, nodeType: "true", topocentric: true, altitudeMeters: 120, includeAsteroids: true } },
  "placidus",
);
assert(advanced.ephemeris.source === "swiss", "advanced Swiss calculation stays on Swiss Ephemeris");
assert(advanced.ephemeris.zodiac === "sidereal", "sidereal mode is preserved in metadata");
assert(advanced.ephemeris.nodeType === "true", "true node selection is preserved in metadata");
assert(advanced.ephemeris.topocentric, "topocentric mode is preserved in metadata");
assert(advanced.ephemeris.includeAsteroids, "asteroid selection is preserved in metadata");
assert(advanced.planets.some((planet) => planet.name === "TrueNode"), "True Node is explicitly identified");
for (const name of ["Chiron", "Ceres", "Pallas", "Juno", "Vesta"]) {
  assert(advanced.planets.some((planet) => planet.name === name), `${name} is available when asteroids are enabled`);
}

const dignities = calculateTraditionalDignities(swiss.planets);
assert(dignities.length === swiss.planets.length, "traditional dignity output covers every chart point");
const dignityReference = calculateTraditionalDignities([{ name: "Sun", longitude: 130, speed: 1, retrograde: false }]);
assert(dignityReference[0]?.status === "domicile", "traditional domicile rule is active");
const angularity = calculateAngularity(swiss.planets, { ascendant: swiss.ascendant, mc: swiss.mc });
assert(angularity.length === swiss.planets.length, "angularity output covers every chart point");
const declinationContacts = calculateDeclinationContacts(swiss.planets);
assert(declinationContacts.every((item) => item.orb <= 1), "declination contacts respect the configured orb");
const fixedStarContacts = calculateFixedStarContacts(new Date(swiss.utcIso), swiss.planets);
assert(fixedStarContacts.every((item) => item.orb <= 1 && Number.isFinite(item.longitude)), "fixed-star contacts have finite coordinates and valid orbs");

const progression = computeSecondaryProgression({ ...input, calculation: { ephemeris: "swiss" } }, "2025-01-01", "placidus");
assert(progression.method === "secondary", "secondary progression method is explicit");
assert(progression.ageYears > 24 && progression.ageYears < 26, "secondary progression age is calculated from the target date");
assert(progression.progressed.planets.length === progression.natal.planets.length, "progressed chart preserves the natal point set");
const midpoints = calculateMidpoints(swiss.planets);
assert(midpoints.length === (swiss.planets.length * (swiss.planets.length - 1)) / 2, "midpoint matrix is complete");
assert(calculateHarmonicPlanets(swiss.planets, 5).every((planet) => planet.longitude >= 0 && planet.longitude < 360), "harmonic longitudes are normalized");
assert(calculateHarmonicAspects(swiss.planets, 5).every((aspect) => Number.isFinite(aspect.orb)), "harmonic aspects are finite");
const solarReturn = findPlanetaryReturn({ ...input, calculation: { ephemeris: "swiss" } }, "Sun", wideDateToUtcDate("2025-01-01")!, wideDateToUtcDate("2026-01-01")!, "placidus");
assert(solarReturn.orb < 0.001, "solar return root finder reaches sub-arcminute precision");
const solarArc = computeSolarArcDirections({ ...input, calculation: { ephemeris: "swiss" } }, "2025-01-01", "placidus");
assert(solarArc.directedPlanets.length === swiss.planets.length, "solar arc directs every natal point");
const rectificationBirth = {
  name: "Test",
  place: "Tbilisi",
  date: "1992-04-17",
  time: "14:26",
  timezone: "Asia/Tbilisi",
  lat: 41.7151,
  lon: 44.8271,
};
const rectificationEvents = [
  { type: "marriage" as const, date: "2015-06-20" },
  { type: "career" as const, date: "2019-09-15" },
  { type: "relocation" as const, date: "2022-03-12" },
];
const rectification = calculateRectification(rectificationBirth, rectificationEvents, 5);
assert(rectification.scannedCandidates === 11, "rectification scans every minute in the selected interval");
assert(rectification.candidates.length > 0, "rectification returns ranked real chart candidates");
assert(rectification.candidates.every((candidate) => candidate.eventMatches.length === 3), "each candidate reports matches for all supplied events");
assert(!("confidence" in rectification), "rectification does not report a fabricated confidence percentage");
const changedEventDates = calculateRectification(
  rectificationBirth,
  [{ ...rectificationEvents[0]! }, { ...rectificationEvents[1]!, date: "2020-09-15" }, { ...rectificationEvents[2]! }],
  5,
);
assert(
  JSON.stringify(rectification.candidates.map((candidate) => candidate.eventMatches.map((match) => match.orb)))
    !== JSON.stringify(changedEventDates.candidates.map((candidate) => candidate.eventMatches.map((match) => match.orb))),
  "changing an event date changes the calculated Solar Arc event orbs",
);
const eclipse = findNextSolarEclipse(dateToJulianDay(new Date("2025-01-01T12:00:00.000Z")));
assert(Number.isFinite(eclipse.maximum), "Swiss eclipse search returns a finite maximum time");

const astronomy = computePlanetPositions(
  new Date("2000-01-01T12:00:00.000Z"),
  { ephemeris: "astronomy" },
);
for (const swissPlanet of swiss.planets.filter((planet) => ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(planet.name))) {
  const astronomyPlanet = astronomy.find((planet) => planet.name === swissPlanet.name);
  assert(astronomyPlanet, `${swissPlanet.name} exists in fallback engine`);
  assert(angularDifference(swissPlanet.longitude, astronomyPlanet.longitude) < 0.5, `${swissPlanet.name} engine delta is below 0.5°`);
}

let coordinateTimezoneRejected = false;
try {
  computeNatalChart({ ...input, timezone: "UTC", calculation: { ephemeris: "swiss" } });
} catch (error) {
  coordinateTimezoneRejected = error instanceof Error && error.message.includes("does not match");
}
assert(coordinateTimezoneRejected, "static or coordinate-mismatched timezones are rejected");

const astronomyChart = computeNatalChart({ ...input, calculation: { ephemeris: "astronomy", topocentric: true, altitudeMeters: 120 } }, "placidus");
assert(astronomyChart.ephemeris.source === "astronomy", "Astronomy Engine remains the selected engine");
assert(astronomyChart.planets.filter((planet) => ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(planet.name)).length === 10, "Astronomy Engine provides all ten major planets");
assert(!astronomyChart.planets.some((planet) => planet.name === "Chiron"), "Astronomy Engine does not silently borrow Chiron from Swiss Ephemeris");
assert(astronomyChart.houseCusps.length === 12 && astronomyChart.houseCusps.every(Number.isFinite), "Astronomy Engine chart includes calculated houses");
assert(astronomyChart.aspects.length > 0 && astronomyChart.patterns.every((pattern) => Number.isFinite(pattern.meanOrb)), "Astronomy Engine uses the full aspect and interpretation pipeline");
let astronomyFeatureRejected = false;
try {
  computeNatalChart({ ...input, calculation: { ephemeris: "astronomy", includeAsteroids: true } }, "placidus");
} catch (error) {
  astronomyFeatureRejected = error instanceof Error && error.message.includes("asteroid catalogue");
}
assert(astronomyFeatureRejected, "Astronomy Engine rejects unavailable asteroid features instead of mixing engines");

for (const value of ["-10000-01-01", "-5400-06-15", "10000-12-31"]) {
  const date = wideDateToUtcDate(value);
  assert(date && Number.isFinite(date.getTime()), `wide date ${value} converts to UTC`);
  let verified = false;
  try {
    const chart = computeNatalChart({ ...input, date: value, calculation: { ephemeris: "swiss" } });
    assert(chart.planets.every((planet) => Number.isFinite(planet.longitude)), `wide date ${value} has finite Swiss positions`);
    assert(chart.ephemeris.source === "swiss", `wide date ${value} never substitutes a different engine`);
    verified = true;
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Swiss Ephemeris cannot calculate")) throw error;
    verified = true;
  }
  assert(verified, `wide date ${value} is either Swiss-calculated or explicitly rejected`);
}

const start = new Date("2025-01-01T12:00:00.000Z");
const end = new Date("2025-01-04T12:00:00.000Z");
const interval = computeTransitInterval(swiss, start, end);
assert(interval.samples.length > 1, "transit interval scans multiple samples");
assert(interval.peakAspects.length >= 0, "transit interval returns peak aspect collection");

console.log(`Astro validation passed: Swiss Ephemeris, fallback comparison, wide dates, ${interval.samples.length} transit samples, and real rectification candidate scans.`);
