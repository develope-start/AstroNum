"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, Send, Sparkles, Check, ArrowLeft, Globe, HelpCircle, Eye } from "lucide-react";
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="space-y-4 lg:col-span-7">
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

          {/* Live Preview Simulator */}
          <div className="lg:col-span-5 sticky top-6 space-y-4">
            <div className="rounded-2xl border border-cyan-500/30 bg-ink-2/80 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">ცოცხალი სიმულაცია (Live Preview)</span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  აქტიური
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                ასე ხედავს ვიზიტორი საკონტაქტო ცენტრს საიტის მარჯვენა ქვედა კუთხეში:
              </p>

              {/* Simulated Floating Widget Modal */}
              <div className="rounded-2xl border border-line/80 bg-slate-950/95 p-4 shadow-xl space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-line">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-md shadow-cyan-500/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">AstroNum ასისტენტი</h4>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      ონლაინ ოპერატორი
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {whatsappEnabled && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/30 text-emerald-200">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-emerald-400" />
                        <span className="font-medium">WhatsApp ჩატი</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{whatsappVal || "ნომერი არ არის"}</span>
                    </div>
                  )}

                  {messengerEnabled && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-blue-500/20 bg-blue-950/30 text-blue-200">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-400" />
                        <span className="font-medium">Messenger</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{messengerVal || "ბმული არ არის"}</span>
                    </div>
                  )}

                  {telegramEnabled && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-sky-500/20 bg-sky-950/30 text-sky-200">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-sky-400" />
                        <span className="font-medium">Telegram არხი</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{telegramVal || "სახელი არ არის"}</span>
                    </div>
                  )}

                  {phoneEnabled && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-amber-950/30 text-amber-200">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-amber-400" />
                        <span className="font-medium">პირდაპირი ზარი</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{phoneVal || "ნომერი არ არის"}</span>
                    </div>
                  )}

                  {!whatsappEnabled && !messengerEnabled && !telegramEnabled && !phoneEnabled && (
                    <div className="text-center py-4 text-slate-500 text-xs italic">
                      ყველა საკონტაქტო არხი გამორთულია.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <span>სტატუსი:</span>
                <span className="text-slate-300 font-medium">
                  {[whatsappEnabled, messengerEnabled, telegramEnabled, phoneEnabled].filter(Boolean).length} / 4 არხი აქტიურია
                </span>
              </div>
            </div>
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
