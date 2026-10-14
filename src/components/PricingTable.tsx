"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CreditCard, Sparkles, X, Zap } from "lucide-react";
import Link from "next/link";
import { readApiResponse } from "@/lib/apiResponse";
import { formatPrice, type BillingDuration } from "@/lib/billing/plans";

type Duration = BillingDuration;

interface PlanConfig {
  id: "free" | "pro" | "enterprise";
  name: string;
  badge?: string;
  description: string;
  prices: Record<Duration, string>;
  features: string[];
  excludedFeatures?: string[];
  buttonText: string;
  highlighted?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "უფასო (Free)",
    description: "საბაზისო გამოთვლები და პირადი ნატალური რუკის კვლევა",
    prices: { month: "0 ₾", half_year: "0 ₾", year: "0 ₾" },
    buttonText: "უფასო წვდომა",
    features: [
      "Swiss Ephemeris v2.1 ციური კოორდინატები",
      "სტუმრის მოკლე ნატალური მიმოხილვა; ანგარიშით — სრული რუკა",
      "10 ძირითადი პლანეტა, ასცენდენტი (ASC) და MC",
      "მაჟორული ასპექტები და ორბების ბაზა",
      "4 სტიქიის ტემპერამენტის საბაზისო მიმოხილვა",
      "სახლების 4 სისტემა (Placidus, Koch, Whole Sign, Equal)",
      "ტოპოცენტრული და გეოცენტრული რეჟიმები",
    ],
    excludedFeatures: [
      "Gemini AI სიღრმისეული ინტერპრეტაციები",
      "სინასტრიული ასპექტების სრული მატრიცა",
      "დროის ტრანზიტები და ციკლები",
      "გაფართოებული მეთოდები (Progressions, Solar Arc, Returns)",
      "დაბადების დროის რექტიფიკაცია",
    ],
  },
  {
    id: "pro",
    name: "პროფესიონალი (Pro)",
    badge: "ყველაზე პოპულარული",
    description: "პრაქტიკოსი ასტროლოგებისთვის, სინასტრიისა და ტრანზიტული ანალიზისთვის",
    prices: {
      month: formatPrice("pro", "month"),
      half_year: formatPrice("pro", "half_year"),
      year: formatPrice("pro", "year"),
    },
    buttonText: "Pro პაკეტის არჩევა",
    highlighted: true,
    features: [
      "ყველაფერი Free პაკეტიდან +",
      "სინასტრია (პარტნიორული რუკა და თავსებადობის ქულები)",
      "დროის ტრანზიტები ნატალურ რუკასთან მიმართებით",
      "Gemini AI ინტერპრეტაციები (სერვერზე API გასაღების არსებობისას; მოთხოვნებზე მოქმედებს ლიმიტი)",
      "მეორადი პროგრესიები (Secondary Progressions)",
      "სოლარული არკის დირექციები და პლანეტარული დაბრუნებები",
      "რუკების შენახვა კაბინეტში და პირადი არქივი",
    ],
  },
  {
    id: "enterprise",
    name: "ექსპერტი და სტუდია",
    description: "მაქსიმალური შესაძლებლობები, რექტიფიკაცია და გაფართოებული მეთოდები",
    prices: {
      month: formatPrice("enterprise", "month"),
      half_year: formatPrice("enterprise", "half_year"),
      year: formatPrice("enterprise", "year"),
    },
    buttonText: "Enterprise არჩევა",
    features: [
      "ყველაფერი Pro პაკეტიდან +",
      "დაბადების დროის რექტიფიკაციის მოდული (Rectification)",
      "დაბნელებების (Eclipses) და ჰარმონიკების / შუაწერტილების მოდული",
      "გაფართოებული ტრანზიტის სკანირება (მაქსიმუმ 10 წელი)",
    ],
  },
];

export default function PricingTable() {
  const [duration, setDuration] = useState<Duration>("month");
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig["id"] | null>(null);
  const [checkoutModalPlan, setCheckoutModalPlan] = useState<PlanConfig | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const checkoutTriggerRef = useRef<HTMLButtonElement | null>(null);
  const checkoutDialogRef = useRef<HTMLDivElement | null>(null);
  const checkoutCloseRef = useRef<HTMLButtonElement | null>(null);

  const durationLabel = duration === "month" ? "თვე" : duration === "half_year" ? "6 თვე" : "წელი";

  const handleOpenCheckout = (plan: PlanConfig, trigger: HTMLButtonElement) => {
    if (plan.id === "free") {
      const el = document.getElementById("calculator");
      el?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setCheckoutError(null);
    checkoutTriggerRef.current = trigger;
    setCheckoutModalPlan(plan);
  };

  async function beginCheckout() {
    if (!checkoutModalPlan || checkoutModalPlan.id === "free" || checkoutLoading) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: checkoutModalPlan.id, duration }),
      });
      const data = await readApiResponse<{ checkoutUrl?: string; error?: string }>(response);
      if (!response.ok) {
        setCheckoutError(data.error || "გადახდის შეკვეთის შექმნა ვერ მოხერხდა.");
        return;
      }
      if (!data.checkoutUrl) throw new Error("გადახდის გვერდის მისამართი არ დაბრუნებულა.");
      const checkoutUrl = new URL(data.checkoutUrl);
      if (checkoutUrl.protocol !== "https:" || !(checkoutUrl.hostname === "bog.ge" || checkoutUrl.hostname.endsWith(".bog.ge"))) {
        throw new Error("გადახდის პროვაიდერმა უსაფრთხო მისამართი არ დააბრუნა.");
      }
      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "ქსელთან დაკავშირება ვერ მოხერხდა.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  useEffect(() => {
    if (!checkoutModalPlan) {
      checkoutTriggerRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    checkoutCloseRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCheckoutModalPlan(null);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = checkoutDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [checkoutModalPlan]);

  return (
    <section id="pricing" className="relative my-24 w-full scroll-mt-24">
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.04] blur-[150px]" />

      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-950/30 px-3.5 py-1 text-xs font-medium text-violet-300 backdrop-blur-md">
          <Zap className="h-3.5 w-3.5" />
          <span>AstroNum° სატარიფო გეგმები</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          ტარიფები & წვდომა
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
          მოქნილი პირობები პირადი გამოყენებისა და პროფესიული ასტროლოგიური პრაქტიკისთვის
        </p>

        {/* 3-Duration Toggle: 1 თვე / 6 თვე / 1 წელი */}
        <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-[#070b13]/85 p-1.5 backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={() => setDuration("month")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
              duration === "month"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1 თვე
          </button>
          <button
            type="button"
            onClick={() => setDuration("half_year")}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
              duration === "half_year"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>6 თვე</span>
            <span className="rounded-full bg-cyan-400/20 px-1.5 py-0.5 text-[9px] text-cyan-300">
              -15%
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDuration("year")}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
              duration === "year"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>1 წელი</span>
            <span className="rounded-full bg-cyan-400/20 px-1.5 py-0.5 text-[9px] text-cyan-300">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* 3-Tier Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-8 items-stretch">
        {PLANS.map((plan) => {
          const isPro = plan.id === "pro";
          return (
            <div
              key={plan.id}
              role="group"
              aria-label={`${plan.name} ტარიფი`}
              onClick={() => setSelectedPlan(plan.id)}
              className={`cosmic-spotlight relative flex cursor-pointer flex-col justify-between rounded-3xl p-7 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:translate-y-[-4px] focus-within:ring-2 focus-within:ring-cyan-300 ${
                isPro
                  ? `border-2 bg-[#12182c]/45 hover:border-cyan-400 hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.35)] md:-translate-y-2 ${
                      selectedPlan === plan.id ? "border-cyan-300 ring-1 ring-cyan-300/50" : "border-indigo-500/80"
                    }`
                  : `border bg-[#080d1a]/35 hover:border-white/20 ${
                      selectedPlan === plan.id ? "border-cyan-300/80 ring-1 ring-cyan-300/40" : "border-white/[0.08]"
                    }`
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg shadow-indigo-500/30">
                    <Sparkles className="h-3 w-3" /> {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-white">{plan.name}</h3>
                  <div className="flex items-center gap-2">
                    {isPro && (
                      <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-300 border border-indigo-500/20">
                        პოპულარული
                      </span>
                    )}
                    <button
                      type="button"
                      aria-pressed={selectedPlan === plan.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPlan(plan.id);
                      }}
                      className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-300/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      {selectedPlan === plan.id ? "არჩეულია" : "არჩევა"}
                    </button>
                  </div>
                </div>

                <p className="mt-1 text-xs text-slate-400 min-h-[34px]">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className={`font-display text-4xl font-extrabold ${isPro ? "text-stellar-gold" : "text-white"}`}>
                    {plan.prices[duration]}
                  </span>
                  <span className="text-xs text-slate-400">/ {durationLabel}</span>
                </div>

                <ul className="mt-7 space-y-3 text-xs">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-200">
                      <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {plan.excludedFeatures?.map((ex, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-500 opacity-60">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1.5 mt-1.5" />
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenCheckout(plan, event.currentTarget);
                }}
                className={`mt-8 w-full rounded-xl py-3.5 text-center text-xs font-bold transition-all cursor-pointer ${
                  isPro
                    ? "bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:scale-102 hover:shadow-indigo-500/40"
                    : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          );
        })}
      </div>

      {checkoutModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div
            ref={checkoutDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            aria-describedby="checkout-description"
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#131b2e] to-[#0a0f19] p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setCheckoutModalPlan(null)}
              ref={checkoutCloseRef}
              aria-label="ფანჯრის დახურვა"
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="py-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                <CreditCard className="h-7 w-7" />
              </div>
              <h3 id="checkout-title" className="mt-4 font-display text-xl font-bold text-white">
                {checkoutModalPlan.name} · {durationLabel}
              </h3>
              <p id="checkout-description" className="mt-3 text-xs leading-relaxed text-slate-300">
                გადასახდელი თანხა: <strong className="text-white">{checkoutModalPlan.prices[duration]}</strong>. გადახდა მუშავდება საქართველოს ბანკის დაცულ გვერდზე.
                პაკეტი გააქტიურდება მხოლოდ ბანკის მიერ გადახდის დადასტურების შემდეგ; გამოწერა ავტომატურად არ განახლდება.
              </p>
              {checkoutError && (
                <div role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-left text-xs text-rose-200">
                  <p>{checkoutError}</p>
                  {checkoutError.includes("შედით ან დარეგისტრირდით") && (
                    <Link href="/cabinet" className="mt-2 inline-block font-bold underline">შესვლა ან რეგისტრაცია</Link>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => void beginCheckout()}
                disabled={checkoutLoading}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
              >
                {checkoutLoading ? "გადახდის გვერდი მზადდება…" : "გადახდაზე გადასვლა"}
              </button>
              <button
                type="button"
                onClick={() => setCheckoutModalPlan(null)}
                className="mt-3 w-full rounded-xl bg-white/10 py-3 text-xs font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                დახურვა
              </button>
                </div>
          </div>
        </div>
      )}
    </section>
  );
}
