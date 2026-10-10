"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CreditCard, Sparkles, X, Zap } from "lucide-react";

type Duration = "month" | "half_year" | "year";

interface PlanConfig {
  id: "free" | "pro" | "enterprise";
  name: string;
  badge?: string;
  description: string;
  prices: Record<Duration, string>;
  rawPrice: Record<Duration, number>;
  features: string[];
  excludedFeatures?: string[];
  buttonText: string;
  highlighted?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free (უფასო)",
    description: "საბაზისო გამოთვლები და პირადი ნატალური რუკის კვლევა",
    prices: { month: "0 ₾", half_year: "0 ₾", year: "0 ₾" },
    rawPrice: { month: 0, half_year: 0, year: 0 },
    buttonText: "უფასო წვდომა",
    features: [
      "Swiss Ephemeris v2.1 ციური კოორდინატები",
      "ნატალური რუკის ულიმიტო გამოთვლა",
      "10 ძირითადი პლანეტა, ასცენდენტი (ASC) და MC",
      "მაჟორული ასპექტები და ორბების ბაზა",
      "4 სტიქიის ტემპერამენტის საბაზისო მიმოხილვა",
      "სახლების 12 სისტემა (Placidus, Koch, Whole Sign, Equal)",
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
    name: "Pro (პროფესიონალი)",
    badge: "ყველაზე პოპულარული",
    description: "პრაქტიკოსი ასტროლოგებისთვის, სინასტრიისა და ტრანზიტული ანალიზისთვის",
    prices: { month: "4.99 ₾", half_year: "25.45 ₾", year: "47.90 ₾" },
    rawPrice: { month: 4.99, half_year: 25.45, year: 47.90 },
    buttonText: "Pro პაკეტის არჩევა",
    highlighted: true,
    features: [
      "ყველაფერი Free პაკეტიდან +",
      "სინასტრია (პარტნიორული რუკა & თავსებადობის ქულები)",
      "დროის ტრანზიტები ნატალურ რუკასთან მიმართებით",
      "4 სტიქიის ტემპერამენტის სრული ჰიპოკრატული სინთეზი",
      "Gemini AI ასტროლოგიური ინტელექტი (პიროვნული, კარიერული, სიყვარულის ანალიზი)",
      "მეორადი პროგრესიები (Secondary Progressions)",
      "Solar Arc Directions და Planetary Returns (Solar/Lunar Return)",
      "რუკების შენახვა კაბინეტში და პირადი არქივი",
      "ბეჭდვისთვის მზა PDF რეპორტების ექსპორტი",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise (ექსპერტი & სტუდია)",
    description: "მაქსიმალური შესაძლებლობები, რექტიფიკაცია და გაფართოებული მეთოდები",
    prices: { month: "7.99 ₾", half_year: "40.75 ₾", year: "76.70 ₾" },
    rawPrice: { month: 7.99, half_year: 40.75, year: 76.70 },
    buttonText: "Enterprise არჩევა",
    features: [
      "ყველაფერი Pro პაკეტიდან +",
      "დაბადების დროის რექტიფიკაციის მოდული (Rectification)",
      "შეუზღუდავი Gemini AI ინტერპრეტაციები და პირადი კითხვა-პასუხი",
      "დაჩქარებული AI დამუშავება პრიორიტეტული რიგით",
      "დაბნელებების (Eclipses) და ჰარმონიკების / მიდპოინტების მოდული",
      "დიდი პერიოდის ტრანზიტული სკანირება",
      "სიდერიული / ვედური ზოდიაქო (6 აიანამშა: Lahiri, Raman, Fagan-Bradley)",
      "შეუზღუდავი რუკების საცავი კაბინეტში",
      "API წვდომა და პრიორიტეტული 24/7 მხარდაჭერა",
    ],
  },
];

export default function PricingTable() {
  const [duration, setDuration] = useState<Duration>("month");
  const [checkoutModalPlan, setCheckoutModalPlan] = useState<PlanConfig | null>(null);
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
    checkoutTriggerRef.current = trigger;
    setCheckoutModalPlan(plan);
  };

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
              className={`relative flex flex-col justify-between rounded-3xl p-7 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:translate-y-[-4px] ${
                isPro
                  ? "border-2 border-indigo-500/80 bg-[#12182c]/45 hover:border-cyan-400 hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.35)] md:-translate-y-2"
                  : "border border-white/[0.08] bg-[#080d1a]/35 hover:border-white/20"
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
                  {isPro && (
                    <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-300 border border-indigo-500/20">
                      POPULAR
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-400 min-h-[34px]">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-extrabold text-white">
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
                onClick={(event) => handleOpenCheckout(plan, event.currentTarget)}
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

      {/* Payment is unavailable until a real payment provider is integrated. */}
      {checkoutModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div
            ref={checkoutDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-unavailable-title"
            aria-describedby="checkout-unavailable-description"
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
              <h3 id="checkout-unavailable-title" className="mt-4 font-display text-xl font-bold text-white">
                ონლაინ გადახდა ჯერ მიუწვდომელია
              </h3>
              <p id="checkout-unavailable-description" className="mt-3 text-xs leading-relaxed text-slate-300">
                არჩეულია {checkoutModalPlan.name} · {durationLabel} · {checkoutModalPlan.prices[duration]}.
                ამ ეტაპზე ბარათის მონაცემები არ მიიღება და პაკეტი არ აქტიურდება.
                გადახდის გასააქტიურებლად საჭიროა რეალური გადახდის პროვაიდერის ინტეგრაცია.
              </p>
              <button
                type="button"
                onClick={() => setCheckoutModalPlan(null)}
                className="mt-6 w-full rounded-xl bg-white/10 py-3 text-xs font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                გასაგებია
              </button>
                </div>
          </div>
        </div>
      )}
    </section>
  );
}
