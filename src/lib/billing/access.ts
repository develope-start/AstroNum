import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  FEATURE_MINIMUM_PLAN,
  PLAN_RANK,
  type BillingPlan,
  type PaidFeature,
} from "@/lib/billing/plans";

export async function getCurrentEntitlement(userId: string): Promise<{
  plan: BillingPlan;
  paidUntil: Date | null;
}> {
  const now = new Date();
  let payments: Array<{ plan: string; periodEndsAt: Date | null }>;
  try {
    payments = await prisma.payment.findMany({
      where: {
        userId,
        status: "PAID",
        periodStartsAt: { lte: now },
        periodEndsAt: { gt: now },
      },
      select: { plan: true, periodEndsAt: true },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || !["P2021", "P2022"].includes(error.code)) {
      throw error;
    }
    console.error("Paid entitlements are unavailable until billing migrations are applied; using free access:", error);
    return { plan: "free", paidUntil: null };
  }

  let plan: BillingPlan = "free";
  let paidUntil: Date | null = null;
  for (const payment of payments) {
    if (payment.plan !== "pro" && payment.plan !== "enterprise") continue;
    if (PLAN_RANK[payment.plan] > PLAN_RANK[plan]) {
      plan = payment.plan;
      paidUntil = payment.periodEndsAt;
    } else if (payment.plan === plan && payment.periodEndsAt && (!paidUntil || payment.periodEndsAt > paidUntil)) {
      paidUntil = payment.periodEndsAt;
    }
  }
  return { plan, paidUntil };
}

export async function requirePlanAccess(
  req: NextRequest,
  minimumPlan: Exclude<BillingPlan, "free">,
  feature?: PaidFeature,
): Promise<NextResponse | null> {
  const session = await getActiveSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "ამ სერვისის გამოსაყენებლად საჭიროა ანგარიშში შესვლა.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }
  if (session.role === "ADMIN") return null;

  if (feature) {
    const { isBillingFeatureEnabled } = await import("@/lib/billing/settings");
    if (!(await isBillingFeatureEnabled(feature))) {
      return NextResponse.json({ error: "სერვისი დროებით გამორთულია ადმინისტრატორის მიერ.", code: "FEATURE_DISABLED" }, { status: 503 });
    }
  }

  const entitlement = await getCurrentEntitlement(session.userId);
  if (PLAN_RANK[entitlement.plan] >= PLAN_RANK[minimumPlan]) return null;

  return NextResponse.json(
    {
      error: minimumPlan === "enterprise"
        ? "ეს ფუნქცია ხელმისაწვდომია Enterprise პაკეტით."
        : "ეს ფუნქცია ხელმისაწვდომია Pro ან Enterprise პაკეტით.",
      code: "PLAN_REQUIRED",
      requiredPlan: minimumPlan,
      currentPlan: entitlement.plan,
    },
    { status: 403 },
  );
}

export function requireFeatureAccess(req: NextRequest, feature: PaidFeature): Promise<NextResponse | null> {
  return requirePlanAccess(req, FEATURE_MINIMUM_PLAN[feature], feature);
}
