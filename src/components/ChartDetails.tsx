"use client";

import { Hand, Minus, Plus, RotateCw, Table2, X, Sparkles, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { eclipticToSign, formatDegree, PLANET_NAMES_KA } from "@/lib/astro/signs";
import type { AspectHit } from "@/lib/astro/aspects";
import { aspectMeaning, sortAspectsByInfluence } from "@/lib/astro/aspectInterpretation";
import type { WheelFixedStar, WheelPlanet } from "./ChartWheel";

const HOUSE_NAMES = [
  "პიროვნება და გარეგნობა", "ფინანსები და ღირებულებები", "კომუნიკაცია და სწავლა", "ოჯახი და ფესვები",
  "შემოქმედება და სიყვარული", "ყოველდღიურობა და ჯანმრთელობა", "ურთიერთობები და პარტნიორობა", "ტრანსფორმაცია და საერთო რესურსები",
  "მსოფლმხედველობა და მოგზაურობა", "კარიერა და სტატუსი", "მეგობრები და გეგმები", "ქვეცნობიერი და დასვენება",
];

const DISPLAY_NAMES: Record<string, string> = {
  ...PLANET_NAMES_KA,
  Lilith: "ლილითი",
  Selena: "სელენა",
  Chiron: "ქირონი",
};

const POINT_SUMMARY_MEANINGS: Record<string, string> = {
  Sun: "იდენტობის, ნებისყოფისა და თვითგამოხატვის მთავარი ღერძი",
  Moon: "ემოციური უსაფრთხოებისა და შინაგანი რეაქციების მთავარი მაჩვენებელი",
  TrueNode: "განვითარების მიმართულება და ახალი გამოცდილებისკენ გადადგმული ნაბიჯები",
  MeanNode: "განვითარების მიმართულება და განმეორებადი ცხოვრებისეული გაკვეთილები",
  SouthNode: "ნაცნობი უნარები და ავტომატური რეაქციები, რომლებიც საყრდენიცაა და ჩვევად ქცევის რისკიც აქვს",
  Lilith: "უარყოფილი სურვილების, ტაბუებისა და პირადი ძალის გაცნობიერების ადგილი",
  Selena: "შინაგანი მხარდაჭერისა და კეთილსინდისიერი არჩევანის რესურსი",
  Chiron: "მგრძნობიარე გამოცდილება, რომელიც გააზრებისას სამკურნალო უნარად შეიძლება იქცეს",
};

function focus(target: { type: string; key: string }) {
  window.dispatchEvent(new CustomEvent("focus-interpretation", { detail: target }));
}

function degreeLabel(longitude: number) {
  const sign = eclipticToSign(longitude);
  return `${sign.signName} · ${formatDegree(sign.degreeInSign)}`;
}

function placementLabel(name: string, planets: WheelPlanet[], planetHouses: Record<string, number>) {
  const point = planets.find((item) => item.name === name);
  if (!point) return null;
  const sign = eclipticToSign(point.longitude);
  const house = planetHouses[name] ?? "—";
  return `${DISPLAY_NAMES[name] ?? name} ${sign.signName}-ში, ${house}-ე სახლში`;
}

function summaryParagraphs(planets: WheelPlanet[], planetHouses: Record<string, number>, aspects: AspectHit[], ascendant: number) {
  const sun = placementLabel("Sun", planets, planetHouses);
  const moon = placementLabel("Moon", planets, planetHouses);
  const northNode = placementLabel("TrueNode", planets, planetHouses) ?? placementLabel("MeanNode", planets, planetHouses);
  const southNode = placementLabel("SouthNode", planets, planetHouses);
  const special = ["Lilith", "Selena", "Chiron"]
    .filter((name) => planets.some((planet) => planet.name === name))
    .map((name) => `${placementLabel(name, planets, planetHouses)} — ${POINT_SUMMARY_MEANINGS[name]}.`)
    .join(" ");
  const strongest = sortAspectsByInfluence(aspects).slice(0, 3);
  const aspectText = strongest.length
    ? strongest.map((aspect) => `${DISPLAY_NAMES[aspect.a] ?? aspect.a} ${aspect.aspectKa} ${DISPLAY_NAMES[aspect.b] ?? aspect.b} (${aspect.orb}°) — ${aspectMeaning(aspect)}`).join(" ")
    : "ამ ორბებში გამოკვეთილი ასპექტური კავშირი არ დაფიქსირდა.";

  return [
    `${sun ? `${sun} აჩვენებს, სად იკრიბება თქვენი იდენტობისა და თვითგამოხატვის მთავარი ძალა.` : "მზის მდებარეობა ამ რუკის მონაცემებში არ იკითხება."} ${moon ? `${moon} აღწერს, როგორ ეძებთ ემოციურ უსაფრთხოებას და როგორ რეაგირებთ შინაგანად.` : "მთვარის მდებარეობა ამ რუკის მონაცემებში არ იკითხება."} ასცენდენტი — ${degreeLabel(ascendant)} — ამ ყველაფერს გარესამყაროსთან გამოჩენისა და პირველი რეაქციის სტილს უმატებს.`,
    northNode && southNode
      ? `განვითარების ღერძი ასეთია: ${northNode} — ${POINT_SUMMARY_MEANINGS["TrueNode"] ?? "ახალი მიმართულება"}; ${southNode} — ${POINT_SUMMARY_MEANINGS.SouthNode ?? "ნაცნობი საყრდენი"}. ამ ორი პოლუსის დაბალანსება რუკის ერთ-ერთი მთავარი სიუჟეტია.`
      : "მთვარის კვანძთა ღერძი სრულად არ არის წარმოდგენილი.",
    special ? `დამატებითი ფსიქოლოგიური ფენა: ${special}` : "ლილითის, სელენასა და ქირონის მონაცემები ამ რუკაში არ არის ხელმისაწვდომი.",
    `ყველაზე აქტიური კავშირები: ${aspectText}`,
  ];
}

function rowButton(label: string, target: { type: string; key: string }) {
  return <button type="button" onClick={() => focus(target)} className="chart-detail-link chart-focus-source font-semibold text-sky-300 hover:text-white underline decoration-sky-400/40">{label}</button>;
}

function CombinedChartTable({
  planets,
  planetHouses,
  houseCusps,
  aspects,
}: {
  planets: WheelPlanet[];
  planetHouses: Record<string, number>;
  houseCusps: number[];
  aspects: AspectHit[];
}) {
  const [open, setOpen] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const orderedAspects = sortAspectsByInfluence(aspects);
  const rows = [
    ...planets.map((planet) => ({
      category: "პლანეტა",
      object: DISPLAY_NAMES[planet.name] ?? planet.name,
      position: degreeLabel(planet.longitude),
      house: `${planetHouses[planet.name] ?? "—"}`,
      type: "წერტილი",
      orbit: "—",
      phase: "—",
      meaning: POINT_SUMMARY_MEANINGS[planet.name] ?? "პლანეტარული პოზიცია",
    })),
    ...houseCusps.map((cusp, index) => ({
      category: "სახლის კუსპიდი",
      object: `${index + 1}-ე სახლი`,
      position: degreeLabel(cusp),
      house: `${index + 1}`,
      type: "კუსპიდი",
      orbit: "—",
      phase: "—",
      meaning: HOUSE_NAMES[index] ?? "სფერო",
    })),
    ...orderedAspects.map((aspect) => ({
      category: "ასპექტი",
      object: `${DISPLAY_NAMES[aspect.a] ?? aspect.a} - ${DISPLAY_NAMES[aspect.b] ?? aspect.b}`,
      position: "—",
      house: `${planetHouses[aspect.a] ?? "—"} / ${planetHouses[aspect.b] ?? "—"}`,
      type: `${aspect.aspectKa} (${aspect.kind === "major" ? "მაჟორული" : "მინორული"})`,
      orbit: `${aspect.orb}°`,
      phase: aspect.applying ? "მოახლოებადი" : "დაშორებადი",
      meaning: aspectMeaning(aspect),
    })),
  ];

  const tableImage = (
    <div
      className="combined-chart-table-modal fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-2 sm:p-6 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="ასტროლოგიური მონაცემების სრული ცხრილი"
      onClick={() => setOpen(false)}
    >
      <div
        className="prism-card relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl border border-white/20 p-4 sm:p-6 shadow-[0_30px_90px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">ასტროლოგიური მონაცემების სრული ცხრილი</h3>
            <p className="text-xs text-slate-300">პლანეტები, სახლები და ასპექტები ერთიან ხედში</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10 hover:text-white"
              title="დაპატარავება"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10 hover:text-white"
              title="გადიდება"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setRotated((r) => !r)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10 hover:text-white"
              title="შემოტრიალება"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-rose-500/20 hover:text-rose-300"
              title="დახურვა"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-auto pt-4" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <table className="w-full text-left text-xs text-slate-200 border-collapse">
            <thead>
              <tr className="border-b border-white/15 bg-white/5 text-white uppercase tracking-wider font-bold">
                <th className="p-3">კატეგორია</th>
                <th className="p-3">ობიექტი</th>
                <th className="p-3">პოზიცია</th>
                <th className="p-3">სახლი</th>
                <th className="p-3">ტიპი</th>
                <th className="p-3">ორბი</th>
                <th className="p-3">ფაზა</th>
                <th className="p-3">ინტერპრეტაცია</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.category}-${row.object}-${index}`} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                  <td className="p-3 font-semibold text-purple-300">{row.category}</td>
                  <td className="p-3 font-bold text-white">{row.object}</td>
                  <td className="p-3 text-sky-300 font-semibold">{row.position}</td>
                  <td className="p-3 text-slate-300">{row.house}</td>
                  <td className="p-3 text-slate-200">{row.type}</td>
                  <td className="p-3 text-slate-300 tabular-nums">{row.orbit}</td>
                  <td className="p-3 text-slate-300">{row.phase}</td>
                  <td className="p-3 text-slate-300 max-w-xs">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setZoom(1); }}
        className="flex items-center justify-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-5 py-3 text-xs font-bold text-sky-200 hover:bg-sky-500/20 hover:border-sky-400 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)] cursor-pointer w-full"
      >
        <Table2 className="h-4 w-4 text-sky-400" />
        <span>მონაცემების სრული ცხრილის გახსნა</span>
      </button>
      {open && typeof document !== "undefined" ? createPortal(tableImage, document.body) : null}
    </>
  );
}

export default function ChartDetails({
  planets,
  planetHouses,
  houseCusps,
  aspects,
  fixedStars,
  ascendant,
  mc,
}: {
  planets: WheelPlanet[];
  planetHouses: Record<string, number>;
  houseCusps: number[];
  aspects: AspectHit[];
  fixedStars: WheelFixedStar[];
  ascendant: number;
  mc: number;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const orderedAspects = sortAspectsByInfluence(aspects);
  const tightAspects = orderedAspects.slice(0, 4);
  const uniqueStars = Array.from(new Set(fixedStars.map((item) => item.star)));
  const summary = summaryParagraphs(planets, planetHouses, aspects, ascendant);

  return (
    <div className="chart-details mt-4 space-y-4 text-left">
      <section className="prism-card rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-4 text-center sm:text-left">
          <div>
            <div className="telemetry-badge inline-flex items-center gap-2 mb-1">
              <span className="live-beacon"></span>
              <span className="telemetry-badge-text">ასტრო-რეზიუმე</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">რუკის მთავარი სურათი</h3>
          </div>
          <span className="rounded-full border border-sky-400/40 bg-sky-500/15 px-3.5 py-1.5 text-xs font-bold text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.25)] shrink-0">
            ASC · {degreeLabel(ascendant)}
          </span>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-slate-200">
          {summary.map((paragraph, index) => (
            <p key={index} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 sm:p-4">
              <strong className="text-sky-300 font-bold block mb-1">
                {["ძირითადი ტონი", "განვითარების ღერძი", "დამატებითი ფენა", "კავშირების სურათი"][index]}:
              </strong>
              <span className="text-slate-200">{paragraph}</span>
            </p>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-slate-300 pt-1">
          რუკა აერთიანებს <strong className="text-sky-300">{aspects.length}</strong> ასპექტურ კავშირს, <strong className="text-purple-300">{planets.length}</strong> გამოთვლილ წერტილს და <strong className="text-pink-300">{uniqueStars.length}</strong> აქტიურ ფიქსირებულ ვარსკვლავს.
        </p>

        {tightAspects.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {tightAspects.map((aspect) => (
              <button
                key={`${aspect.a}-${aspect.b}-${aspect.aspect}`}
                type="button"
                onClick={() => focus({ type: "aspect", key: `${aspect.a}|${aspect.aspect}|${aspect.b}` })}
                className="chart-focus-source rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:border-sky-400 hover:bg-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.15)] cursor-pointer"
              >
                {DISPLAY_NAMES[aspect.a] ?? aspect.a} {aspect.aspectKa} {DISPLAY_NAMES[aspect.b] ?? aspect.b} · {aspect.orb}°
              </button>
            ))}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            aria-expanded={detailsOpen}
            onClick={() => {
              const next = !detailsOpen;
              setDetailsOpen(next);
              if (next) window.setTimeout(() => document.getElementById("chart-details-accordion")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:bg-white/[0.08] hover:border-sky-400/40 cursor-pointer"
          >
            <Hand className="h-4 w-4 text-sky-400" />
            <span>{detailsOpen ? "მნიშვნელობების დამალვა" : "გამოთვლილი მნიშვნელობების ნახვა"}</span>
          </button>
        </div>
      </section>

      {detailsOpen && (
        <div id="chart-details-accordion" className="space-y-4">
          <details className="prism-card rounded-2xl p-4 overflow-hidden" open>
            <summary className="font-bold text-white cursor-pointer flex items-center justify-between pb-2 border-b border-white/10">
              <span>პლანეტები და დამატებითი წერტილები</span>
              <ChevronDown className="h-4 w-4 text-sky-400" />
            </summary>
            <div className="overflow-x-auto pt-3">
              <table className="w-full text-xs text-left text-slate-200">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase font-semibold">
                    <th className="p-2.5">ობიექტი</th>
                    <th className="p-2.5">ზოდიაქო / გრადუსი</th>
                    <th className="p-2.5">სახლი</th>
                  </tr>
                </thead>
                <tbody>
                  {planets.map((planet) => (
                    <tr key={planet.name} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-2.5 font-bold text-white">{rowButton(DISPLAY_NAMES[planet.name] ?? planet.name, { type: "planet", key: planet.name })}</td>
                      <td className="p-2.5 text-sky-300 font-semibold">{degreeLabel(planet.longitude)}</td>
                      <td className="p-2.5">{rowButton(`${planetHouses[planet.name] ?? "—"}`, { type: "house", key: String(planetHouses[planet.name] ?? "") })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <details className="prism-card rounded-2xl p-4 overflow-hidden">
            <summary className="font-bold text-white cursor-pointer flex items-center justify-between pb-2 border-b border-white/10">
              <span>12 სახლის კუსპიდები</span>
              <ChevronDown className="h-4 w-4 text-purple-400" />
            </summary>
            <div className="overflow-x-auto pt-3">
              <table className="w-full text-xs text-left text-slate-200">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase font-semibold">
                    <th className="p-2.5">სახლი</th>
                    <th className="p-2.5">დაწყება</th>
                    <th className="p-2.5">თემა</th>
                  </tr>
                </thead>
                <tbody>
                  {houseCusps.map((cusp, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-2.5 font-bold text-white">{rowButton(`${index + 1}-ე სახლი`, { type: "house", key: String(index + 1) })}</td>
                      <td className="p-2.5 text-purple-300 font-semibold">{degreeLabel(cusp)}</td>
                      <td className="p-2.5 text-slate-300">{HOUSE_NAMES[index]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <details className="prism-card rounded-2xl p-4 overflow-hidden">
            <summary className="font-bold text-white cursor-pointer flex items-center justify-between pb-2 border-b border-white/10">
              <span>მაჟორული და მინორული ასპექტები ({aspects.length})</span>
              <ChevronDown className="h-4 w-4 text-pink-400" />
            </summary>
            <div className="overflow-x-auto pt-3">
              <table className="w-full text-xs text-left text-slate-200">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase font-semibold">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">კავშირი</th>
                    <th className="p-2.5">ტიპი</th>
                    <th className="p-2.5">ორბი</th>
                    <th className="p-2.5">ფაზა</th>
                    <th className="p-2.5">ინტერპრეტაცია</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedAspects.map((aspect, index) => (
                    <tr key={`${aspect.a}-${aspect.b}-${aspect.aspect}-${index}`} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-2.5 text-slate-400 tabular-nums">{index + 1}</td>
                      <td className="p-2.5 font-bold text-white">{rowButton(`${DISPLAY_NAMES[aspect.a] ?? aspect.a} ${aspect.aspectKa} ${DISPLAY_NAMES[aspect.b] ?? aspect.b}`, { type: "aspect", key: `${aspect.a}|${aspect.aspect}|${aspect.b}` })}</td>
                      <td className="p-2.5"><span className={aspect.kind === "major" ? "text-sky-300 font-bold" : "text-purple-300 font-semibold"}>{aspect.kind === "major" ? "მაჟორული" : "მინორული"}</span></td>
                      <td className="p-2.5 tabular-nums text-slate-300">{aspect.orb}°</td>
                      <td className="p-2.5 text-slate-300">{aspect.applying ? "მოახლოებადი" : "დაშორებადი"}</td>
                      <td className="p-2.5 text-slate-300 max-w-xs">{aspectMeaning(aspect)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <CombinedChartTable planets={planets} planetHouses={planetHouses} houseCusps={houseCusps} aspects={aspects} />

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-slate-300 backdrop-blur-md">
            <strong className="text-white">MC:</strong> {degreeLabel(mc)} · მაჟორული ხაზები ბორბალზე უწყვეტია, მინორული — წყვეტილი. ჩანაწერზე დაჭერით შესაბამის ინტერპრეტაციაზე გადახვალთ.
          </div>
        </div>
      )}
    </div>
  );
}
