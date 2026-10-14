import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  getBogCallbackPublicKey,
  getBogOrderDetails,
  verifyBogCallback,
} from "@/lib/billing/bog";
import {
  isBillablePlan,
  isBillingDuration,
  periodEnd,
  PLAN_RANK,
} from "@/lib/billing/plans";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type BogCallback = {
  event?: unknown;
  body?: {
    order_id?: unknown;
    external_order_id?: unknown;
  };
};

async function readLimitedBody(req: NextRequest): Promise<Buffer | null> {
  const reader = req.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) return Buffer.concat(chunks, totalBytes);
    totalBytes += value.byteLength;
    if (totalBytes > 65_536) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
}

function callbackError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("Callback-Signature") ?? "";
  const rawBody = await readLimitedBody(req);
  if (!rawBody || rawBody.length === 0) {
    return callbackError(413, "Invalid callback body");
  }

  let publicKey: string;
  try {
    publicKey = getBogCallbackPublicKey();
  } catch (error) {
    console.error("BOG callback public key is not configured:", error);
    return callbackError(503, "Payment callback is not configured");
  }
  if (!verifyBogCallback(rawBody, signature, publicKey)) {
    return callbackError(401, "Invalid callback signature");
  }

  let callback: BogCallback;
  try {
    callback = JSON.parse(rawBody.toString("utf8")) as BogCallback;
  } catch {
    return callbackError(400, "Invalid callback JSON");
  }
  const externalOrderId = callback.body?.external_order_id;
  const callbackOrderId = callback.body?.order_id;
  if (
    callback.event !== "order_payment" ||
    typeof externalOrderId !== "string" ||
    typeof callbackOrderId !== "string"
  ) {
    return callbackError(400, "Callback is missing its order identifiers");
  }

  try {
    const payment = await prisma.payment.findUnique({ where: { externalOrderId } });
    if (!payment || !payment.providerOrderId || payment.providerOrderId !== callbackOrderId) {
      return callbackError(404, "Payment order not found");
    }
    if (!isBillablePlan(payment.plan) || !isBillingDuration(payment.duration)) {
      console.error("BOG payment row contains an unsupported plan or duration:", payment.id);
      return callbackError(409, "Payment order configuration is invalid");
    }
    const plan = payment.plan;
    const duration = payment.duration;

    const receipt = await getBogOrderDetails(payment.providerOrderId);
    const amountTetri = Math.round(receipt.amount * 100);
    if (
      receipt.orderId !== payment.providerOrderId ||
      receipt.externalOrderId !== payment.externalOrderId ||
      receipt.currency.toUpperCase() !== payment.currency ||
      amountTetri !== payment.amountTetri
    ) {
      console.error("BOG receipt did not match its locally-created payment order:", payment.id);
      return callbackError(409, "Payment details did not match the order");
    }

    const status = receipt.status.toLowerCase();
    if (status === "completed") {
      await prisma.$transaction(
        async (tx) => {
          const current = await tx.payment.findUnique({ where: { id: payment.id } });
          if (!current || current.status === "PAID" || current.status === "REFUNDED") return;

          const now = new Date();
          const activePlans = await tx.payment.findMany({
            where: {
              userId: current.userId,
              status: "PAID",
              periodEndsAt: { gt: now },
            },
            select: { plan: true, periodEndsAt: true },
          });
          const queuedUntil = activePlans.reduce<Date | null>((latest, active) => {
            if (
              !isBillablePlan(active.plan) ||
              PLAN_RANK[active.plan] < PLAN_RANK[plan] ||
              !active.periodEndsAt ||
              active.periodEndsAt <= now
            ) return latest;
            return !latest || active.periodEndsAt > latest ? active.periodEndsAt : latest;
          }, null);
          const periodStartsAt = queuedUntil ?? now;

          await tx.payment.update({
            where: { id: current.id },
            data: {
              status: "PAID",
              paidAt: now,
              callbackReceivedAt: now,
              periodStartsAt,
              periodEndsAt: periodEnd(periodStartsAt, duration),
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return NextResponse.json({ received: true });
    }

    if (status === "refunded" || status === "refunded_partially" || status === "refund") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED", callbackReceivedAt: new Date() },
      });
      return NextResponse.json({ received: true });
    }

    if (status === "rejected" || status === "cancelled" || status === "canceled") {
      await prisma.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "FAILED", callbackReceivedAt: new Date() },
      });
      return NextResponse.json({ received: true });
    }

    console.error("BOG callback reported an unsupported payment status:", status);
    return callbackError(503, "Payment status is not yet processable");
  } catch (error) {
    console.error("BOG callback processing failed:", error);
    return callbackError(503, "Payment callback processing failed");
  }
}
