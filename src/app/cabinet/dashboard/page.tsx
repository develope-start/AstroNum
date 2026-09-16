"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterpretationText from "@/components/InterpretationText";
import ChartWheel, { WheelPlanet } from "@/components/ChartWheel";
import { Compass, Copy, Check, X, Sparkles, Trash2, Eye } from "lucide-react";
import { readApiResponse } from "@/lib/apiResponse";

interface AccountSummary {
  name: string | null;
  username: string | null;
  email: string;
  createdAt: string;
  expiresAt: string | null;
}

interface ChartSummary {
  id: string;
  type: "NATAL" | "SYNASTRY" | "TRANSIT";
  label: string;
  name1: string;
  name2: string | null;
  date1: string;
  transitDate: string | null;
  createdAt: string;
}

interface WheelResult {
  ascendant: number;
  mc: number;
  houseCusps: number[];
  planets: WheelPlanet[];
}

interface SelectedChart {
  id: string;
  label: string;
  type: string;
  interpretation: string;
  result?: WheelResult;
}

const TYPE_LABEL_KA: Record<string, string> = {
  NATAL: "ნატალური",
  SYNASTRY: "სინასტრია",
  TRANSIT: "ტრანზიტი",
};

function formatRemaining(seconds: number) {
  if (seconds <= 0) return "სესია დასრულდა";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days} დღე ${String(hours).padStart(2, "0")} სთ ${String(minutes).padStart(2, "0")} წთ ${String(secs).padStart(2, "0")} წმ`;
}

function SessionCountdown({ expiresAt, onExpired }: { expiresAt: string | null; onExpired: () => void }) {
  const calculate = () => expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0;
  const [remaining, setRemaining] = useState(calculate);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const next = calculate();
      setRemaining(next);
      if (next === 0) onExpired();
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, onExpired]);

  return <span>{expiresAt ? formatRemaining(remaining) : "—"}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [charts, setCharts] = useState<ChartSummary[] | null>(null);
  const [selected, setSelected] = useState<SelectedChart | null>(null);
  const [showWheel, setShowWheel] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingChart, setLoadingChart] = useState<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    router.replace("/cabinet");
  }, [router]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        const data = await readApiResponse<{ user?: AccountSummary }>(res);
        if (!res.ok || !data.user) {
          router.replace("/cabinet");
          return;
        }
        if (active) setAccount(data.user);
      })
      .catch(() => {
        if (active) router.replace("/cabinet");
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    fetch("/api/charts", { cache: "no-store" }).then(async (res) => {
      const data = await readApiResponse<{ charts?: ChartSummary[]; error?: string }>(res);
      if (res.status === 401) {
        router.push("/cabinet");
        return;
      }
      if (!res.ok) {
        if (active) setError(data.error || "რუკების ჩატვირთვა ვერ მოხერხდა");
        return;
      }
      if (active) setCharts(data.charts ?? []);
    }).catch(() => {
      if (active) setError("რუკების ჩატვირთვა ვერ მოხერხდა");
    });
    return () => { active = false; };
  }, [router]);

  async function openChart(id: string) {
    setLoadingChart(id);
    setError(null);
    try {
      const res = await fetch(`/api/charts/${id}`);
      const data = await readApiResponse<{
        id?: string;
        label?: string;
        type?: string;
        interpretation?: string | null;
        result?: { ascendant?: unknown; mc?: number; houseCusps?: number[]; planets?: Array<{ name: string; longitude: number }> };
        error?: string;
      }>(res);
      if (!res.ok) {
        setError(data.error || "რუკის ჩატვირთვა ვერ მოხერხდა");
        return;
      }

      // Format result payload cleanly if available
      let wheelData: WheelResult | undefined = undefined;
      if (data.result && typeof data.result.ascendant === "number") {
        wheelData = {
          ascendant: data.result.ascendant,
          mc: data.result.mc ?? 0,
          houseCusps: data.result.houseCusps ?? [],
          planets: data.result.planets ?? [],
        };
      }

      setSelected({
        id: data.id ?? id,
        label: data.label ?? "რუკა",
        type: data.type ?? "NATAL",
        interpretation: data.interpretation ?? "",
        result: wheelData,
      });
      setShowWheel(true);
      setCopied(false);
    } catch {
      setError("სერვერთან კავშირი შეწყდა");
    } finally {
      setLoadingChart(null);
    }
  }

  async function removeChart(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/charts/${id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "რუკის წაშლა ვერ შესრულდა");
      setCharts((prev) => prev?.filter((c) => c.id !== id) ?? null);
      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "რუკის წაშლა ვერ შესრულდა");
    }
  }

  function handleCopy() {
    if (!selected) return;
    navigator.clipboard.writeText(`${selected.label}\n\n${selected.interpretation}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 w-full max-w-full overflow-x-hidden px-1">
      {/* Dashboard Top Navigation & Status Bar */}
      <div className="glass-panel flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl sm:rounded-[28px] p-5 sm:p-7 border-amber-500/25 bg-gradient-to-r from-[#130a35]/90 via-[#0e0728]/95 to-[#130a35]/90 backdrop-blur-2xl shadow-xl">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            ჩემი შენახული რუკები
          </h1>
          <p className="mt-1 text-xs text-slate-300">თქვენი პირადი ასტროლოგიური არქივი და გამოთვლები</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold w-full sm:w-auto justify-end">
          <a
            href="/cabinet/settings"
            className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-amber-300 transition-all hover:bg-amber-400/20"
          >
            კაბინეტის მართვა
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-950/50 px-4 py-2 text-purple-300 transition-all hover:bg-purple-900/50 cursor-pointer"
          >
            გასვლა
          </button>
        </div>
      </div>

      {account && (
        <div className="glass-panel grid gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-4 text-xs sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-slate-400">სახელი</p>
            <p className="mt-1 font-bold text-emerald-200">{account.name || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">მეილი</p>
            <p className="mt-1 break-all font-bold text-emerald-200">{account.email}</p>
          </div>
          <div>
            <p className="text-slate-400">Username</p>
            <p className="mt-1 break-all font-bold text-emerald-200">{account.username ? `@${account.username}` : "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">კაბინეტის შექმნის დრო</p>
            <p className="mt-1 font-bold text-emerald-200">{new Date(account.createdAt).toLocaleString("ka-GE")}</p>
          </div>
          <div>
            <p className="text-slate-400">ბოლო შესვლის სესიის დარჩენილი დრო</p>
            <p className="mt-1 font-bold tabular-nums text-amber-300">
              <SessionCountdown expiresAt={account.expiresAt} onExpired={handleSessionExpired} />
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-300 text-center">
          {error}
        </p>
      )}

      {charts === null && (
        <div className="glass-panel rounded-2xl p-8 text-center text-xs font-semibold text-amber-300">
          იტვირთება შენახული რუკები…
        </div>
      )}

      {charts?.length === 0 && (
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-8 text-center space-y-3 border-amber-500/25 bg-[#120833]/90">
          <p className="text-sm text-slate-300">
            ჯერ არაფერი შენახულა. გადადით <a href="/#calculator" className="font-bold text-amber-300 underline decoration-amber-400/50">გამომთვლელზე</a>{" "}
            და დააჭირეთ „შენახვა კაბინეტში".
          </p>
        </div>
      )}

      {/* Grid of Saved Charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        {charts?.map((c) => (
          <div
            key={c.id}
            className="glass-panel group rounded-2xl p-5 border-amber-500/25 bg-gradient-to-b from-[#130a35]/85 to-[#080417]/95 transition-all hover:border-amber-400/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-300">
                  {TYPE_LABEL_KA[c.type]}
                </span>
                <span className="text-[0.68rem] font-medium text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString("ka-GE")}
                </span>
              </div>
              <h3 className="font-display mt-2.5 text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                {c.label}
              </h3>
              <p className="mt-1 text-xs text-slate-300">
                {c.name1}
                {c.name2 ? ` & ${c.name2}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-amber-500/15 text-xs font-bold">
              <button
                onClick={() => openChart(c.id)}
                disabled={loadingChart === c.id}
                className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-4 py-1.5 text-amber-300 transition-all hover:bg-amber-400 hover:text-slate-950 cursor-pointer disabled:opacity-50"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{loadingChart === c.id ? "იტვირთება..." : "ნახვა"}</span>
              </button>
              <button
                onClick={() => removeChart(c.id)}
                className="flex items-center gap-1.5 rounded-full bg-rose-950/40 border border-rose-500/30 px-4 py-1.5 text-rose-300 transition-all hover:bg-rose-900/60 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>წაშლა</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Opened Chart View Modal / Card */}
      {selected && (
        <div id="chart-view" className="glass-panel mt-8 rounded-2xl sm:rounded-[28px] p-5 sm:p-8 border-amber-500/30 bg-[#120833]/95 backdrop-blur-2xl shadow-2xl space-y-5 transition-all">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              {selected.label}
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 rounded-full border border-amber-400/30 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>დახურვა</span>
            </button>
          </div>

          {/* Action Toolbar: Light Moss Green Glow Button (ღია ჭაობისფერი გლოუ) & Copy Button */}
          <div className="flex flex-wrap items-center gap-3 bg-purple-950/40 p-3 rounded-2xl border border-amber-500/20">
            {/* Light Moss Green Glow Zodiac Wheel Toggle Button */}
            <button
              type="button"
              onClick={() => setShowWheel(!showWheel)}
              className="group flex items-center gap-2 rounded-full border border-emerald-400/60 bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-emerald-950/80 px-4 py-2 text-xs sm:text-sm font-bold text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-105 hover:border-emerald-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] cursor-pointer"
            >
              <Compass className="h-4 w-4 text-emerald-400 shrink-0 group-hover:rotate-90 transition-transform duration-500" />
              <span className="tracking-wide">✦ ზოდიაქალური წრის ჩვენება</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-black text-emerald-200 uppercase border border-emerald-400/30">
                {showWheel ? "აქტიური" : "გახსნა"}
              </span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-purple-950/60 px-4 py-2 text-xs sm:text-sm font-bold text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "კოპირებულია!" : "ტექსტის კოპირება"}</span>
            </button>
          </div>

          {/* Large Zodiac Chart Wheel Display (Visible right before interpretations when toggled) */}
          {showWheel && selected.result && (
            <div className="glass-panel relative overflow-hidden rounded-2xl sm:rounded-[28px] p-4 sm:p-8 border-amber-500/30 bg-[#0d0626]/95 backdrop-blur-3xl shadow-2xl text-center w-full max-w-2xl sm:max-w-3xl mx-auto my-4 transition-all">
              <div className="mb-3 text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/50 px-3 py-1 text-xs font-bold text-emerald-300 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span>გამოთვლილი ასტროლოგიური ცის რუკა</span>
                </div>
                <h3 className="font-display text-lg sm:text-2xl font-black text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  {selected.label}
                </h3>
              </div>
              <ChartWheel
                ascendant={selected.result.ascendant}
                mc={selected.result.mc}
                cusps={selected.result.houseCusps}
                planets={selected.result.planets}
                size={500}
              />
            </div>
          )}

          {/* Full Interpretation Text Section */}
          <div className="pt-2">
            <h3 className="font-display text-lg sm:text-xl font-bold text-amber-300 mb-3 border-b border-amber-500/20 pb-2">
              ასტროლოგიური ინტერპრეტაცია & ანალიზი
            </h3>
            <InterpretationText text={selected.interpretation} />
          </div>
        </div>
      )}
    </div>
  );
}
