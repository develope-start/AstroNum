"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Provider = { id: "BOG" | "TBC"; label: string; configured: boolean; enabled: boolean };
type Feature = { id: string; enabled: boolean };
type Controls = { providers: Provider[]; features: Feature[] };
const FEATURE_LABELS: Record<string, string> = {
  synastry: "სინასტრია",
  transit: "ტრანზიტები",
  progression: "პროგრესიები",
  solarArc: "სოლარული რკალი",
  return: "პლანეტარული დაბრუნებები",
  ai: "Gemini AI ინტერპრეტაცია",
  rectification: "დაბადების დროის რექტიფიკაცია",
  eclipses: "დაბნელებები",
  harmonics: "ჰარმონიკები და შუაწერტილები",
  longTransit: "გრძელვადიანი ტრანზიტის სკანირება",
};

export default function AdminBillingPage() {
  const [controls, setControls] = useState<Controls | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setError("");
    const response = await fetch("/api/admin/billing/settings", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `ჩატვირთვა ვერ მოხერხდა (${response.status})`);
    setControls(data);
  }, []);
  useEffect(() => { void load().catch((cause) => setError(cause instanceof Error ? cause.message : "ჩატვირთვა ვერ მოხერხდა")); }, [load]);

  async function update(body: { providers?: Record<string, boolean>; features?: Record<string, boolean> }, key: string) {
    setBusy(key); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/billing/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `შენახვა ვერ მოხერხდა (${response.status})`);
      setControls(data); setNotice("ცვლილება შენახულია.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "შენახვა ვერ მოხერხდა"); }
    finally { setBusy(null); }
  }

  return <main className="admin-page mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 pb-4">
      <div><h1 className="font-display text-2xl font-black text-parchment sm:text-3xl">გადახდები და სერვისები</h1><p className="mt-1 text-sm text-parchment-dim">პროვაიდერები და ფასიანი ფუნქციების ხელმისაწვდომობა</p></div>
      <Link href="/admin" className="rounded-xl border border-line px-4 py-2 text-sm text-parchment hover:border-brass">ადმინის პანელზე დაბრუნება</Link>
    </header>
    {error && <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-200">{notice}</p>}
    {!controls && !error && <p className="text-parchment-dim">იტვირთება…</p>}
    {controls && <>
      <section className="space-y-3 rounded-2xl border border-line bg-ink-2/50 p-5">
        <h2 className="text-lg font-bold text-parchment">გადახდის პროვაიდერები</h2>
        <p className="text-sm text-parchment-dim">ჩართვა შესაძლებელი იქნება მხოლოდ მაშინ, როცა ბანკის საიდუმლო credentials სერვერზე დაემატება. არასოდეს შეიყვანოთ ისინი ამ პანელში.</p>
        {controls.providers.map((provider) => <div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 p-4">
          <div><p className="font-semibold text-parchment">{provider.label}</p><p className="text-xs text-parchment-dim">{provider.configured ? "Credentials კონფიგურირებულია" : "Credentials არ არის კონფიგურირებული"}</p></div>
          <button type="button" disabled={!provider.configured || busy !== null} onClick={() => void update({ providers: { [provider.id]: !provider.enabled } }, provider.id)} className={`rounded-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${provider.enabled ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-700/70 text-slate-200"}`}>
            {busy === provider.id ? "ინახება…" : provider.enabled ? "ჩართულია · გამორთვა" : "გამორთულია · ჩართვა"}
          </button>
        </div>)}
        <p className="rounded-xl bg-slate-900/70 p-3 text-xs leading-6 text-parchment-dim">TBC callback მისამართი: <code className="select-all text-cyan-200">/api/billing/tbc/callback</code>. სრული URL Vercel-ის დომენით დაამატეთ TBC Merchant Dashboard-ში.</p>
      </section>
      <section className="space-y-3 rounded-2xl border border-line bg-ink-2/50 p-5">
        <h2 className="text-lg font-bold text-parchment">ფასიანი სერვისები</h2>
        <p className="text-sm text-parchment-dim">გამორთული სერვისი ფასიან ანგარიშებზეც მიუწვდომელია; ადმინის ანგარიში ამ შეზღუდვას გვერდს უვლის.</p>
        <div className="grid gap-3 sm:grid-cols-2">{controls.features.map((feature) => <label key={feature.id} className="flex items-center justify-between gap-3 rounded-xl border border-line/70 p-4 text-sm text-parchment">
          <span>{FEATURE_LABELS[feature.id] ?? feature.id}</span><input type="checkbox" checked={feature.enabled} disabled={busy !== null} onChange={(event) => void update({ features: { [feature.id]: event.target.checked } }, feature.id)} className="h-5 w-5 accent-cyan-400" />
        </label>)}</div>
      </section>
    </>}
  </main>;
}