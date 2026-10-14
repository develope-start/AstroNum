import { DateTime } from "luxon";
import { birthInputToUtcDate, computeNatalChart, type BirthInput, type NatalResult } from "./chart";
import { computePlanetPositions } from "./positions";
import { secondaryProgressedMoment } from "./progressions";
import { parseWideDate } from "./wideDate";

export type RectificationEventType =
  | "marriage"
  | "child"
  | "career"
  | "relocation"
  | "graduation"
  | "crisis";

export interface RectificationEvent {
  type: RectificationEventType;
  date: string;
}

export interface RectificationCandidate {
  date: string;
  time: string;
  offsetMinutes: number;
  matchedEventCount: number;
  meanMatchedOrb: number | null;
  eventMatches: Array<{
    type: RectificationEventType;
    date: string;
    directedPoint: string;
    natalPoint: string;
    aspect: string;
    orb: number;
    matched: boolean;
  }>;
  ascendant: number;
  mc: number;
}

export interface RectificationResult {
  method: "solar_arc_event_correlation";
  scannedCandidates: number;
  uncertaintyMinutes: number;
  status: "candidate_found" | "no_clear_match";
  candidates: RectificationCandidate[];
}

const ASPECTS = [
  { name: "conjunction", angle: 0 },
  { name: "sextile", angle: 60 },
  { name: "square", angle: 90 },
  { name: "trine", angle: 120 },
  { name: "opposition", angle: 180 },
] as const;

const EVENT_SIGNALS: Record<RectificationEventType, Array<[string, string]>> = {
  marriage: [
    ["ASC", "Venus"], ["DSC", "Venus"], ["MC", "Venus"],
    ["Venus", "DSC"], ["Venus", "House 7"], ["Moon", "DSC"],
  ],
  child: [
    ["Moon", "House 5"], ["Jupiter", "House 5"], ["House 5", "Moon"],
    ["House 5", "Jupiter"], ["MC", "Moon"],
  ],
  career: [
    ["MC", "Sun"], ["MC", "Saturn"], ["Sun", "MC"],
    ["Saturn", "MC"], ["Jupiter", "MC"], ["MC", "House 10"],
  ],
  relocation: [
    ["IC", "Moon"], ["IC", "House 4"], ["Moon", "IC"],
    ["Jupiter", "IC"], ["House 4", "Moon"],
  ],
  graduation: [
    ["Mercury", "House 9"], ["Jupiter", "House 9"], ["MC", "Mercury"],
    ["Mercury", "MC"], ["House 9", "Mercury"],
  ],
  crisis: [
    ["Mars", "ASC"], ["Saturn", "ASC"], ["Pluto", "ASC"],
    ["Mars", "MC"], ["Saturn", "MC"], ["MC", "Pluto"],
  ],
};

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function angularDistance(left: number, right: number): number {
  const difference = Math.abs(normalizeDegrees(left - right));
  return Math.min(difference, 360 - difference);
}

function getPointPositions(chart: NatalResult): Map<string, number> {
  return new Map([
    ...chart.planets.map((planet) => [planet.name, planet.longitude] as [string, number]),
    ["ASC", chart.ascendant],
    ["DSC", chart.descendant],
    ["MC", chart.mc],
    ["IC", chart.ic],
    ["House 4", chart.houseCusps[3]!],
    ["House 5", chart.houseCusps[4]!],
    ["House 7", chart.houseCusps[6]!],
    ["House 9", chart.houseCusps[8]!],
    ["House 10", chart.houseCusps[9]!],
  ]);
}

function bestSignal(
  event: RectificationEvent,
  directed: Map<string, number>,
  natal: Map<string, number>,
) {
  let best: RectificationCandidate["eventMatches"][number] | null = null;

  for (const [directedPoint, natalPoint] of EVENT_SIGNALS[event.type]) {
    const directedLongitude = directed.get(directedPoint);
    const natalLongitude = natal.get(natalPoint);
    if (directedLongitude === undefined || natalLongitude === undefined) continue;
    const separation = angularDistance(directedLongitude, natalLongitude);

    for (const aspect of ASPECTS) {
      const orb = Math.abs(separation - aspect.angle);
      if (!best || orb < best.orb) {
        best = {
          type: event.type,
          date: event.date,
          directedPoint,
          natalPoint,
          aspect: aspect.name,
          orb: Math.round(orb * 100) / 100,
          matched: orb <= 2,
        };
      }
    }
  }

  return best;
}

function candidateBirthInput(birth: BirthInput, offsetMinutes: number): BirthInput {
  const date = parseWideDate(birth.date);
  if (!date) throw new Error("დაბადების თარიღი არასწორია");
  const [hour, minute] = birth.time.split(":").map(Number);
  const localTime = DateTime.fromObject(
    { ...date, hour: 0, minute: 0 },
    { zone: birth.timezone },
  ).plus({ minutes: hour! * 60 + minute! + offsetMinutes });
  if (!localTime.isValid) {
    throw new Error(`დაბადების დროის ზონა არასწორია: ${localTime.invalidExplanation}`);
  }

  return {
    ...birth,
    time: localTime.toFormat("HH:mm"),
    date: localTime.toFormat("yyyy-MM-dd"),
  };
}

function eventUtc(event: RectificationEvent, timezone: string): Date {
  const date = parseWideDate(event.date);
  if (!date) throw new Error("ცხოვრებისეული მოვლენის თარიღი არასწორია");
  const localNoon = DateTime.fromObject(
    { ...date, hour: 12, minute: 0 },
    { zone: timezone },
  );
  if (!localNoon.isValid) {
    throw new Error(`მოვლენის დროის ზონა არასწორია: ${localNoon.invalidExplanation}`);
  }
  return localNoon.toUTC().toJSDate();
}

function scoreCandidate(
  birth: BirthInput,
  events: RectificationEvent[],
  eventDates: Date[],
  offsetMinutes: number,
): RectificationCandidate {
  const candidateBirth = candidateBirthInput(birth, offsetMinutes);
  const natalChart = computeNatalChart(candidateBirth, "placidus");
  const birthUtc = new Date(natalChart.utcIso);
  const natalPoints = getPointPositions(natalChart);
  const natalSun = natalPoints.get("Sun");
  if (natalSun === undefined) throw new Error("ნატალური მზის პოზიცია ვერ მოიძებნა");

  const matches = events.map((event, index) => {
    const { progressedUtc } = secondaryProgressedMoment(birthUtc, eventDates[index]!);
    const progressedSun = computePlanetPositions(
      progressedUtc,
      {
        ephemeris: natalChart.ephemeris.source,
        zodiac: natalChart.ephemeris.zodiac,
        nodeType: natalChart.ephemeris.nodeType,
        siderealMode: natalChart.ephemeris.siderealMode,
        topocentric: natalChart.ephemeris.topocentric,
        includeAsteroids: natalChart.ephemeris.includeAsteroids,
      },
      birth.lon,
      birth.lat,
    ).find((planet) => planet.name === "Sun")?.longitude;
    if (progressedSun === undefined) throw new Error("პროგრესირებული მზის პოზიცია ვერ გამოითვალა");

    const solarArc = normalizeDegrees(progressedSun - natalSun);
    const directedPoints = new Map<string, number>(
      [...natalPoints].map(([point, longitude]) => [point, normalizeDegrees(longitude + solarArc)]),
    );
    const signal = bestSignal(event, directedPoints, natalPoints);
    if (!signal) throw new Error("მოვლენის ასტროლოგიური ინდიკატორი ვერ შეფასდა");
    return signal;
  });
  const matchedOrbs = matches.filter((match) => match.matched).map((match) => match.orb);

  return {
    date: candidateBirth.date,
    time: candidateBirth.time,
    offsetMinutes,
    matchedEventCount: matchedOrbs.length,
    meanMatchedOrb: matchedOrbs.length
      ? Math.round((matchedOrbs.reduce((sum, orb) => sum + orb, 0) / matchedOrbs.length) * 100) / 100
      : null,
    eventMatches: matches,
    ascendant: Math.round(natalChart.ascendant * 100) / 100,
    mc: Math.round(natalChart.mc * 100) / 100,
  };
}

export function calculateRectification(
  birth: BirthInput,
  events: RectificationEvent[],
  uncertaintyMinutes: number,
): RectificationResult {
  if (events.length < 3) throw new Error("რექტიფიკაციისთვის მინიმუმ 3 ცხოვრებისეული მოვლენის თარიღია საჭირო");
  if (events.length > 10) throw new Error("ერთ გამოთვლაში მაქსიმუმ 10 მოვლენა შეიძლება შეფასდეს");
  if (!Number.isInteger(uncertaintyMinutes) || uncertaintyMinutes < 5 || uncertaintyMinutes > 120) {
    throw new Error("დროის ცდომილების დიაპაზონი უნდა იყოს 5-120 წუთი");
  }

  const eventDates = events.map((event) => eventUtc(event, birth.timezone));
  const lastCandidate = candidateBirthInput(birth, uncertaintyMinutes);
  const lastUtc = birthInputToUtcDate(lastCandidate);
  const now = Date.now();
  if (eventDates.some((date) => date.getTime() < lastUtc.getTime() || date.getTime() > now)) {
    throw new Error("მოვლენები დაბადების სავარაუდო პერიოდსა და დღევანდელ თარიღს შორის უნდა იყოს");
  }
  if (eventDates.some((date, index) => eventDates.some((other, otherIndex) => index !== otherIndex && date.getTime() === other.getTime()))) {
    throw new Error("თითოეული მოვლენა განსხვავებული თარიღით უნდა იყოს მითითებული");
  }

  const candidates: RectificationCandidate[] = [];
  for (let offset = -uncertaintyMinutes; offset <= uncertaintyMinutes; offset += 1) {
    candidates.push(scoreCandidate(birth, events, eventDates, offset));
  }

  candidates.sort((left, right) => {
    if (left.matchedEventCount !== right.matchedEventCount) {
      return right.matchedEventCount - left.matchedEventCount;
    }
    return (left.meanMatchedOrb ?? 181) - (right.meanMatchedOrb ?? 181);
  });

  const distinctCandidates: RectificationCandidate[] = [];
  for (const candidate of candidates) {
    if (distinctCandidates.every((item) => Math.abs(item.offsetMinutes - candidate.offsetMinutes) >= 5)) {
      distinctCandidates.push(candidate);
      if (distinctCandidates.length === 5) break;
    }
  }
  const bestCandidate = distinctCandidates[0];

  return {
    method: "solar_arc_event_correlation",
    scannedCandidates: uncertaintyMinutes * 2 + 1,
    uncertaintyMinutes,
    status: bestCandidate?.matchedEventCount === events.length ? "candidate_found" : "no_clear_match",
    candidates: distinctCandidates,
  };
}
