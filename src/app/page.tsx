"use client";

import { type CSSProperties, useState } from "react";
import { Activity, ArrowRight, Check, Compass, Heart, Orbit, Sparkles, Sun } from "lucide-react";
import AdvancedCalculator from "@/components/AdvancedCalculator";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";

type Tab = "natal" | "synastry" | "transit" | "advanced";

const TABS = [
  { id: "natal", label: "ნატალური", hint: "დაბადების რუკა — პირადი სტრუქტურისა და პოტენციალის ანალიზი", icon: Sun },
  { id: "synastry", label: "სინასტრია", hint: "ორი რუკის შედარება — ურთიერთქმედების ძლიერი და რთული წერტილები", icon: Heart },
  { id: "transit", label: "ტრანზიტები", hint: "მიმდინარე ციური მოძრაობა ნატალურ რუკასთან მიმართებით", icon: Activity },
  { id: "advanced", label: "გაფართოებული", hint: "პროგრესიები, Return-ები, Solar Arc, დაბნელებები და ჰარმონიკები", icon: Orbit },
] as const;

const ZODIAC_SIGNS = [
  { sign: "♈", ruler: "♂", element: "fire", name: "ვერძი" },
  { sign: "♉", ruler: "♀", element: "earth", name: "კურო" },
  { sign: "♊", ruler: "☿", element: "air", name: "ტყუპები" },
  { sign: "♋", ruler: "☽", element: "water", name: "კირჩხიბი" },
  { sign: "♌", ruler: "☉", element: "fire", name: "ლომი" },
  { sign: "♍", ruler: "☿", element: "earth", name: "ქალწული" },
  { sign: "♎", ruler: "♀", element: "air", name: "სასწორი" },
  { sign: "♏", ruler: "♇", element: "water", name: "მორიელი" },
  { sign: "♐", ruler: "♃", element: "fire", name: "მშვილდოსანი" },
  { sign: "♑", ruler: "♄", element: "earth", name: "თხის რქა" },
  { sign: "♒", ruler: "♅", element: "air", name: "მერწყული" },
  { sign: "♓", ruler: "♆", element: "water", name: "თევზები" },
] as const;

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("natal");
  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];

  return (
    <div className="app-home">
      <section className="hero-grid">
        <div>
          <div className="hero-kicker"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> SWISS EPHEMERIS · PRECISION ENGINE</div>
          <h1 className="hero-title">თქვენი რუკა.<br /><em>უფრო ღრმად.</em></h1>
          <p className="hero-lead">მკაფიო, მუქი და პროფესიონალური სამუშაო სივრცე ნატალური, სინასტრიული და ტრანზიტული რუკებისთვის — გამოთვლები იწყება ზუსტი ციური მონაცემებით.</p>
          <div className="hero-actions">
            <a href="#calculator" className="primary-action"><Compass className="h-4 w-4" /> რუკის შექმნა <ArrowRight className="h-4 w-4" /></a>
            <a href="#method" className="secondary-action"><Sparkles className="h-4 w-4" /> როგორ მუშაობს</a>
          </div>
        </div>
        <div className="hero-orbit-card" aria-label="ციური გამოთვლის ვიზუალური მოდული">
          <div className="zodiac-aura" aria-hidden="true" />
          <div className="element-frame element-frame-fire" aria-hidden="true"><span>△</span></div>
          <div className="element-frame element-frame-earth" aria-hidden="true"><span>◇</span></div>
          <div className="element-frame element-frame-air" aria-hidden="true"><span>⌁</span></div>
          <div className="element-frame element-frame-water" aria-hidden="true"><span>▽</span></div>
          <div className="zodiac-wheel" aria-hidden="true">
            <div className="zodiac-wheel-shadow" />
            <div className="zodiac-disc">
              {ZODIAC_SIGNS.map((item, index) => (
                <div
                  key={item.sign}
                  className={`zodiac-sign zodiac-sign-${item.element}`}
                  style={{ "--zodiac-angle": `${index * 30}deg` } as CSSProperties}
                  title={`${item.name} — ${item.ruler}`}
                >
                  <span className="zodiac-glyph">{item.sign}</span>
                  <span className="zodiac-ruler">{item.ruler}</span>
                </div>
              ))}
              <div className="zodiac-inner-orbit" />
              <div className="zodiac-crosshair zodiac-crosshair-horizontal" />
              <div className="zodiac-crosshair zodiac-crosshair-vertical" />
              <div className="zodiac-core">
                <span className="zodiac-core-symbol">✦</span>
                <span className="zodiac-core-orbit" />
              </div>
            </div>
          </div>
          <div className="orbit-ring orbit-ring-two" />
          <div className="orbit-core" />
          <span className="orbit-dot orbit-dot-one" /><span className="orbit-dot orbit-dot-two" /><span className="orbit-dot orbit-dot-three" />
          <div className="hero-orbit-meta"><span>Swiss / fallback ready</span><span>0°—360°</span></div>
        </div>
      </section>

      <section id="calculator" className="app-section">
        <div className="section-heading">
          <div><div className="hero-kicker">WORKSPACE</div><h2>აირჩიეთ ანალიზის ტიპი</h2></div>
          <p>ერთი მშვიდი სამუშაო სივრცე ყველა რუკისთვის. ფორმა იცვლება არჩეული მეთოდის მიხედვით.</p>
        </div>
        <div className="mode-switcher" role="tablist" aria-label="რუკის ტიპი">
          {TABS.map((item) => {
            const Icon = item.icon;
            const selected = tab === item.id;
            return (
              <button key={item.id} type="button" data-active={selected} onClick={() => setTab(item.id)} role="tab" aria-selected={selected}>
                <Icon className="mx-auto mb-1 h-4 w-4" />
                <span className="block truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" />{activeTab.hint}</div>
        <div className="mt-6">
          {tab === "natal" && <NatalCalculator />}
          {tab === "synastry" && <SynastryCalculator />}
          {tab === "transit" && <TransitCalculator />}
          {tab === "advanced" && <AdvancedCalculator />}
        </div>
      </section>

      <section id="method" className="home-features">
        <div className="home-feature"><h3><Check className="mr-1 inline h-4 w-4 text-violet-300" /> ზუსტი ეფემერიდი</h3><p>Swiss Ephemeris თანამედროვე თარიღებზე, უსაფრთხო fallback ისტორიულ დიაპაზონზე.</p></div>
        <div className="home-feature"><h3><Check className="mr-1 inline h-4 w-4 text-violet-300" /> გამჭვირვალე ანალიზი</h3><p>ორბები, კუთხეები, ღირსებები, დეკლინაციები და მეთოდის წყაროები ცალკე ფენებად.</p></div>
        <div className="home-feature"><h3><Check className="mr-1 inline h-4 w-4 text-violet-300" /> პირადი სამუშაო სივრცე</h3><p>შეინახეთ რუკები კაბინეტში და მართეთ წვდომა ერთი მშვიდი ინტერფეისიდან.</p></div>
      </section>
    </div>
  );
}
