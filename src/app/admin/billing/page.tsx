"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Provider = { id: "BOG" | "TBC"; label: string; configured: boolean; enabled: boolean };
type Feature = { id: string; enabled: boolean };
type Controls = { providers: Provider[]; features: Feature[]; settingsAvailable?: boolean };
type ConnectionCheck = { state: "success" | "error"; message: string };
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
  const [connectionChecks, setConnectionChecks] = useState<Record<string, ConnectionCheck>>({});
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

  async function checkConnection(provider: Provider) {
    setBusy(`check-${provider.id}`);
    setConnectionChecks((current) => {
      const next = { ...current };
      delete next[provider.id];
      return next;
    });
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/billing/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `შემოწმება ვერ მოხერხდა (${response.status})`);
      const environment = data.environment ? ` (${data.environment})` : "";
      setConnectionChecks((current) => ({
        ...current,
        [provider.id]: {
          state: "success",
          message: `ბანკთან ავტორიზაცია დადასტურდა${environment}. გადახდა არ შექმნილა; Sandbox checkout ჯერ ცალკე უნდა შემოწმდეს.`,
        },
      }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "ბანკთან კავშირის შემოწმება ვერ მოხერხდა.";
      setConnectionChecks((current) => ({ ...current, [provider.id]: { state: "error", message } }));
    } finally {
      setBusy(null);
    }
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
      {controls.settingsAvailable === false && <p role="status" className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-sm leading-6 text-amber-100">გადახდების პარამეტრების ცხრილი ჯერ არ არსებობს ამ ბაზაში. ბანკების/სერვისების პარამეტრების შენახვამდე production migration-ები უნდა გაეშვას. ამ დროისთვის აქ მხოლოდ კონფიგურაციის readiness ჩანს; გადახდები გამორთულია.</p>}
      <section className="space-y-3 rounded-2xl border border-line bg-ink-2/50 p-5">
        <h2 className="text-lg font-bold text-parchment">გადახდის პროვაიდერები</h2>
        <p className="text-sm text-parchment-dim">ეს პანელი აჩვენებს ორივე ბანკს, მაგრამ credentials მხოლოდ სერვერზე უნდა დაემატოს. „კავშირის შემოწმება“ ადასტურებს მხოლოდ API ავტორიზაციას — არა Sandbox გადახდას, callback-ს ან თანხის ჩარიცხვას.</p>
        {controls.providers.map((provider) => <div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-parchment">{provider.label}</p>
            <p className="text-xs text-parchment-dim">{provider.configured ? "სერვერის credentials შევსებულია; ბანკთან ავტორიზაცია ცალკე გადაამოწმეთ." : "სერვერის credentials არ არის კონფიგურირებული."}</p>
            <details className="mt-2 text-xs text-parchment-dim">
              <summary className="cursor-pointer text-cyan-200">ინტეგრაციის რეკვიზიტები და callback</summary>
              <div className="mt-2 space-y-1 rounded-lg bg-slate-950/60 p-3">
                <p>საჭირო Vercel Environment Variables (მნიშვნელობები მხოლოდ Vercel-ში შეიყვანეთ):</p>
                <code className="block select-all text-cyan-100">{provider.id === "BOG"
                  ? "BOG_ENVIRONMENT, BOG_CLIENT_ID, BOG_CLIENT_SECRET, BOG_CALLBACK_URL, BOG_CALLBACK_PUBLIC_KEY, APP_URL"
                  : "TBC_DEVELOPER_API_KEY, TBC_CLIENT_ID, TBC_CLIENT_SECRET, TBC_API_BASE_URL (optional), APP_URL"}</code>
                <p className="pt-1">Callback URL:</p>
                <code className="block select-all break-all text-cyan-100">{provider.id === "BOG"
                  ? "/api/billing/bog/callback"
                  : "/api/billing/tbc/callback"}</code>
                <p className="pt-1">Client secret და callback public key ამ პანელში არ შეინახოთ. მათი სტატუსი არ აჩვენებს, რომ ბანკის Sandbox checkout უკვე გამოცდილია.</p>
              </div>
            </details>
            {connectionChecks[provider.id] && <p role={connectionChecks[provider.id].state === "error" ? "alert" : "status"} className={`mt-2 text-xs ${connectionChecks[provider.id].state === "error" ? "text-rose-300" : "text-emerald-300"}`}>{connectionChecks[provider.id].message}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={!provider.configured || busy !== null} onClick={() => void checkConnection(provider)} className="rounded-full border border-line px-4 py-2 text-sm font-bold text-parchment disabled:cursor-not-allowed disabled:opacity-50">
              {busy === `check-${provider.id}` ? "მოწმდება…" : "კავშირის შემოწმება"}
            </button>
            <button type="button" disabled={controls.settingsAvailable === false || !provider.configured || busy !== null} onClick={() => void update({ providers: { [provider.id]: !provider.enabled } }, provider.id)} className={`rounded-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${provider.enabled ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-700/70 text-slate-200"}`}>
            {busy === provider.id ? "ინახება…" : provider.enabled ? "ჩართულია · გამორთვა" : "გამორთულია · ჩართვა"}
            </button>
          </div>
        </div>)}
        <p className="rounded-xl bg-slate-900/70 p-3 text-xs leading-6 text-parchment-dim">ბანკის Sandbox და production callback-ები შესაბამის Merchant Dashboard-ში ცალ-ცალკე უნდა იყოს დარეგისტრირებული, მაგალითად <code className="select-all text-cyan-200">https://&lt;domain&gt;/api/billing/bog/callback</code> და <code className="select-all text-cyan-200">https://&lt;domain&gt;/api/billing/tbc/callback</code>.</p>
      </section>
      <section className="space-y-3 rounded-2xl border border-line bg-ink-2/50 p-5">
        <h2 className="text-lg font-bold text-parchment">ფასიანი სერვისები</h2>
        <p className="text-sm text-parchment-dim">გამორთული სერვისი ფასიან ანგარიშებზეც მიუწვდომელია; ადმინის ანგარიში ამ შეზღუდვას გვერდს უვლის.</p>
        <div className="grid gap-3 sm:grid-cols-2">{controls.features.map((feature) => <label key={feature.id} className="flex items-center justify-between gap-3 rounded-xl border border-line/70 p-4 text-sm text-parchment">
          <span>{FEATURE_LABELS[feature.id] ?? feature.id}</span><input type="checkbox" checked={feature.enabled} disabled={controls.settingsAvailable === false || busy !== null} onChange={(event) => void update({ features: { [feature.id]: event.target.checked } }, feature.id)} className="h-5 w-5 accent-cyan-400" />
        </label>)}</div>
      </section>
    </>}
  </main>;
}