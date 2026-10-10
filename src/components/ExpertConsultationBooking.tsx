"use client";

import { useState } from "react";
import { Award, Calendar, Check, Clock, Heart, Phone, ShieldCheck, Sparkles, X } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  description: string;
  badge: string;
  icon: typeof Sparkles;
}

const SERVICES: Service[] = [
  {
    id: "natal",
    name: "ნატალური რუკის სრული ანალიზი",
    duration: "60-75 წუთი",
    price: "80 ₾",
    badge: "ფუნდამენტური",
    description: "პიროვნული ბირთვი, ფსიქოლოგიური პორტრეტი, ფინანსური არხები, ფარული ტალანტები და ცხოვრებისეული რეკომენდაციები.",
    icon: Sparkles,
  },
  {
    id: "synastry",
    name: "სინასტრია & პარტნიორული თავსებადობა",
    duration: "60-75 წუთი",
    price: "110 ₾",
    badge: "ურთიერთობები",
    description: "ორი ადამიანის რუკის შედარება: სიყვარული, ქორწინება, კონფლიქტების მიზეზები და ურთიერთობის ენერგეტიკული ჰარმონიზაცია.",
    icon: Heart,
  },
  {
    id: "solar",
    name: "წლიური სოლარული პროგნოზი (Solar Return)",
    duration: "60 წუთი",
    price: "100 ₾",
    badge: "პროგნოსტიკა",
    description: "მომავალი 12 თვის მთავარი მოვლენები, ხელსაყრელი და სარისკო პერიოდები, კარიერული და პირადი ტენდენციები.",
    icon: Calendar,
  },
  {
    id: "business",
    name: "ბიზნეს-ასტროლოგია & რელოკაცია",
    duration: "90 წუთი",
    price: "150 ₾",
    badge: "სტრატეგია",
    description: "კომპანიის დაფუძნების ზუსტი დრო, პარტნიორების შეფასება, წარმატებული ქვეყნის შერჩევა საცხოვრებლად ან ბიზნესისთვის.",
    icon: Award,
  },
];

export default function ExpertConsultationBooking() {
  const [selectedService, setSelectedService] = useState<Service>(SERVICES[0]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [note, setNote] = useState("");

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("გთხოვთ მიუთითოთ სახელი და ტელეფონის ნომერი.");
      return;
    }
    setBookingSuccess(true);
  };

  const openBookingFor = (service: Service) => {
    setSelectedService(service);
    setBookingSuccess(false);
    setBookingModalOpen(true);
  };

  return (
    <section id="consultations" className="relative my-24 w-full scroll-mt-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.04] blur-[150px]" />

      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-950/30 px-3.5 py-1 text-xs font-medium text-indigo-300 backdrop-blur-md">
          <Calendar className="h-3.5 w-3.5" />
          <span>AstroNum° პროფესიონალური ასტროლოგიური კონსულტაცია</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          პერსონალური ასტროლოგიური სესია
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          გაიღრმავეთ თქვენი რუკის ანალიზი ინდივიდუალურ ონლაინ სესიაზე. დეტალური განხილვა, კითხვა-პასუხი და პრაქტიკული რეკომენდაციები.
        </p>
      </div>

      {/* 4 Services Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((srv) => {
          const isSelected = selectedService.id === srv.id;
          const Icon = srv.icon;
          return (
            <div
              key={srv.id}
              className={`flex flex-col justify-between rounded-3xl p-6 transition-all backdrop-blur-xl ${
                isSelected
                  ? "border-2 border-cyan-400 bg-gradient-to-b from-[#11192e] to-[#080d1a] shadow-xl shadow-cyan-500/15"
                  : "border border-white/[0.08] bg-[#0c101a]/70 hover:border-white/20 hover:translate-y-[-2px]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-cyan-300 border border-white/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-cyan-950/40 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-cyan-300 border border-cyan-500/20">
                    {srv.badge}
                  </span>
                </div>

                <h4 className="mt-4 font-display text-base font-bold text-white min-h-[44px]">
                  {srv.name}
                </h4>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-extrabold text-white">
                    {srv.price}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    / {srv.duration}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400 leading-relaxed min-h-[60px]">
                  {srv.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openBookingFor(srv)}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-center text-xs font-bold text-white shadow-lg shadow-cyan-500/15 hover:scale-102 transition-all cursor-pointer"
              >
                სესიის დაჯავშნა
              </button>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#131b2e] to-[#090d16] p-6 shadow-2xl sm:p-8 text-left">
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {bookingSuccess ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-white">
                  მოთხოვნა წარმატებით გაიგზავნა!
                </h3>
                <p className="mt-2 text-xs text-slate-300">
                  ჩვენი სპეციალისტი დაგიკავშირდებათ მითითებულ ნომერზე ({phone}) უახლოეს დროში ონლაინ სესიის დროის შესათანხმებლად.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  დახურვა
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    სესიის დაჯავშნა
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedService.name}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070b14] p-3 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>ღირებულება:</span>
                    <span className="text-cyan-400 font-bold text-sm">{selectedService.price}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 mt-1">
                    <span>ხანგრძლივობა:</span>
                    <span>{selectedService.duration}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    თქვენი სახელი და გვარი
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="მაგ: გიორგი ბერიძე"
                    className="w-full rounded-xl border border-white/10 bg-[#070a16] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ტელეფონის ნომერი / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+995 599 00 00 00"
                    className="w-full rounded-xl border border-white/10 bg-[#070a16] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    სასურველი თარიღი
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#070a16] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    კომენტარი ან შეკითხვა (არასავალდებულო)
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="რა საკითხის განხილვა გსურთ ძირითადად?"
                    className="w-full rounded-xl border border-white/10 bg-[#070a16] px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-cyan-500/20 hover:scale-102 transition-all cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>დაჯავშნის დადასტურება</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>კონფიდენციალურობა გარანტირებულია · Zoom / WhatsApp ონლაინ სესია</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
