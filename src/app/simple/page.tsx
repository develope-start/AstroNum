"use client";

import { useState } from "react";
import { Activity, Check, Flame, Heart, Layers, Orbit, ShieldCheck, Sun, Wind, Mountain, Droplet, ChevronDown, X, BookOpen } from "lucide-react";
import AdvancedCalculator from "@/components/AdvancedCalculator";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";
import ElementTemperamentDetails from "@/components/ElementTemperamentDetails";
import { ELEMENT_TEMPERAMENTS, type ElementTemperamentId } from "@/lib/elementTemperaments";

type Tab = "natal" | "synastry" | "transit" | "advanced";

const TABS = [
  {
    id: "natal",
    label: "ნატალური რუკა",
    tag: "პირადი ანალიზი",
    hint: "დაბადების რუკა — პირადი სტრუქტურისა და პოტენციალის ანალიზი",
    icon: Sun,
  },
  {
    id: "synastry",
    label: "სინასტრია",
    tag: "თავსებადობა",
    hint: "ორი რუკის შედარება — ურთიერთქმედების ძლიერი და რთული წერტილები",
    icon: Heart,
  },
  {
    id: "transit",
    label: "ტრანზიტები",
    tag: "დროის დინამიკა",
    hint: "მიმდინარე ციური მოძრაობა ნატალურ რუკასთან მიმართებით",
    icon: Activity,
  },
  {
    id: "advanced",
    label: "გაფართოებული",
    tag: "პროგნოზირება",
    hint: "პროგრესიები, Return-ები, Solar Arc, დაბნელებები და ჰარმონიკები",
    icon: Orbit,
  },
] as const;

const CELESTIAL_BODIES = [
  { id: "sun", name: "მზე", glyph: "☉", role: "თვითგამოხატვა და სიცოცხლის ძალა", element: "fire" },
  { id: "moon", name: "მთვარე", glyph: "☽", role: "ემოციური რიტმი და ქვეცნობიერი", element: "water" },
  { id: "mercury", name: "მერკური", glyph: "☿", role: "აზროვნება, ლოგიკა და კომუნიკაცია", element: "air" },
  { id: "venus", name: "ვენერა", glyph: "♀", role: "მიზიდულობა, ჰარმონია და ღირებულებები", element: "earth" },
  { id: "mars", name: "მარსი", glyph: "♂", role: "ენერგია, ნება და მოქმედება", element: "fire" },
  { id: "jupiter", name: "იუპიტერი", glyph: "♃", role: "გაფართოება, სიბრძნე და რწმენა", element: "fire" },
  { id: "saturn", name: "სატურნი", glyph: "♄", role: "სტრუქტურა, საზღვრები და დრო", element: "earth" },
  { id: "uranus", name: "ურანი", glyph: "♅", role: "ინოვაცია, ორიგინალურობა და თავისუფლება", element: "air" },
  { id: "neptune", name: "ნეპტუნი", glyph: "♆", role: "ინტუიცია, წარმოსახვა და იდეალიზმი", element: "water" },
  { id: "pluto", name: "პლუტონი", glyph: "♇", role: "ტრანსფორმაცია და ღრმა განახლება", element: "water" },
] as const;

const ELEMENT_STRIPS = [
  {
    id: "fire" as ElementTemperamentId,
    name: "ცეცხლი",
    symbol: "🜂",
    icon: Flame,
    temperament: "ქოლერიკი",
    focus: "ენერგია, ნება და შემოქმედებითი იმპულსი",
    signs: [{ name: "ვერძი", symbol: "♈" }, { name: "ლომი", symbol: "♌" }, { name: "მშვილდოსანი", symbol: "♐" }],
    rulers: [{ name: "მარსი", symbol: "♂" }, { name: "მზე", symbol: "☉" }, { name: "იუპიტერი", symbol: "♃" }],
  },
  {
    id: "earth" as ElementTemperamentId,
    name: "მიწა",
    symbol: "🜃",
    icon: Mountain,
    temperament: "მელანქოლიკი",
    focus: "სტრუქტურა, სტაბილურობა და მატერიალური ფორმა",
    signs: [{ name: "კურო", symbol: "♉" }, { name: "ქალწული", symbol: "♍" }, { name: "თხის რქა", symbol: "♑" }],
    rulers: [{ name: "ვენერა", symbol: "♀" }, { name: "მერკური", symbol: "☿" }, { name: "სატურნი", symbol: "♄" }],
  },
  {
    id: "air" as ElementTemperamentId,
    name: "ჰაერი",
    symbol: "🜁",
    icon: Wind,
    temperament: "სანგვინიკი",
    focus: "კომუნიკაცია, ინტელექტი და კონცეპტუალური აზროვნება",
    signs: [{ name: "ტყუპები", symbol: "♊" }, { name: "სასწორი", symbol: "♎" }, { name: "მერწყული", symbol: "♒" }],
    rulers: [{ name: "მერკური", symbol: "☿" }, { name: "ვენერა", symbol: "♀" }, { name: "ურანი", symbol: "♅" }],
  },
  {
    id: "water" as ElementTemperamentId,
    name: "წყალი",
    symbol: "🜄",
    icon: Droplet,
    temperament: "ფლეგმატიკი",
    focus: "ემპათია, ინტუიცია და ფსიქოდინამიკური სიღრმე",
    signs: [{ name: "კირჩხიბი", symbol: "♋" }, { name: "მორიელი", symbol: "♏" }, { name: "თევზები", symbol: "♓" }],
    rulers: [{ name: "მთვარე", symbol: "☽" }, { name: "პლუტონი", symbol: "♇" }, { name: "ნეპტუნი", symbol: "♆" }],
  },
] as const;

export default function SimplePage() {
  const [tab, setTab] = useState<Tab>("natal");
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [expandedElement, setExpandedElement] = useState<ElementTemperamentId | null>(null);
  const [modalElement, setModalElement] = useState<ElementTemperamentId | null>(null);

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];
  const activePlanet = CELESTIAL_BODIES.find((p) => p.id === selectedPlanet);

  return (
    <div className="simple-page">
      {/* 1. Elements and Temperaments - Minimalist Monochrome Strip Structure */}
      <section id="elements" className="simple-section">
        <div className="simple-section-header">
          <div>
            <span className="simple-tag">სტიქიები და ტემპერამენტები</span>
            <h2 className="simple-section-title">ოთხი პირველსაწყისი ელემენტი</h2>
          </div>
          <p className="simple-section-desc">
            ნატალური რუკის ენერგეტიკული ბალანსი: ცეცხლის დრაივი, მიწის სტრუქტურა, ჰაერის ინტელექტი და წყლის ინტუიცია.
          </p>
        </div>

        <div className="simple-element-strips-list space-y-2.5">
          {ELEMENT_STRIPS.map((elem) => {
            const isExpanded = expandedElement === elem.id;
            const guide = ELEMENT_TEMPERAMENTS[elem.id];

            return (
              <div
                key={elem.id}
                className={`simple-element-strip ${isExpanded ? "is-expanded" : ""}`}
              >
                {/* Clickable Header Bar */}
                <button
                  type="button"
                  onClick={() => setExpandedElement(isExpanded ? null : elem.id)}
                  className="simple-element-strip-header"
                  aria-expanded={isExpanded}
                >
                  <div className="simple-element-strip-left">
                    <span className="simple-element-strip-glyph" aria-hidden="true">{elem.symbol}</span>
                    <div className="simple-element-strip-title-box">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="simple-element-strip-name">{elem.name}</h3>
                        <span className="simple-element-strip-badge">{elem.temperament}</span>
                      </div>
                      <p className="simple-element-strip-focus">{elem.focus}</p>
                    </div>
                  </div>

                  <div className="simple-element-strip-right">
                    <div className="simple-element-strip-zodiacs">
                      {elem.signs.map((s) => (
                        <span key={s.name} className="simple-strip-chip" title={s.name}>
                          <b>{s.symbol}</b> <span>{s.name}</span>
                        </span>
                      ))}
                    </div>
                    <div className="simple-element-strip-action">
                      <span className="simple-strip-action-text">{isExpanded ? "დახურვა" : "ანალიზი"}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </button>

                {/* Smooth Expandable Drawer */}
                {isExpanded && (
                  <div className="simple-element-strip-drawer">
                    <div className="simple-drawer-inner">
                      <div className="simple-drawer-lede-row">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 dark:text-zinc-300">
                          <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>{guide.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModalElement(elem.id)}
                          className="simple-drawer-modal-btn"
                          title="გახსენი სრულ ეკრანზე"
                        >
                          სრული ფანჯარა ↗
                        </button>
                      </div>

                      <div className="simple-drawer-content mt-3 text-xs leading-relaxed space-y-3">
                        <p className="simple-drawer-short font-medium text-slate-300 dark:text-zinc-200">
                          {guide.short}
                        </p>
                        
                        <div className="simple-drawer-grid grid gap-3 sm:grid-cols-2 pt-2 border-t border-zinc-700/30">
                          <div className="simple-drawer-card">
                            <h4 className="font-bold text-slate-100 dark:text-white mb-1">ფსიქოლოგიური სუბსტრატი</h4>
                            <p className="text-slate-300 dark:text-zinc-300 leading-normal">{guide.psychologicalSubstrate}</p>
                          </div>
                          <div className="simple-drawer-card">
                            <h4 className="font-bold text-slate-100 dark:text-white mb-1">ასტროლოგიური კონვერსია</h4>
                            <p className="text-slate-300 dark:text-zinc-300 leading-normal">{guide.astrologicalConversion}</p>
                          </div>
                        </div>

                        <div className="simple-drawer-card simple-drawer-card-shadow pt-2 border-t border-zinc-700/30">
                          <h4 className="font-bold text-slate-100 dark:text-white mb-1">ჩრდილოვანი ასპექტი და რისკები</h4>
                          <p className="text-slate-300 dark:text-zinc-300 leading-normal">{guide.negativeAspect}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Full Top-Level Modal Dialog for Maximum Mobile Clarity (Overflow Safe) */}
      {modalElement && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalElement(null)}
        >
          <div
            className="simple-modal-card relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 sm:p-7 text-left text-zinc-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {ELEMENT_STRIPS.find((e) => e.id === modalElement)?.symbol}
                </span>
                <h3 className="text-lg sm:text-xl font-bold">
                  {ELEMENT_STRIPS.find((e) => e.id === modalElement)?.name} — {ELEMENT_STRIPS.find((e) => e.id === modalElement)?.temperament}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalElement(null)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95"
                aria-label="დახურვა"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-300">
              <ElementTemperamentDetails element={modalElement} showTitle={false} />
            </div>
          </div>
        </div>
      )}

      {/* 2. Celestial Bodies Ribbon */}
      <section id="planets" className="simple-section">
        <div className="simple-section-header">
          <div>
            <span className="simple-tag">ციური სხეულები</span>
            <h2 className="simple-section-title">10 მმართველი მნათობი და პლანეტა</h2>
          </div>
          <p className="simple-section-desc">
            დააკლიკეთ პლანეტას მისი არქეტიპული მნიშვნელობისა და ასტროლოგიური როლის სანახავად.
          </p>
        </div>

        <div className="simple-planet-ribbon" role="tablist" aria-label="პლანეტების სია">
          {CELESTIAL_BODIES.map((planet) => {
            const isSelected = selectedPlanet === planet.id;
            return (
              <button
                key={planet.id}
                type="button"
                className={`simple-planet-pill ${isSelected ? "is-selected" : ""}`}
                onClick={() => setSelectedPlanet(isSelected ? null : planet.id)}
              >
                <span className="simple-planet-glyph">{planet.glyph}</span>
                <span className="simple-planet-name">{planet.name}</span>
              </button>
            );
          })}
        </div>

        {activePlanet && (
          <div className="simple-planet-detail-card">
            <div className="simple-planet-detail-header">
              <span className="simple-planet-detail-glyph">{activePlanet.glyph}</span>
              <div className="flex-1 min-w-0">
                <h4 className="simple-planet-detail-name">{activePlanet.name}</h4>
                <p className="simple-planet-detail-role">{activePlanet.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanet(null)}
                className="simple-detail-close"
                aria-label="დახურვა"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Calculator Workspace */}
      <section id="calculator" className="simple-section simple-calc-section">
        <div className="simple-section-header">
          <div>
            <span className="simple-tag">გამოთვლის სივრცე</span>
            <h2 className="simple-section-title">აირჩიეთ ანალიზის მეთოდი</h2>
          </div>
          <p className="simple-section-desc">
            ერთიანი, სუფთა და ფოკუსირებული სამუშაო სივრცე ნატალური, სინასტრიული და პროგნოზული გათვლებისთვის.
          </p>
        </div>

        {/* 2-Row Responsive Grid of Tab Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 my-4" role="tablist" aria-label="ანალიზის მეთოდები">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isSelected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setTab(item.id)}
                className={`simple-nav-card group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-150 text-left active:scale-[0.98] ${
                  isSelected
                    ? "simple-nav-card-active shadow-md"
                    : "simple-nav-card-inactive hover:border-zinc-400 dark:hover:border-zinc-500"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl transition-colors ${
                    isSelected 
                      ? "simple-nav-card-icon-active" 
                      : "simple-nav-card-icon-inactive"
                  }`}>
                    <Icon className="h-5 w-5 shrink-0" />
                  </div>
                  <div>
                    <span className="block text-sm sm:text-base font-bold leading-tight">
                      {item.label}
                    </span>
                    <span className="block text-[11px] sm:text-xs opacity-70 mt-0.5 font-medium">
                      {item.tag}
                    </span>
                  </div>
                </div>
                <div className={`hidden sm:flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isSelected 
                    ? "border-current opacity-90 font-bold" 
                    : "border-transparent opacity-0 group-hover:opacity-60"
                }`}>
                  {isSelected ? "აქტიური" : "არჩევა"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="simple-tab-hint">
          <span className="simple-hint-dot" />
          <span>{activeTab.hint}</span>
        </div>

        <div className="simple-calc-frame mt-4">
          {tab === "natal" && <NatalCalculator />}
          {tab === "synastry" && <SynastryCalculator />}
          {tab === "transit" && <TransitCalculator />}
          {tab === "advanced" && <AdvancedCalculator />}
        </div>
      </section>

      {/* 4. Architectural Methodology Highlights */}
      <section id="method" className="simple-section">
        <div className="simple-section-header">
          <div>
            <span className="simple-tag">სტანდარტები და სიზუსტე</span>
            <h2 className="simple-section-title">პროფესიონალური ასტროლოგიური მექანიზმი</h2>
          </div>
          <p className="simple-section-desc">
            ზუსტი ციური გამოთვლები ეფემერიდის უმაღლესი სტანდარტით.
          </p>
        </div>

        <div className="simple-methods-grid">
          <div className="simple-method-card">
            <span className="simple-method-num">01</span>
            <div className="simple-method-icon-wrap">
              <Check className="h-4 w-4" />
            </div>
            <h3 className="simple-method-title">Swiss Ephemeris</h3>
            <p className="simple-method-text">
              პლანეტარული და ციური სხეულების კოორდინატები 0.001° სიზუსტით თანამედროვე და ისტორიულ თარიღებზე.
            </p>
          </div>

          <div className="simple-method-card">
            <span className="simple-method-num">02</span>
            <div className="simple-method-icon-wrap">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="simple-method-title">სახლების სისტემები</h3>
            <p className="simple-method-text">
              პლაციდუსი, კოხი, მთლიანი ნიშანი (Whole Sign) და თანაბარი სახლები — თქვენს მეთოდზე მორგებული.
            </p>
          </div>

          <div className="simple-method-card">
            <span className="simple-method-num">03</span>
            <div className="simple-method-icon-wrap">
              <Orbit className="h-4 w-4" />
            </div>
            <h3 className="simple-method-title">ასპექტების მატრიცა</h3>
            <p className="simple-method-text">
              მაჟორული და მინორული ასპექტები, დეკლინაციების პარალელები, ფიქსირებული ვარსკვლავები და ღირსებები.
            </p>
          </div>

          <div className="simple-method-card">
            <span className="simple-method-num">04</span>
            <div className="simple-method-icon-wrap">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="simple-method-title">პირადი სამუშაო სივრცე</h3>
            <p className="simple-method-text">
              შეინახეთ რუკები პირად კაბინეტში და მართეთ მონაცემები უსაფრთხოდ, სუფთა და სწრაფი ინტერფეისიდან.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
