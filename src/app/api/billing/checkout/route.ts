import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { assertBogBillingConfigured, createBogOrder } from "@/lib/billing/bog";
import { assertTbcBillingConfigured, createTbcOrder } from "@/lib/billing/tbc";
import { isProviderEnabled, type PaymentProvider } from "@/lib/billing/settings";
import { PLAN_PRICES_TETRI } from "@/lib/billing/plans";
import { prisma } from "@/lib/db";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const requestSchema = z.object({
  plan: z.enum(["pro", "enterprise"]),
  duration: z.enum(["month", "half_year", "year"]),
  provider: z.enum(["BOG", "TBC"]).default("BOG"),
});

export async function POST(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "billing:checkout"), 3, 5 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "გადახდის მოთხოვნების ლიმიტი ამოიწურა. სცადეთ მოგვიანებით." },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } },
    );
  }

  const origin = req.headers.get("origin");
  let sameOrigin = false;
  if (origin) {
    try { sameOrigin = new URL(origin).origin === req.nextUrl.origin; }
    catch { sameOrigin = false; }
  }
  if (!sameOrigin) return NextResponse.json({ error: "გადახდის მოთხოვნა ამ საიტიდან უნდა გამოიგზავნოს." }, { status: 403 });

  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "გადახდის დასაწყებად შედით ან დარეგისტრირდით." }, { status: 401 });

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "მონაცემები არასწორია" }, { status: 400 });
  const { plan, duration, provider } = parsed.data;

  if (!(await isProviderEnabled(provider))) {
    return NextResponse.json({ error: "არჩეული ბანკით გადახდა ამჟამად მიუწვდომელია." }, { status: 503 });
  }
  try {
    if (provider === "BOG") assertBogBillingConfigured();
    else assertTbcBillingConfigured();
  } catch (error) {
    console.error(`${provider} checkout configuration is incomplete:`, error);
    return NextResponse.json({ error: "არჩეული ბანკის გადახდა ჯერ სრულად არ არის კონფიგურირებული." }, { status: 503 });
  }

  const externalOrderId = randomUUID();
  const amountTetri = PLAN_PRICES_TETRI[plan][duration];
  const payment = await prisma.payment.create({
    data: { userId: session.userId, externalOrderId, provider, plan, duration, amountTetri, currency: "GEL", status: "PENDING" },
    select: { id: true },
  });

  try {
    const order = provider === "BOG"
      ? await createBogOrder({ externalOrderId, plan, duration })
      : await createTbcOrder({ externalOrderId, plan, duration, userIpAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0" });
    await prisma.payment.update({ where: { id: payment.id }, data: { providerOrderId: order.orderId } });
    return NextResponse.json({ checkoutUrl: order.checkoutUrl, orderId: externalOrderId, provider });
  } catch (error) {
    console.error(`${provider} checkout order creation failed:`, error);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: `${provider === "BOG" ? "საქართველოს ბანკთან" : "თიბისი ბანკთან"} გადახდის შეკვეთის შექმნა ვერ მოხერხდა. თანხა არ ჩამოგეჭრათ.` }, { status: 502 });
  }
}