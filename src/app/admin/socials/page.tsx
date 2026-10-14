"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, Send, Sparkles, Check, ArrowLeft, Globe, HelpCircle } from "lucide-react";
import { SocialSettingsData } from "@/lib/socialSettings";

export default function AdminSocialsPage() {
  const [socials, setSocials] = useState<SocialSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form drafts
  const [whatsappVal, setWhatsappVal] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const [messengerVal, setMessengerVal] = useState("");
  const [messengerEnabled, setMessengerEnabled] = useState(true);

  const [telegramVal, setTelegramVal] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  const [phoneVal, setPhoneVal] = useState("");
  const [phoneEnabled, setPhoneEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/admin/socials", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.socials) {
          setSocials(data.socials);
          setWhatsappVal(data.socials.whatsapp.value);
          setWhatsappEnabled(data.socials.whatsapp.enabled);
          setMessengerVal(data.socials.messenger.value);
          setMessengerEnabled(data.socials.messenger.enabled);
          setTelegramVal(data.socials.telegram.value);
          setTelegramEnabled(data.socials.telegram.enabled);
          setPhoneVal(data.socials.phone.value);
          setPhoneEnabled(data.socials.phone.enabled);
        } else {
          setError(data.error || "მონაცემების ჩატვირთვა ვერ მოხერხდა.");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);

    const payload: Partial<SocialSettingsData> = {
      whatsapp: { value: whatsappVal.trim(), enabled: whatsappEnabled },
      messenger: { value: messengerVal.trim(), enabled: messengerEnabled },
      telegram: { value: telegramVal.trim(), enabled: telegramEnabled },
      phone: { value: phoneVal.trim(), enabled: phoneEnabled },
    };

    try {
      const res = await fetch("/api/admin/socials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "შენახვა ვერ მოხერხდა.");

      setNotice("სოციალური ქსელებისა და კონტაქტების პარამეტრები წარმატებით შეინახა!");
      setSocials(data.socials);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "შეცდომა შენახვისას.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-page mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 pb-4">
        <div>
          <h1 className="font-display text-2xl font-black text-parchment sm:text-3xl flex items-center gap-2.5">
            <MessageCircle className="h-7 w-7 text-cyan-400" />
            <span>სოციალური ქსელები & საკონტაქტო არხები</span>
          </h1>
          <p className="mt-1 text-sm text-parchment-dim">
            მართეთ მომხმარებლისთვის საიტზე გამოჩენილი საკონტაქტო არხები (WhatsApp, Facebook Messenger, Telegram, ტელეფონი).
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-parchment hover:border-brass transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>ადმინის პანელზე დაბრუნება</span>
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm text-emerald-200 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{notice}</span>
        </p>
      )}

      {loading && <p className="text-parchment-dim">იტვირთება…</p>}

      {!loading && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Quick info alert */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs text-cyan-200 leading-relaxed flex items-start gap-3">
            <HelpCircle className="h-5 w-5 shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-semibold text-cyan-100 mb-1">როგორ მუშაობს ეს გვერდი?</p>
              <p>
                აქ მითითებული ბმულები და ნომრები ავტომატურად გამოჩნდება საიტის მარჯვენა ქვედა კუთხეში არსებულ მცურავ ოპერატორის ვიჯეტში.
                მომხმარებელი ერთი დაწკაპუნებით შეძლებს პირდაპირ თქვენს WhatsApp-ზე, Messenger-ზე ან Telegram-ზე დაკავშირებას.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* WhatsApp */}
            <div className="rounded-2xl border border-line bg-ink-2/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">WhatsApp ჩატი</h3>
                    <p className="text-xs text-slate-400">მიუთითეთ ტელეფონის ნომერი საერთაშორისო ფორმატში (მაგ. +995599123456) ან პირდაპირი wa.me ბმული</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  <span className={whatsappEnabled ? "text-emerald-300" : "text-slate-500"}>
                    {whatsappEnabled ? "ჩართულია" : "გამორთულია"}
                  </span>
                </label>
              </div>
              <input
                type="text"
                value={whatsappVal}
                onChange={(e) => setWhatsappVal(e.target.value)}
                placeholder="+995 599 00 00 00 ან https://wa.me/995599000000"
                className="w-full rounded-xl border border-line bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Facebook Messenger */}
            <div className="rounded-2xl border border-line bg-ink-2/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Facebook Messenger</h3>
                    <p className="text-xs text-slate-400">მიუთითეთ გვერდის m.me ბმული ან Facebook გვერდის სახელი (მაგ. https://m.me/astronum.ge)</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={messengerEnabled}
                    onChange={(e) => setMessengerEnabled(e.target.checked)}
                    className="h-4 w-4 accent-blue-400"
                  />
                  <span className={messengerEnabled ? "text-blue-300" : "text-slate-500"}>
                    {messengerEnabled ? "ჩართულია" : "გამორთულია"}
                  </span>
                </label>
              </div>
              <input
                type="text"
                value={messengerVal}
                onChange={(e) => setMessengerVal(e.target.value)}
                placeholder="https://m.me/astronum.ge ან facebook.com/astronum"
                className="w-full rounded-xl border border-line bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Telegram */}
            <div className="rounded-2xl border border-line bg-ink-2/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Telegram არხი / პროფილი</h3>
                    <p className="text-xs text-slate-400">მიუთითეთ ტელეგრამის მომხმარებლის სახელი ან ბმული (მაგ. astronum_ge ან https://t.me/astronum_ge)</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={(e) => setTelegramEnabled(e.target.checked)}
                    className="h-4 w-4 accent-sky-400"
                  />
                  <span className={telegramEnabled ? "text-sky-300" : "text-slate-500"}>
                    {telegramEnabled ? "ჩართულია" : "გამორთულია"}
                  </span>
                </label>
              </div>
              <input
                type="text"
                value={telegramVal}
                onChange={(e) => setTelegramVal(e.target.value)}
                placeholder="astronum_ge ან https://t.me/astronum_ge"
                className="w-full rounded-xl border border-line bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Direct Phone */}
            <div className="rounded-2xl border border-line bg-ink-2/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">ტელეფონის ნომერი (პირდაპირი ზარი)</h3>
                    <p className="text-xs text-slate-400">პირდაპირი სატელეფონო ზარისთვის განკუთვნილი ნომერი</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneEnabled}
                    onChange={(e) => setPhoneEnabled(e.target.checked)}
                    className="h-4 w-4 accent-amber-400"
                  />
                  <span className={phoneEnabled ? "text-amber-300" : "text-slate-500"}>
                    {phoneEnabled ? "ჩართულია" : "გამორთულია"}
                  </span>
                </label>
              </div>
              <input
                type="text"
                value={phoneVal}
                onChange={(e) => setPhoneVal(e.target.value)}
                placeholder="+995 599 00 00 00"
                className="w-full rounded-xl border border-line bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:scale-102 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{saving ? "ინახება…" : "პარამეტრების შენახვა"}</span>
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
