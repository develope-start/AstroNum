import { prisma } from "@/lib/db";
import { assertBogBillingConfigured } from "@/lib/billing/bog";
import { assertTbcBillingConfigured } from "@/lib/billing/tbc";
import type { PaidFeature } from "@/lib/billing/plans";
export type PaymentProvider = "BOG" | "TBC";
export const BILLING_FEATURES: PaidFeature[] = ["synastry", "transit", "progression", "solarArc", "return", "ai", "rectification", "eclipses", "harmonics", "longTransit"];
const PROVIDERS: Array<{ id: PaymentProvider; label: string }> = [
  { id: "BOG", label: "საქართველოს ბანკი" },
  { id: "TBC", label: "თიბისი ბანკი" },
];
const providerKey = (provider: PaymentProvider) => `billing.provider.${provider}.enabled`;
const featureKey = (feature: PaidFeature) => `billing.feature.${feature}.enabled`;
function providerConfigured(provider: PaymentProvider): boolean {
  try { if (provider === "BOG") assertBogBillingConfigured(); else assertTbcBillingConfigured(); return true; }
  catch { return false; }
}
export async function getBillingControls() {
  const keys = [...PROVIDERS.map(({ id }) => providerKey(id)), ...BILLING_FEATURES.map(featureKey)];
  const saved = await prisma.appSetting.findMany({ where: { key: { in: keys } }, select: { key: true, value: true } });
  const values = new Map(saved.map((setting) => [setting.key, setting.value]));
  return {
    providers: PROVIDERS.map(({ id, label }) => {
      const configured = providerConfigured(id);
      const defaultEnabled = id === "BOG";
      const storedValue = values.get(providerKey(id));
      return { id, label, configured, enabled: configured && (storedValue === undefined ? defaultEnabled : storedValue === "true") };
    }),
    features: BILLING_FEATURES.map((id) => ({ id, enabled: values.get(featureKey(id)) !== "false" })),
  };
}
export async function isProviderEnabled(provider: PaymentProvider): Promise<boolean> {
  return Boolean((await getBillingControls()).providers.find((entry) => entry.id === provider)?.enabled);
}
export async function isBillingFeatureEnabled(feature: PaidFeature): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({ where: { key: featureKey(feature) }, select: { value: true } });
  return setting?.value !== "false";
}