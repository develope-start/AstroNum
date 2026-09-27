"use client";

import { useState } from "react";
import { Activity, Check, Flame, Heart, Layers, Orbit, ShieldCheck, Sun, Wind, Mountain, Droplet } from "lucide-react";
import AdvancedCalculator from "@/components/AdvancedCalculator";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";
import ElementTemperamentSummary from "@/components/ElementTemperamentSummary";
import type { ElementTemperamentId } from "@/lib/elementTemperaments";

type Tab = "natal" | "synastry" | "transit" | "advanced";

const TABS = [
  { id: "natal", label: "ნატალური", hint: "დაბადების რუკა — პირადი სტრუქტურისა და პოტენციალის ანალიზი", icon: Sun },
  { id: "synastry", label: "სინასტრია", hint: "ორი რუკის შედარება — ურთიერთქმედების ძლიერი და რთული წერტილები", icon: Heart },
  { id: "transit", label: "ტრანზიტები", hint: "მიმდინარე ციური მოძრაობა ნატალურ რუკასთან მიმართებით", icon: Activity },
  { id: "advanced", label: "გაფართოებული", hint: "პროგრესიები, Return-ები, Solar Arc, დაბნელებები და ჰარმონიკები", icon: Orbit },
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

const ELEMENT_CARDS = [
  {
    id: "fire" as ElementTemperamentId,
    name: "ცეცხლი",
    symbol: "🜂",
    icon: Flame,
    temperament: "ქოლერიკი",
    focus: "ენერგია და შემოქმედებითი იმპულსი",
    signs: [{ name: "ვერძი", symbol: "♈" }, { name: "ლომი", symbol: "♌" }, { name: "მშვილდოსანი", symbol: "♐" }],
    rulers: [{ name: "მარსი", symbol: "♂" }, { name: "მზე", symbol: "☉" }, { name: "იუპიტერი", symbol: "♃" }],
    badgeClass: "badge-fire",
  },
  {
    id: "earth" as ElementTemperamentId,
    name: "მიწა",
    symbol: "🜃",
    icon: Mountain,
    temperament: "მელანქოლიკი",
    focus: "სტრუქტურა, სტაბილურობა და ფორმა",
    signs: [{ name: "კურო", symbol: "♉" }, { name: "ქალწული", symbol: "♍" }, { name: "თხის რქა", symbol: "♑" }],
    rulers: [{ name: "ვენერა", symbol: "♀" }, { name: "მერკური", symbol: "☿" }, { name: "სატურნი", symbol: "♄" }],
    badgeClass: "badge-earth",
  },
  {
    id: "air" as ElementTemperamentId,
    name: "ჰაერი",
    symbol: "🜁",
    icon: Wind,
    temperament: "სანგვინიკი",
    focus: "კომუნიკაცია, ინტელექტი და კონცეფცია",
    signs: [{ name: "ტყუპები", symbol: "♊" }, { name: "სასწორი", symbol: "♎" }, { name: "მერწყული", symbol: "♒" }],
    rulers: [{ name: "მერკური", symbol: "☿" }, { name: "ვენერა", symbol: "♀" }, { name: "ურანი", symbol: "♅" }],
    badgeClass: "badge-air",
  },
  {
    id: "water" as ElementTemperamentId,
    name: "წყალი",
    symbol: "🜄",
    icon: Droplet,
    temperament: "ფლეგმატიკი",
    focus: "ემპათია, ინტუიცია და შინაგანი ექო",
    signs: [{ name: "კირჩხიბი", symbol: "♋" }, { name: "მორიელი", symbol: "♏" }, { name: "თევზები", symbol: "♓" }],
    rulers: [{ name: "მთვარე", symbol: "☽" }, { name: "პლუტონი", symbol: "♇" }, { name: "ნეპტუნი", symbol: "♆" }],
    badgeClass: "badge-water",
  },
] as const;

export default function SimplePage() {
  const [tab, setTab] = useState<Tab>("natal");
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [expandedElement, setExpandedElement] = useState<ElementTemperamentId | null>(null);

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];
  const activePlanet = CELESTIAL_BODIES.find((p) => p.id === selectedPlanet);

  return (
    <div className="simple-page">
      {/* The Simple route begins directly with useful information. */}
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

        <div className="simple-elements-grid">
          {ELEMENT_CARDS.map((elem) => {
            const Icon = elem.icon;
            const isExpanded = expandedElement === elem.id;

            return (
              <div
                key={elem.id}
                className={`simple-element-card ${elem.badgeClass} ${isExpanded ? "is-expanded" : ""}`}
              >
                <div className="simple-element-top">
                  <div className="simple-element-symbol-box">
                    <span className="simple-element-glyph">{elem.symbol}</span>
                    <Icon className="simple-element-mini-icon" />
                  </div>
                  <div className="simple-element-meta">
                    <span className="simple-element-kicker">{elem.temperament}</span>
                    <h3 className="simple-element-name">{elem.name}</h3>
                  </div>
                </div>

                <p className="simple-element-focus">{elem.focus}</p>

                <div className="simple-element-chips-row">
                  <span className="simple-chip-label">ზოდიაქო</span>
                  <div className="simple-chips">
                    {elem.signs.map((s) => (
                      <span key={s.name} className="simple-chip" title={s.name}>
                        <b>{s.symbol}</b> {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="simple-element-chips-row">
                  <span className="simple-chip-label">მმართველი</span>
                  <div className="simple-chips">
                    {elem.rulers.map((r) => (
                      <span key={r.name} className="simple-chip" title={r.name}>
                        <b>{r.symbol}</b> {r.name}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedElement(isExpanded ? null : elem.id)}
                  className="simple-element-expand-btn"
                >
                  <span>{isExpanded ? "ანალიზის დამალვა" : "ფსიქოლოგიური ანალიზი"}</span>
                  <span className="simple-expand-arrow">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {isExpanded && (
                  <div className="simple-element-drawer">
                    <ElementTemperamentSummary element={elem.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Celestial Bodies Horizon Ribbon */}
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
              <div>
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

      {/* 4. Calculator Workspace */}
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

        {/* Minimalist segmented tabs */}
        <div className="simple-tab-nav" role="tablist">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isSelected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`simple-tab-btn ${isSelected ? "is-active" : ""}`}
                onClick={() => setTab(item.id)}
                role="tab"
                aria-selected={isSelected}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="simple-tab-hint">
          <span className="simple-hint-dot" />
          <span>{activeTab.hint}</span>
        </div>

        <div className="simple-calc-frame">
          {tab === "natal" && <NatalCalculator />}
          {tab === "synastry" && <SynastryCalculator />}
          {tab === "transit" && <TransitCalculator />}
          {tab === "advanced" && <AdvancedCalculator />}
        </div>
      </section>

      {/* 5. Architectural Methodology Highlights */}
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
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <h3 className="simple-method-title">Swiss Ephemeris</h3>
            <p className="simple-method-text">
              პლანეტარული და ციური სხეულების კოორდინატები 0.001° სიზუსტით თანამედროვე და ისტორიულ თარიღებზე.
            </p>
          </div>

          <div className="simple-method-card">
            <span className="simple-method-num">02</span>
            <div className="simple-method-icon-wrap">
              <Layers className="h-4 w-4 text-sky-400" />
            </div>
            <h3 className="simple-method-title">სახლების სისტემები</h3>
            <p className="simple-method-text">
              პლაციდუსი, კოხი, მთლიანი ნიშანი (Whole Sign) და თანაბარი სახლები — თქვენს მეთოდზე მორგებული.
            </p>
          </div>

          <div className="simple-method-card">
            <span className="simple-method-num">03</span>
            <div className="simple-method-icon-wrap">
              <Orbit className="h-4 w-4 text-violet-400" />
            </div>
            <h3 className="simple-method-title">ასპექტების მატრიცა</h3>
            <p className="simple-method-text">
              მაჟორული და მინორული ასპექტები, დეკლინაციების პარალელები, ფიქსირებული ვარსკვლავები და ღირსებები.
            </p>
          </div>

          <div className="simple-method-card">
            <span className="simple-method-num">04</span>
            <div className="simple-method-icon-wrap">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
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
