"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp, Headphones, MessageCircle, Phone, Send, Sparkles, X, Globe, ExternalLink } from "lucide-react";
import { SocialSettingsData } from "@/lib/socialSettings";

export default function FloatingContactHub() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [socials, setSocials] = useState<SocialSettingsData | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Monitor scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch social links
  useEffect(() => {
    fetch("/api/socials")
      .then((res) => res.json())
      .then((data) => {
        if (data.socials) setSocials(data.socials);
      })
      .catch((err) => console.error("Failed to load socials:", err));
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalOpen(false);
      }
    };
    if (modalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modalOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Format whatsapp URL
  const getWhatsappHref = (raw: string) => {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanNum = raw.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanNum}`;
  };

  // Format messenger URL
  const getMessengerHref = (raw: string) => {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanUser = raw.replace(/^@/, "").replace(/^facebook\.com\//, "");
    return `https://m.me/${cleanUser}`;
  };

  // Format telegram URL
  const getTelegramHref = (raw: string) => {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanUser = raw.replace(/^@/, "").replace(/^t\.me\//, "");
    return `https://t.me/${cleanUser}`;
  };

  return (
    <>
      {/* Floating Buttons Bar (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        {/* Scroll to Top button */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="ზევით ასქროლვა"
          title="ზევით ასქროლვა"
          className={`group flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-[#090e1c]/85 text-cyan-200 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-950/60 hover:text-white hover:scale-110 hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95 cursor-pointer ${
            showScrollTop
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-6 opacity-0 pointer-events-none"
          }`}
        >
          <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        </button>

        {/* Live Operator / Contact button */}
        <button
          type="button"
          onClick={() => setModalOpen((prev) => !prev)}
          aria-label="ოპერატორთან დაკავშირება"
          title="ოპერატორთან დაკავშირება"
          className="relative group flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-400/60 bg-gradient-to-br from-[#0c1630] via-[#101e40] to-[#070b14] text-cyan-200 shadow-[0_0_30px_rgba(56,189,248,0.35)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-cyan-300 hover:shadow-[0_0_40px_rgba(56,189,248,0.6)] active:scale-95 cursor-pointer"
        >
          {/* Pulsing beacon glow */}
          <span className="absolute inset-0 -z-10 rounded-full bg-cyan-400/20 animate-ping opacity-60" />
          
          {/* Active online green dot */}
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#090e1c]" />
          </span>

          <Headphones className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
        </button>
      </div>

      {/* Floating Operator & Social Contact Popover Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-8 sm:pb-24 pointer-events-none">
          <div
            ref={modalRef}
            className="pointer-events-auto relative w-full max-w-sm rounded-3xl border border-cyan-400/40 bg-gradient-to-b from-[#101b33] via-[#0b1324] to-[#070c18] p-5 shadow-[0_0_50px_rgba(15,23,42,0.9),0_0_30px_rgba(56,189,248,0.25)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-6 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Headphones className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                    <span>AstroNum° ოპერატორი</span>
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                  </h4>
                  <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ონლაინშია · მზადაა დასახმარებლად</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="დახურვა"
                className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              აირჩიეთ თქვენთვის მოსახერხებელი საკონტაქტო არხი და მოგვწერეთ პირდაპირ:
            </p>

            {/* Channels List */}
            <div className="mt-3.5 space-y-2.5">
              {/* WhatsApp */}
              {(!socials || socials.whatsapp.enabled) && (
                <a
                  href={getWhatsappHref(socials?.whatsapp.value ?? "+995599000000")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-950/40 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 group-hover:scale-105 transition-transform">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        WhatsApp ჩატი
                      </p>
                      <p className="text-[11px] text-slate-400">მყისიერი პასუხი და კონსულტაცია</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-emerald-400/70 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                </a>
              )}

              {/* Facebook Messenger */}
              {(!socials || socials.messenger.enabled) && (
                <a
                  href={getMessengerHref(socials?.messenger.value ?? "https://m.me/astronum.ge")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-950/20 p-3 transition-all duration-200 hover:border-blue-400 hover:bg-blue-950/40 hover:shadow-[0_0_20px_rgba(96,165,250,0.2)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 group-hover:scale-105 transition-transform">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                        Facebook Messenger
                      </p>
                      <p className="text-[11px] text-slate-400">მოგვწერეთ ოფიციალურ გვერდზე</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-400/70 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all" />
                </a>
              )}

              {/* Telegram */}
              {socials?.telegram.enabled && (
                <a
                  href={getTelegramHref(socials.telegram.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-sky-500/30 bg-sky-950/20 p-3 transition-all duration-200 hover:border-sky-400 hover:bg-sky-950/40 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 group-hover:scale-105 transition-transform">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        Telegram
                      </p>
                      <p className="text-[11px] text-slate-400">პირდაპირი შეტყობინება</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-sky-400/70 group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all" />
                </a>
              )}

              {/* Direct Call */}
              {(!socials || socials.phone.enabled) && (
                <a
                  href={`tel:${socials?.phone.value ?? "+995599000000"}`}
                  className="group flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 transition-all duration-200 hover:border-amber-400 hover:bg-amber-950/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 group-hover:scale-105 transition-transform">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        სატელეფონო ზარი
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {socials?.phone.value ?? "+995 599 00 00 00"}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-amber-400/70 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                </a>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 border-t border-white/[0.06] pt-3 text-center">
              <span className="text-[10px] text-slate-400">
                AstroNum° Official Contact Hub · უსაფრთხო კომუნიკაცია
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
