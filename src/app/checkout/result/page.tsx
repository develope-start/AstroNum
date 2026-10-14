"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readApiResponse } from "@/lib/apiResponse";

type CheckoutStatus = {
  payment: {
    status: string;
    plan: string;
    duration: string;
    amountTetri: number;
    currency: string;
    periodEndsAt: string | null;
  } | null;
};

export default function CheckoutResultPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setOrderId(new URLSearchParams(window.location.search).get("order"));
  }, []);

  useEffect(() => {
    if (typeof orderId !== "string" || orderId.length === 0) return;
    const order: string = orderId;
    const encodedOrder = encodeURIComponent(order);
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const response = await fetch(`/api/billing/status?order=${encodedOrder}`, { cache: "no-store" });
        const data = await readApiResponse<CheckoutStatus & { error?: string }>(response);
        if (!response.ok) throw new Error(data.error || "გადახდის სტატუსის წაკითხვა ვერ მოხერხდა.");
        if (!active) return;
        setStatus(data);
        setError(null);
        attempts += 1;
        if (data.payment?.status === "PENDING" && attempts < 20) {
          timer = setTimeout(poll, 3000);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "გადახდის სტატუსის წაკითხვა ვერ მოხერხდა.");
      }
    }

    void poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, refresh]);

  const payment = status?.payment;
  const paid = payment?.status === "PAID";
  const failed = payment?.status === "FAILED" || payment?.status === "REFUNDED";
  const paymentStatusLabel: Record<string, string> = {
    PENDING: "მუშავდება",
    PAID: "გადახდილია",
    FAILED: "ვერ დადასტურდა",
    REFUNDED: "დაბრუნებულია",
  };

  return (
    <main className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-3xl border border-white/10 bg-[#0b1020]/90 p-6 text-center shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">AstroNum · გადახდა</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-white sm:text-3xl">
          {!orderId ? "შეკვეთის იდენტიფიკატორი ვერ მოიძებნა" : paid ? "გადახდა დადასტურებულია" : failed ? "გადახდა ვერ დადასტურდა" : "გადახდის სტატუსი მოწმდება"}
        </h1>

        {payment && (
          <div className="mx-auto mt-5 max-w-md space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            <p>პაკეტი: <strong className="text-white">{payment.plan === "enterprise" ? "Enterprise" : "Pro"}</strong></p>
            <p>თანხა: <strong className="text-white">{(payment.amountTetri / 100).toFixed(2)} {payment.currency}</strong></p>
            {payment.periodEndsAt && <p>მოქმედებს: <strong className="text-white">{new Date(payment.periodEndsAt).toLocaleDateString("ka-GE")}-მდე</strong></p>}
            <p className="pt-1 text-xs text-slate-400">შეკვეთის სტატუსი: {paymentStatusLabel[payment.status] ?? "უცნობია"}</p>
          </div>
        )}

        <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-slate-300">
          {paid
            ? "წვდომა გააქტიურდა ბანკის მიერ დადასტურებული გადახდის შემდეგ."
            : failed
              ? "წვდომა არ გააქტიურებულა. თუ თანხა ჩამოგეჭრათ, შეინახეთ შეკვეთის ნომერი და დაუკავშირდით მხარდაჭერას."
              : orderId
                ? "ბანკიდან დაბრუნება გადახდის დასტური არ არის. წვდომა ჩაირთვება მხოლოდ ხელმოწერილი callback-ისა და გადახდის დეტალების შემოწმების შემდეგ."
                : "გადახდის სტატუსისთვის საჭიროა შეკვეთის ბმულიდან დაბრუნება."}
        </p>
        {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
        {orderId && !paid && !failed && (
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
            className="mt-5 rounded-full border border-cyan-400/30 px-5 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10"
          >
            სტატუსის ხელახლა შემოწმება
          </button>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/cabinet/dashboard" className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950">
            პირადი კაბინეტი
          </Link>
          <Link href="/#pricing" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white">
            ტარიფებზე დაბრუნება
          </Link>
        </div>
      </section>
    </main>
  );
}
