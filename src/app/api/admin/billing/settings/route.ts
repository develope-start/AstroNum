import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { BILLING_FEATURES, getBillingControls, isProviderEnabled, type PaymentProvider } from "@/lib/billing/settings";
import { prisma } from "@/lib/db";

const schema = z.object({ providers: z.record(z.boolean()).optional(), features: z.record(z.boolean()).optional() }).strict();
async function adminOnly(req: NextRequest) {
  const session = await getActiveSessionFromRequest(req);
  return session?.role === "ADMIN" ? null : NextResponse.json({ error: "წვდომა აკრძალულია." }, { status: 403 });
}
export async function GET(req: NextRequest) {
  const denied = await adminOnly(req);
  if (denied) return denied;
  try { return NextResponse.json(await getBillingControls(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    console.error("Billing settings read failed:", error);
    return NextResponse.json({ error: "გადახდის მართვის მონაცემები ვერ ჩაიტვირთა. შეამოწმეთ ბაზის მიგრაცია." }, { status: 503 });
  }
}
export async function PATCH(req: NextRequest) {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "პარამეტრების ფორმატი არასწორია." }, { status: 400 });
  const writes: Array<{ key: string; value: string }> = [];
  for (const [id, enabled] of Object.entries(parsed.data.providers ?? {})) {
    if (id !== "BOG" && id !== "TBC") return NextResponse.json({ error: "უცნობი გადახდის პროვაიდერი." }, { status: 400 });
    if (enabled && !(await isProviderEnabled(id as PaymentProvider))) {
      const state = (await getBillingControls()).providers.find((provider) => provider.id === id);
      if (!state?.configured) return NextResponse.json({ error: `${state?.label ?? id}-ის credentials ჯერ სერვერზე არ არის კონფიგურირებული.` }, { status: 409 });
    }
    writes.push({ key: `billing.provider.${id}.enabled`, value: String(enabled) });
  }
  for (const [id, enabled] of Object.entries(parsed.data.features ?? {})) {
    if (!BILLING_FEATURES.includes(id as (typeof BILLING_FEATURES)[number])) return NextResponse.json({ error: "უცნობი სერვისი." }, { status: 400 });
    writes.push({ key: `billing.feature.${id}.enabled`, value: String(enabled) });
  }
  if (!writes.length) return NextResponse.json({ error: "ცვლილებები არ არის მითითებული." }, { status: 400 });
  try {
    await prisma.$transaction(writes.map(({ key, value }) => prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } })));
    return NextResponse.json(await getBillingControls());
  } catch (error) {
    console.error("Billing settings update failed:", error);
    return NextResponse.json({ error: "პარამეტრები ვერ შეინახა. შეამოწმეთ ბაზის მიგრაცია." }, { status: 503 });
  }
}