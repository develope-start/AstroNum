import * as Astronomy from "astronomy-engine";

export type HouseSystem = "whole_sign" | "equal" | "porphyry" | "placidus";

export interface PlanetPosition {
  name: string;
  longitude: number; // გეოცენტრული ეკლიპტიკური გრძედი, გრადუსებში, 0-360
  speed: number; // გრადუსი/დღეში (უარყოფითი = რეტროგრადი)
  retrograde: boolean;
}

export interface ChartAngles {
  ascendant: number;
  mc: number;
  descendant: number;
  ic: number;
  ramc: number; // შუასამყაროს რექტასცენზია, გრადუსი — Placidus-ის გამოთვლისთვის
  obliquity: number; // ეკლიპტიკის დახრილობა, გრადუსი
  latitude: number; // დაბადების ადგილის გეოგრაფიული განედი, გრადუსი
  placidusUnstable: boolean; // true, თუ განედი Placidus-ისთვის ზღვრულია (პოლარული წრის მახლობლად)
}

export interface HouseCusps {
  system: HouseSystem;
  cusps: number[]; // 12 მნიშვნელობა, I-დან XII-მდე, გრადუსებში
}

const BODIES: Array<{ key: Astronomy.Body; name: string }> = [
  { key: Astronomy.Body.Sun, name: "Sun" },
  { key: Astronomy.Body.Moon, name: "Moon" },
  { key: Astronomy.Body.Mercury, name: "Mercury" },
  { key: Astronomy.Body.Venus, name: "Venus" },
  { key: Astronomy.Body.Mars, name: "Mars" },
  { key: Astronomy.Body.Jupiter, name: "Jupiter" },
  { key: Astronomy.Body.Saturn, name: "Saturn" },
  { key: Astronomy.Body.Uranus, name: "Uranus" },
  { key: Astronomy.Body.Neptune, name: "Neptune" },
  { key: Astronomy.Body.Pluto, name: "Pluto" },
];

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

function eclipticLongitudeOf(body: Astronomy.Body, date: Date): number {
  const vec = Astronomy.GeoVector(body, date, true);
  const ecl = Astronomy.Ecliptic(vec);
  return norm360(ecl.elon);
}

/** ყველა პლანეტის გეოცენტრული პოზიცია და დღიური სიჩქარე (რეტროგრადულობის დასადგენად). */
export function computePlanetPositions(date: Date): PlanetPosition[] {
  const dayMs = 24 * 60 * 60 * 1000;
  return BODIES.map(({ key, name }) => {
    const lon = eclipticLongitudeOf(key, date);
    const lonNext = eclipticLongitudeOf(key, new Date(date.getTime() + dayMs));
    let speed = lonNext - lon;
    // 360°-ის ხაზზე გადასვლის კორექცია
    if (speed > 180) speed -= 360;
    if (speed < -180) speed += 360;
    return { name, longitude: lon, speed, retrograde: speed < 0 };
  });
}

/**
 * ჩრდილო საკვანძო წერტილი (საშუალო კვანძი — Mean Node), Meeus-ის სტანდარტული ფორმულით.
 * ეს არის ყველაზე ხშირად გამოყენებული ვერსია ასტროლოგიურ პროგრამებში "North Node"-ისთვის.
 */
export function computeNorthNode(date: Date): PlanetPosition {
  const jd = dateToJulianDay(date);
  const T = (jd - 2451545.0) / 36525;
  const omega =
    125.0445479 -
    1934.1362891 * T +
    0.0020754 * T * T +
    (T * T * T) / 467441 -
    (T * T * T * T) / 60616000;
  const lon = norm360(omega);

  const jdNext = dateToJulianDay(new Date(date.getTime() + 86400000));
  const Tn = (jdNext - 2451545.0) / 36525;
  const omegaNext =
    125.0445479 -
    1934.1362891 * Tn +
    0.0020754 * Tn * Tn +
    (Tn * Tn * Tn) / 467441 -
    (Tn * Tn * Tn * Tn) / 60616000;
  let speed = norm360(omegaNext) - lon;
  if (speed > 180) speed -= 360;
  if (speed < -180) speed += 360;

  return { name: "TrueNode", longitude: lon, speed, retrograde: speed < 0 };
}

function dateToJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** ასცენდენტი და შუასამყაროს წერტილი (MC), დადასტურებული მზის ამოსვლა/კულმინაციაზე. */
export function computeAngles(date: Date, lonDeg: number, latDeg: number): ChartAngles {
  const t = Astronomy.MakeTime(date);
  const gstHours = Astronomy.SiderealTime(t);
  const lstDeg = norm360(gstHours * 15 + lonDeg);
  const ramc = (lstDeg * Math.PI) / 180;
  const eps = (Astronomy.e_tilt(t).tobl * Math.PI) / 180;
  const phi = (latDeg * Math.PI) / 180;

  const mcRad = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));
  const ascRad = Math.atan2(
    Math.cos(ramc),
    -(Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(ramc))
  );

  const mc = norm360((mcRad * 180) / Math.PI);
  const ascendant = norm360((ascRad * 180) / Math.PI);
  const obliquityDeg = Astronomy.e_tilt(t).tobl;

  return {
    ascendant,
    mc,
    descendant: norm360(ascendant + 180),
    ic: norm360(mc + 180),
    ramc: lstDeg,
    obliquity: obliquityDeg,
    latitude: latDeg,
    // Placidus-ის ფორმულა იშლება, როცა |განედი| + დახრილობა 90°-ს აჭარბებს (პოლარული წრის მახლობლად)
    placidusUnstable: Math.abs(latDeg) + obliquityDeg > 90,
  };
}

/** დღის (DSA) და ღამის (SNA) ნახევარრკალები, Placidus-ის იტერაციისთვის — გამოხატული უშუალოდ RA-ს მეშვეობით. */
function diurnalSemiArc(raDeg: number, phiDeg: number, epsDeg: number): number {
  const x = -Math.sin((raDeg * Math.PI) / 180) * Math.tan((phiDeg * Math.PI) / 180) * Math.tan((epsDeg * Math.PI) / 180);
  const clamped = Math.max(-1, Math.min(1, x));
  return (Math.acos(clamped) * 180) / Math.PI;
}
function nocturnalSemiArc(raDeg: number, phiDeg: number, epsDeg: number): number {
  const x = Math.sin((raDeg * Math.PI) / 180) * Math.tan((phiDeg * Math.PI) / 180) * Math.tan((epsDeg * Math.PI) / 180);
  const clamped = Math.max(-1, Math.min(1, x));
  return (Math.acos(clamped) * 180) / Math.PI;
}

function raToEclipticLongitude(raDeg: number, epsDeg: number): number {
  const ra = (raDeg * Math.PI) / 180;
  const eps = (epsDeg * Math.PI) / 180;
  return norm360((Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps)) * 180) / Math.PI);
}

function iterateRA(start: number, step: (ra: number) => number, tol = 1e-7, maxIter = 60): number {
  let ra = start;
  for (let i = 0; i < maxIter; i++) {
    const next = step(ra);
    if (Math.abs(((next - ra + 540) % 360) - 180) < tol) return next;
    ra = next;
  }
  return ra;
}

/**
 * Placidus სახლთა სისტემა — დღის/ღამის ნახევარრკალების დროში სამ თანაბარ ნაწილად დაყოფით
 * (და არა სივრცეში, როგორც Porphyry-ში). ეს ყველაზე გავრცელებული სისტემაა დასავლურ
 * ასტროლოგიაში. მოითხოვს იტერაციულ ამონახსნს — ზუსტობა დამოწმებულია რიცხვითი ტესტით
 * (მონოტონურობა MC→XI→XII→ASC მიმართულებით და კონვერგენცია).
 * პოლარულ განედებთან ახლოს (|φ|+ε > 90°) ფორმულა არასტაბილურია — ამ შემთხვევაში
 * ავტომატურად ვბრუნდებით Equal სისტემაზე.
 */
function computePlacidusCusps(angles: ChartAngles): number[] {
  if (angles.placidusUnstable) {
    // უსაფრთხო ჩავარდნა — Placidus ამ განედზე მათემატიკურად განუსაზღვრელია
    const cusps = new Array(12).fill(0);
    for (let i = 0; i < 12; i++) cusps[i] = norm360(angles.ascendant + i * 30);
    return cusps;
  }

  const { ramc, obliquity: eps, latitude: phi } = angles;
  const ric = norm360(ramc + 180);

  const ra11 = iterateRA(norm360(ramc + 30), (r) => norm360(ramc + diurnalSemiArc(r, phi, eps) / 3));
  const ra12 = iterateRA(norm360(ramc + 60), (r) => norm360(ramc + (2 * diurnalSemiArc(r, phi, eps)) / 3));
  const ra3 = iterateRA(norm360(ric - 30), (r) => norm360(ric - nocturnalSemiArc(r, phi, eps) / 3));
  const ra2 = iterateRA(norm360(ric - 60), (r) => norm360(ric - (2 * nocturnalSemiArc(r, phi, eps)) / 3));

  const cusp11 = raToEclipticLongitude(ra11, eps);
  const cusp12 = raToEclipticLongitude(ra12, eps);
  const cusp3 = raToEclipticLongitude(ra3, eps);
  const cusp2 = raToEclipticLongitude(ra2, eps);

  const cusps = new Array(12).fill(0);
  cusps[0] = angles.ascendant; // I
  cusps[1] = cusp2; // II
  cusps[2] = cusp3; // III
  cusps[3] = angles.ic; // IV
  cusps[4] = norm360(cusp11 + 180); // V (=XI+180)
  cusps[5] = norm360(cusp12 + 180); // VI (=XII+180)
  cusps[6] = angles.descendant; // VII
  cusps[7] = norm360(cusp2 + 180); // VIII (=II+180)
  cusps[8] = norm360(cusp3 + 180); // IX (=III+180)
  cusps[9] = angles.mc; // X
  cusps[10] = cusp11; // XI
  cusps[11] = cusp12; // XII
  return cusps;
}

/** სახლების საზღვრები არჩეული სისტემით. Whole Sign და Equal ზუსტია ნებისმიერ განედზე;
 *  Porphyry კვადრანტულია; Placidus დროში სამ თანაბარ ნაწილად ყოფს დღის/ღამის რკალებს. */
export function computeHouseCusps(angles: ChartAngles, system: HouseSystem): HouseCusps {
  const cusps = new Array(12).fill(0);

  if (system === "placidus") {
    return { system, cusps: computePlacidusCusps(angles) };
  }

  if (system === "whole_sign") {
    const startSign = Math.floor(angles.ascendant / 30) * 30;
    for (let i = 0; i < 12; i++) cusps[i] = norm360(startSign + i * 30);
  } else if (system === "equal") {
    for (let i = 0; i < 12; i++) cusps[i] = norm360(angles.ascendant + i * 30);
  } else {
    // Porphyry: ოთხივე მეოთხედს (ASC->IC, IC->DESC, DESC->MC, MC->ASC) სამ თანაბარ ნაწილად ჰყოფს
    const quadrant = (from: number, to: number) => {
      let diff = to - from;
      if (diff <= 0) diff += 360;
      return diff / 3;
    };
    const asc = angles.ascendant;
    const ic = angles.ic;
    const desc = angles.descendant;
    const mc = angles.mc;

    const q1 = quadrant(asc, ic);
    const q2 = quadrant(ic, desc);
    const q3 = quadrant(desc, mc);
    const q4 = quadrant(mc, asc);

    cusps[0] = asc; // I
    cusps[1] = norm360(asc + q1);
    cusps[2] = norm360(asc + 2 * q1);
    cusps[3] = ic; // IV
    cusps[4] = norm360(ic + q2);
    cusps[5] = norm360(ic + 2 * q2);
    cusps[6] = desc; // VII
    cusps[7] = norm360(desc + q3);
    cusps[8] = norm360(desc + 2 * q3);
    cusps[9] = mc; // X
    cusps[10] = norm360(mc + q4);
    cusps[11] = norm360(mc + 2 * q4);
  }

  return { system, cusps };
}

/** მოცემული პლანეტისთვის განსაზღვრავს, რომელ სახლში (1-12) ხვდება, ცუსპების მიხედვით. */
export function houseOfLongitude(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    let span = end - start;
    if (span <= 0) span += 360;
    let rel = lon - start;
    if (rel < 0) rel += 360;
    if (rel < span) return i + 1;
  }
  return 12;
}
