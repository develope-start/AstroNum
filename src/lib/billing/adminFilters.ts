export type PaymentFilterValues = {
  paymentStatus: "ALL" | "PAID" | "UNPAID";
  paymentProvider: "ALL" | "BOG" | "TBC";
  paymentPlan: "ALL" | "pro" | "enterprise";
  paymentAmountMin: string;
  paymentAmountMax: string;
  paymentDateFrom: string;
  paymentDateTo: string;
};

type PaymentFilterRecord = {
  status: string;
  provider: string;
  plan: string;
  amountTetri: number;
  paidAt: string | null;
};

export function matchesPaymentFilters(payments: PaymentFilterRecord[], filters: PaymentFilterValues): boolean {
  const paid = payments.filter((payment) => payment.status === "PAID");
  const hasDetailFilters = filters.paymentProvider !== "ALL" ||
    filters.paymentPlan !== "ALL" ||
    filters.paymentAmountMin !== "" ||
    filters.paymentAmountMax !== "" ||
    filters.paymentDateFrom !== "" ||
    filters.paymentDateTo !== "";
  const hasPaymentFilters = filters.paymentStatus !== "ALL" || hasDetailFilters;
  if (!hasPaymentFilters) return true;
  if (filters.paymentStatus === "UNPAID") return !hasDetailFilters && paid.length === 0;
  if (paid.length === 0) return false;

  const amountMin = filters.paymentAmountMin === "" ? null : Number(filters.paymentAmountMin);
  const amountMax = filters.paymentAmountMax === "" ? null : Number(filters.paymentAmountMax);
  return paid.some((payment) => {
    const amount = payment.amountTetri / 100;
    const paidDate = payment.paidAt?.slice(0, 10) ?? "";
    return (filters.paymentProvider === "ALL" || payment.provider === filters.paymentProvider) &&
      (filters.paymentPlan === "ALL" || payment.plan === filters.paymentPlan) &&
      (amountMin === null || amount >= amountMin) &&
      (amountMax === null || amount <= amountMax) &&
      (!filters.paymentDateFrom || (paidDate && paidDate >= filters.paymentDateFrom)) &&
      (!filters.paymentDateTo || (paidDate && paidDate <= filters.paymentDateTo));
  });
}
