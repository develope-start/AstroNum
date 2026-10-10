"use client";

import { useState } from "react";
import { Award, Calendar, Check, Clock, Heart, MessageCircle, Phone, ShieldCheck, Sparkles, Star, User, Users, X } from "lucide-react";

interface Astrologer {
  id: string;
  name: string;
  title: string;
  experience: string;
  rating: number;
  consultationsCount: number;
  specialization: string[];
  avatarLetter: string;
  avatarColor: string;
  bio: string;
}

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  description: string;
  icon: typeof Sparkles;
}

const EXPERTS: Astrologer[] = [
  {
    id: "lia",
    name: "ლია ბარათაშვილი",
    title: "აკადემიური ასტროლოგ-კონსულტანტი",
    experience: "35+ წლიანი პრაქტიკა",
    rating: 5.0,
    consultationsCount: 1420,
    specialization: ["კლასიკური ასტროლოგია", "სინასტრია", "პროგნოსტიკა", "ბიზნეს ასტროლოგია"],
    avatarLetter: "ლ",
    avatarColor: "from-violet-500 to-indigo-600",
    bio: "მათემატიკოსი და კლასიკური ასტროლოგიის მოსკოვის უმაღლესი სკოლის კურსდამთავრებული. ეკონომიკური და პოლიტიკური პროგნოზირების ექსპერტი საქართველოში.",
  },
  {
    id: "akaki",
    name: "აკაკი გოგოლაძე",
    title: "პრაქტიკოსი ასტროლოგი & მკვლევარი",
    experience: "12+ წლიანი პრაქტიკა",
    rating: 4.9,
    consultationsCount: 890,
    specialization: ["ნატალური ანალიზი", "კარმული მისია", "რექტიფიკაცია", "რელოკაცია"],
    avatarLetter: "ა",
    avatarColor: "from-cyan-500 to-blue-600",
    bio: "სიღრმისეული ფსიქოასტროლოგიისა და კარმული კვანძების სპეციალისტი. ეხმარება ადამიანებს საკუთარი ჭეშმარიტი გზისა და პარტნიორული ჰარმონიის პოვნაში.",
  },
];

const SERVICES: Service[] = [
  {
    id: "natal",
    name: "ნატალური რუკის სრული ანალიზი",
    duration: "60-75 წუთი",
    price: "120 ₾",
    description: "პიროვნული ბირთვი, ფსიქოლოგიური პორტრეტი, ფინანსური არხები, ფარული ტალანტები და ცხოვრებისეული რეკომენდაციები.",
    icon: Sparkles,
  },
  {
    id: "synastry",
    name: "სინასტრია & პარტნიორული თავსებადობა",
    duration: "60-75 წუთი",
    price: "140 ₾",
    description: "ორი ადამიანის რუკის შედარება: სიყვარული, ქორწინება, კონფლიქტების მიზეზები და ურთიერთობის ენერგეტიკული ჰარმონიზაცია.",
    icon: Heart,
  },
  {
    id: "solar",
    name: "წლიური სოლარული პროგნოზი (Solar Return)",
    duration: "60 წუთი",
    price: "130 ₾",
    description: "მომავალი 12 თვის მთავარი მოვლენები, ხელსაყრელი და სარისკო პერიოდები, კარიერული და პირადი ტენდენციები.",
    icon: Calendar,
  },
  {
    id: "business",
    name: "ბიზნეს-ასტროლოგია & რელოკაცია",
    duration: "90 წუთი",
    price: "180 ₾",
    description: "კომპანიის დაფუძნების ზუსტი დრო, პარტნიორების შეფასება, წარმატებული ქვეყნის შერჩევა საცხოვრებლად ან ბიზნესისთვის.",
    icon: Award,
  },
];

export default function ExpertConsultationBooking() {
  const [selectedExpert, setSelectedExpert] = useState<Astrologer>(EXPERTS[0]);
  const [selectedService, setSelectedService] = useState<Service>(SERVICES[0]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("გთხოვთ მიუთითოთ სახელი და ტელეფონის ნომერი.");
      return;
    }
    setBookingSuccess(true);
  };

  return (
    <section id="consultations" className="relative my-24 w-full scroll-mt-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.04] blur-[150px]" />

      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-950/30 px-3.5 py-1 text-xs font-medium text-indigo-300 backdrop-blur-md">
          <Users className="h-3.5 w-3.5" />
          <span>პირადი ასტროლოგიური კონსულტაციები</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          ინდივიდუალური სესია <br />
          <span className="bg-gradient-to-r from-indigo-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
            სერტიფიცირებულ ასტროლოგთან
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          ავტომატური გათვლების გარდა, მიიღეთ პირდაპირი 1-on-1 ცოცხალი კონსულტაცია საქართველოს წამყვან აკადემიურ სპეციალისტებთან.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Experts List */}
        <div className="space-y-4 lg:col-span-5">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            აირჩიეთ ასტროლოგი
          </span>

          {EXPERTS.map((expert) => {
            const isSelected = selectedExpert.id === expert.id;
            return (
              <div
                key={expert.id}
                onClick={() => setSelectedExpert(expert)}
                className={`relative flex flex-col rounded-3xl p-6 transition-all cursor-pointer backdrop-blur-xl ${
                  isSelected
                    ? "border-2 border-indigo-500 bg-gradient-to-b from-[#131b2e] to-[#0a0f19] shadow-2xl shadow-indigo-500/20"
                    : "border border-white/[0.08] bg-[#0c101a]/70 hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${expert.avatarColor} text-xl font-bold text-white shadow-lg`}
                  >
                    {expert.avatarLetter}
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-white">
                        {expert.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-amber-300 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                        <span>{expert.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-indigo-300 mt-0.5">{expert.title}</p>
                    <span className="text-[11px] text-slate-400 font-mono block mt-1">
                      {expert.experience} · {expert.consultationsCount}+ კონსულტაცია
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-400 line-clamp-2">
                  {expert.bio}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {expert.specialization.map((spec, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-slate-300 border border-white/5"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Consultation Services & Booking CTA */}
        <div className="space-y-4 lg:col-span-7">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            აირჩიეთ მომსახურება
          </span>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SERVICES.map((srv) => {
              const isSelected = selectedService.id === srv.id;
              const Icon = srv.icon;
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`flex flex-col justify-between rounded-2xl p-5 transition-all cursor-pointer backdrop-blur-xl ${
                    isSelected
                      ? "border-2 border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/15"
                      : "border border-white/[0.08] bg-[#0c101a]/70 hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-cyan-300 border border-white/10">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-sm font-bold text-white">
                        {srv.price}
                      </span>
                    </div>

                    <h4 className="mt-3 font-display text-sm font-bold text-white">
                      {srv.name}
                    </h4>

                    <span className="mt-1 block text-[11px] text-slate-400 font-mono">
                      ხანგრძლივობა: {srv.duration}
                    </span>

                    <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Booking Action Box */}
          <div className="mt-6 rounded-3xl border border-white/15 bg-gradient-to-r from-[#141b2f] to-[#0c101b] p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                  არჩეულია: {selectedExpert.name}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {selectedService.name} ({selectedService.price})
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  კონსულტაცია მიმდინარეობს ონლაინ (Zoom / WhatsApp / ტელეფონით)
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBookingModalOpen(true);
                  setBookingSuccess(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-cyan-500/20 hover:scale-105 transition-all cursor-pointer shrink-0"
              >
                <Calendar className="h-4 w-4" />
                <span>კონსულტაციის დაჯავშნა</span>
              </button>
            </div>
          </div>
        </div>
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
                  ასტროლოგი {selectedExpert.name} დაგიკავშირდებათ მითითებულ ნომერზე ({phone}) უახლოეს 1 საათში ზუსტი დროის შესათანხმებლად.
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
                    კონსულტაციის დაჯავშნა
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedExpert.name} · {selectedService.name}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070b14] p-3 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>ღირებულება:</span>
                    <span className="text-cyan-400 font-bold">{selectedService.price}</span>
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

                <button
                  type="submit"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-cyan-500/20 hover:scale-102 transition-all cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>დადასტურება & დაჯავშნა</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>კონფიდენციალურობა გარანტირებულია</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
