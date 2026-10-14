import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getTbcPaymentDetails } from "@/lib/billing/tbc";
import { isBillablePlan, isBillingDuration, periodEnd, PLAN_RANK } from "@/lib/billing/plans";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";

async function readLimitedBody(req: NextRequest): Promise<Buffer | null> {
  const reader = req.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return Buffer.concat(chunks, size);
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); return null; }
    chunks.push(value);
  }
}
async function activatePayment(paymentId: string) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!current || current.status === "PAID" || current.status === "REFUNDED") return;
    if (!isBillablePlan(current.plan) || !isBillingDuration(current.duration)) throw new Error("TBC payment row has unsupported plan data");
    const plan = current.plan;
    const duration = current.duration;
    const now = new Date();
    const activePlans = await tx.payment.findMany({
      where: { userId: current.userId, status: "PAID", periodEndsAt: { gt: now } },
      select: { plan: true, periodEndsAt: true },
    });
    const queuedUntil = activePlans.reduce<Date | null>((latest, active) => {
      if (!isBillablePlan(active.plan) || PLAN_RANK[active.plan] < PLAN_RANK[plan] || !active.periodEndsAt || active.periodEndsAt <= now) return latest;
      return !latest || active.periodEndsAt > latest ? active.periodEndsAt : latest;
    }, null);
    const periodStartsAt = queuedUntil ?? now;
    await tx.payment.update({ where: { id: current.id }, data: {
      status: "PAID", paidAt: now, callbackReceivedAt: now,
      periodStartsAt, periodEndsAt: periodEnd(periodStartsAt, duration),
    } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
export async function POST(req: NextRequest) {
  const raw = await readLimitedBody(req);
  if (!raw || raw.length === 0) return NextResponse.json({ error: "Invalid callback body" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw.toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected an object");
    body = parsed as Record<string, unknown>;
  } catch { return NextResponse.json({ error: "Invalid callback JSON" }, { status: 400 }); }
  const payId = body.PaymentId ?? body.paymentId ?? body.payId;
  if (typeof payId !== "string" || !/^[A-Za-z0-9_-]{6,100}$/.test(payId)) return NextResponse.json({ error: "PaymentId is required" }, { status: 400 });
  try {
    const payment = await prisma.payment.findFirst({ where: { provider: "TBC", providerOrderId: payId } });
    if (!payment) return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
    if (!isBillablePlan(payment.plan) || !isBillingDuration(payment.duration)) return NextResponse.json({ error: "Payment configuration invalid" }, { status: 409 });
    const receipt = await getTbcPaymentDetails(payId);
    if (receipt.payId !== payment.providerOrderId || receipt.currency.toUpperCase() !== payment.currency || Math.round(receipt.amount * 100) !== payment.amountTetri) {
      console.error("TBC payment details do not match the local order", payment.id);
      return NextResponse.json({ error: "Payment details did not match the order" }, { status: 409 });
    }
    const status = receipt.status.toLowerCase();
    if (status === "succeeded") {
      if (receipt.returnedAmount > 0) {
        await prisma.payment.updateMany({ where: { id: payment.id, status: { in: ["PENDING", "PAID"] } }, data: { status: "REFUNDED", callbackReceivedAt: new Date() } });
      } else {
        await activatePayment(payment.id);
      }
      return NextResponse.json({ received: true });
    }
    if (status === "returned" || status === "partialreturned") {
      await prisma.payment.updateMany({ where: { id: payment.id, status: { in: ["PENDING", "PAID"] } }, data: { status: "REFUNDED", callbackReceivedAt: new Date() } });
      return NextResponse.json({ received: true });
    }
    if (status === "failed" || status === "expired") {
      await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED", callbackReceivedAt: new Date() } });
      return NextResponse.json({ received: true });
    }
    return NextResponse.json({ received: true, pending: true });
  } catch (error) {
    console.error("TBC payment callback processing failed:", error);
    return NextResponse.json({ error: "Payment callback processing failed" }, { status: 503 });
  }
}