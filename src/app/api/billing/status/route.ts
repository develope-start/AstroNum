import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { getCurrentEntitlement } from "@/lib/billing/access";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "billing:status"), 60, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "სტატუსის შემოწმების ლიმიტი ამოიწურა. სცადეთ მოგვიანებით." },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } },
    );
  }

  const session = await getActiveSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "სტატუსის სანახავად საჭიროა ანგარიშში შესვლა." }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get("order");
  if (orderId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: "შეკვეთის იდენტიფიკატორი არასწორია." }, { status: 400 });
  }

  const [entitlement, payment] = await Promise.all([
    session.role === "ADMIN"
      ? Promise.resolve({ plan: "enterprise" as const, paidUntil: null })
      : getCurrentEntitlement(session.userId),
    orderId
      ? prisma.payment.findFirst({
          where: { externalOrderId: orderId, userId: session.userId },
          select: {
            status: true,
            plan: true,
            duration: true,
            amountTetri: true,
            currency: true,
            periodEndsAt: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (orderId && !payment) return NextResponse.json({ error: "შეკვეთა ვერ მოიძებნა." }, { status: 404 });
  return NextResponse.json({
    plan: entitlement.plan,
    paidUntil: entitlement.paidUntil?.toISOString() ?? null,
    payment: payment ? {
      status: payment.status,
      plan: payment.plan,
      duration: payment.duration,
      amountTetri: payment.amountTetri,
      currency: payment.currency,
      periodEndsAt: payment.periodEndsAt?.toISOString() ?? null,
    } : null,
  }, { headers: { "Cache-Control": "no-store" } });
}
