export type BillingPlan = "free" | "pro" | "enterprise";
export type BillablePlan = Exclude<BillingPlan, "free">;
export type BillingDuration = "month" | "half_year" | "year";
export type PaidFeature =
  | "synastry"
  | "transit"
  | "progression"
  | "solarArc"
  | "return"
  | "ai"
  | "rectification"
  | "eclipses"
  | "harmonics"
  | "longTransit";

export const BILLING_DURATIONS: Record<BillingDuration, { label: string; months: number }> = {
  month: { label: "1 თვე", months: 1 },
  half_year: { label: "6 თვე", months: 6 },
  year: { label: "1 წელი", months: 12 },
};

export const PLAN_PRICES_TETRI: Record<BillablePlan, Record<BillingDuration, number>> = {
  pro: { month: 499, half_year: 2545, year: 4790 },
  enterprise: { month: 799, half_year: 4075, year: 7670 },
};

export const FEATURE_MINIMUM_PLAN: Record<PaidFeature, Exclude<BillingPlan, "free">> = {
  synastry: "pro",
  transit: "pro",
  progression: "pro",
  solarArc: "pro",
  return: "pro",
  ai: "pro",
  rectification: "enterprise",
  eclipses: "enterprise",
  harmonics: "enterprise",
  longTransit: "enterprise",
};

export const PLAN_RANK: Record<BillingPlan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export function isBillablePlan(value: unknown): value is BillablePlan {
  return value === "pro" || value === "enterprise";
}

export function isBillingDuration(value: unknown): value is BillingDuration {
  return value === "month" || value === "half_year" || value === "year";
}

export function priceInGEL(plan: BillablePlan, duration: BillingDuration): number {
  return PLAN_PRICES_TETRI[plan][duration] / 100;
}

export function formatPrice(plan: BillablePlan, duration: BillingDuration): string {
  return `${priceInGEL(plan, duration).toFixed(2)} ₾`;
}

export function periodEnd(start: Date, duration: BillingDuration): Date {
  const end = new Date(start);
  const originalDay = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + BILLING_DURATIONS[duration].months);
  const lastDayOfMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(originalDay, lastDayOfMonth));
  return end;
}
