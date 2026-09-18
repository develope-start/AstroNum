import { computeAspects, type AspectHit } from "./aspects";
import { computeNatalChart, computeNatalChartAtUtc, type BirthInput, type NatalResult } from "./chart";
import { wideDateToUtcDate } from "./wideDate";
import type { HouseSystem } from "./positions";

const MEAN_TROPICAL_YEAR_DAYS = 365.242189;
const DAY_MS = 86_400_000;

export interface SecondaryProgressionResult {
  method: "secondary";
  targetDate: string;
  birthUtcIso: string;
  progressedUtcIso: string;
  ageYears: number;
  natal: NatalResult;
  progressed: NatalResult;
  aspects: AspectHit[];
}

/** One day after birth is interpreted as one year after birth. */
export function secondaryProgressedMoment(birthUtc: Date, targetUtc: Date): { progressedUtc: Date; ageYears: number } {
  const elapsedDays = (targetUtc.getTime() - birthUtc.getTime()) / DAY_MS;
  if (!Number.isFinite(elapsedDays) || elapsedDays < 0) throw new Error("პროგრესიის თარიღი დაბადების თარიღზე ადრე ვერ იქნება");
  const ageYears = elapsedDays / MEAN_TROPICAL_YEAR_DAYS;
  return {
    progressedUtc: new Date(birthUtc.getTime() + ageYears * DAY_MS),
    ageYears,
  };
}

export function computeSecondaryProgression(
  birthInput: BirthInput,
  targetDate: string,
  houseSystem: HouseSystem = "whole_sign",
): SecondaryProgressionResult {
  const targetUtc = wideDateToUtcDate(targetDate);
  if (!targetUtc) throw new Error("პროგრესიის თარიღი არასწორია");
  const natal = computeNatalChart(birthInput, houseSystem);
  const birthUtc = new Date(natal.utcIso);
  const { progressedUtc, ageYears } = secondaryProgressedMoment(birthUtc, targetUtc);
  const progressed = computeNatalChartAtUtc(
    progressedUtc,
    birthInput.lat,
    birthInput.lon,
    birthInput.calculation,
    houseSystem,
  );
  return {
    method: "secondary",
    targetDate,
    birthUtcIso: birthUtc.toISOString(),
    progressedUtcIso: progressedUtc.toISOString(),
    ageYears: Math.round(ageYears * 10000) / 10000,
    natal,
    progressed,
    aspects: computeAspects(progressed.planets, natal.planets),
  };
}
