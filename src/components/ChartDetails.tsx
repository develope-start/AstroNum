"use client";

import { Hand, Minus, Plus, RotateCw, Table2, X } from "lucide-react";
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
  return <button type="button" onClick={() => focus(target)} className="chart-detail-link chart-focus-source">{label}</button>;
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

  const rows = [
    ...planets.map((planet) => ({
      category: "პლანეტა",
      object: DISPLAY_NAMES[planet.name] ?? planet.name,
      position: degreeLabel(planet.longitude),
      house: planetHouses[planet.name] ? `${planetHouses[planet.name]}-ე სახლი` : "—",
      type: "—",
      orbit: "—",
      phase: "—",
      meaning: "რუკის გამოთვლილი მდებარეობა",
    })),
    ...houseCusps.map((cusp, index) => ({
      category: "სახლი",
      object: `${index + 1} სახლი`,
      position: degreeLabel(cusp),
      house: "—",
      type: "კუსპიდი",
      orbit: "—",
      phase: "—",
      meaning: HOUSE_NAMES[index] ?? "—",
    })),
    ...sortAspectsByInfluence(aspects).map((aspect) => ({
      category: "ასპექტი",
      object: `${DISPLAY_NAMES[aspect.a] ?? aspect.a} ${aspect.aspectKa} ${DISPLAY_NAMES[aspect.b] ?? aspect.b}`,
      position: "—",
      house: "—",
      type: aspect.kind === "major" ? "მაჟორული" : "მინორული",
      orbit: `${aspect.orb}°`,
      phase: aspect.applying ? "მოახლოებადი" : "დაშორებადი",
      meaning: aspectMeaning(aspect),
    })),
  ];

  const tableImage = (
    <div className="combined-chart-table-modal" role="dialog" aria-modal="true" aria-label="პლანეტების, სახლებისა და ასპექტების სრული ცხრილი">
      <div className="combined-chart-table-header">
        <div className="min-w-0">
          <p className="combined-chart-table-kicker">რუკის სრული მონაცემები</p>
          <h2>სრული ცხრილი</h2>
        </div>
        <button type="button" className="combined-chart-table-close" onClick={() => setOpen(false)} aria-label="ცხრილის დახურვა" title="დახურვა">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="combined-chart-table-tools" aria-label="ცხრილის მართვა">
        <button type="button" onClick={() => setRotated((value) => !value)} aria-pressed={rotated} className="combined-chart-table-tool combined-chart-table-rotate">
          <RotateCw className="h-4 w-4" />
          <span>ამოაბრუნეთ</span>
        </button>
        <div className="combined-chart-table-zoom" aria-label="ცხრილის ზომა">
          <button type="button" onClick={() => setZoom((value) => Math.max(0.65, Number((value - 0.15).toFixed(2))))} aria-label="დაპატარავება" title="დაპატარავება"><Minus className="h-4 w-4" /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.15).toFixed(2))))} aria-label="გადიდება" title="გადიდება"><Plus className="h-4 w-4" /></button>
        </div>
      </div>

      <div className={`combined-chart-table-stage ${rotated ? "is-rotated" : ""}`}>
        <div className="combined-chart-table-sheet" style={{ transform: `rotate(${rotated ? 90 : 0}deg) scale(${zoom})` }}>
          <div className="combined-chart-table-sheet-caption">ცხრილი · {rows.length} ჩანაწერი</div>
          <table>
            <thead>
              <tr><th>კატეგორია</th><th>ობიექტი / კავშირი</th><th>ნიშანი / გრადუსი</th><th>სახლი</th><th>ტიპი</th><th>ორბი</th><th>ფაზა</th><th>მოკლე ინტერპრეტაცია</th></tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.category}-${row.object}-${index}`}>
                  <td data-label="კატეგორია">{row.category}</td>
                  <td data-label="ობიექტი / კავშირი">{row.object}</td>
                  <td data-label="ნიშანი / გრადუსი">{row.position}</td>
                  <td data-label="სახლი">{row.house}</td>
                  <td data-label="ტიპი">{row.type}</td>
                  <td data-label="ორბი">{row.orbit}</td>
                  <td data-label="ფაზა">{row.phase}</td>
                  <td data-label="მოკლე ინტერპრეტაცია">{row.meaning}</td>
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
      <button type="button" className="combined-chart-table-launch" onClick={() => { setOpen(true); setZoom(1); }}>
        <Table2 className="h-4 w-4" />
        <span>სრული ცხრილი</span>
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
    <div className="chart-details mt-4 space-y-3 text-left">
      <section className="chart-summary-card rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-800/25 via-slate-950/45 to-indigo-950/25 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">შემაჯამებელი ასტრო-რეზიუმე</p>
            <h3 className="mt-1 text-base font-extrabold text-slate-100 sm:text-lg">რუკის მთავარი სურათი</h3>
          </div>
          <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-[0.68rem] font-bold text-slate-200">ASC · {degreeLabel(ascendant)}</span>
        </div>

        <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-200">
          {summary.map((paragraph, index) => <p key={index}><strong className="text-slate-100">{["ძირითადი ტონი", "განვითარების ღერძი", "დამატებითი ფენა", "კავშირების სურათი"][index]}:</strong> {paragraph}</p>)}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-400">რუკა აერთიანებს {aspects.length} ასპექტურ კავშირს, {planets.length} გამოთვლილ წერტილს და {uniqueStars.length} აქტიურ ფიქსირებულ ვარსკვლავს.</p>

        {tightAspects.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tightAspects.map((aspect) => <button key={`${aspect.a}-${aspect.b}-${aspect.aspect}`} type="button" onClick={() => focus({ type: "aspect", key: `${aspect.a}|${aspect.aspect}|${aspect.b}` })} className="chart-focus-source rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-100 transition hover:border-sky-300">{DISPLAY_NAMES[aspect.a] ?? aspect.a} {aspect.aspectKa} {DISPLAY_NAMES[aspect.b] ?? aspect.b} · {aspect.orb}°</button>)}</div>}
        <div className="chart-details-jump mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-base font-extrabold transition">
          <Hand className="chart-details-jump-icon h-4 w-4 shrink-0" aria-hidden="true" />
          <button
            type="button"
            aria-expanded={detailsOpen}
            aria-controls="chart-details-accordion"
            onClick={() => {
              const next = !detailsOpen;
              setDetailsOpen(next);
              if (next) window.setTimeout(() => document.getElementById("chart-details-accordion")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
            }}
            className="chart-details-jump-label"
          >
            გამოთვლილი მნიშვნელობების ნახვა
          </button>
        </div>
      </section>

      {detailsOpen && <div id="chart-details-accordion" className="chart-details-accordion">
        <div className="space-y-3 p-3 sm:p-5">
          <details className="chart-subsection"><summary>პლანეტები და დამატებითი წერტილები</summary><div className="chart-table-wrap"><table className="chart-data-table"><thead><tr><th>ობიექტი</th><th>ზოდიაქო / გრადუსი</th><th>სახლი</th></tr></thead><tbody>{planets.map((planet) => <tr key={planet.name}><td data-label="ობიექტი">{rowButton(DISPLAY_NAMES[planet.name] ?? planet.name, { type: "planet", key: planet.name })}</td><td data-label="ზოდიაქო / გრადუსი">{degreeLabel(planet.longitude)}</td><td data-label="სახლი">{rowButton(`${planetHouses[planet.name] ?? "—"}`, { type: "house", key: String(planetHouses[planet.name] ?? "") })}</td></tr>)}</tbody></table></div></details>

          <details className="chart-subsection"><summary>12 სახლის კუსპიდები</summary><div className="chart-table-wrap"><table className="chart-data-table"><thead><tr><th>სახლი</th><th>დაწყება</th><th>თემა</th></tr></thead><tbody>{houseCusps.map((cusp, index) => <tr key={index}><td data-label="სახლი">{rowButton(`${index + 1}`, { type: "house", key: String(index + 1) })}</td><td data-label="დაწყება">{degreeLabel(cusp)}</td><td data-label="თემა">{HOUSE_NAMES[index]}</td></tr>)}</tbody></table></div></details>

          <details className="chart-subsection"><summary>მაჟორული და მინორული ასპექტები ({aspects.length})</summary><div className="chart-table-wrap"><table className="chart-data-table chart-aspect-table"><thead><tr><th>#</th><th>კავშირი</th><th>ტიპი</th><th>ორბი</th><th>ფაზა</th><th>მოკლე ინტერპრეტაცია</th></tr></thead><tbody>{orderedAspects.map((aspect, index) => <tr key={`${aspect.a}-${aspect.b}-${aspect.aspect}-${index}`}><td data-label="#" className="chart-aspect-rank">{index + 1}</td><td data-label="კავშირი">{rowButton(`${DISPLAY_NAMES[aspect.a] ?? aspect.a} ${aspect.aspectKa} ${DISPLAY_NAMES[aspect.b] ?? aspect.b}`, { type: "aspect", key: `${aspect.a}|${aspect.aspect}|${aspect.b}` })}</td><td data-label="ტიპი"><span className={aspect.kind === "major" ? "chart-kind-major" : "chart-kind-minor"}>{aspect.kind === "major" ? "მაჟორული" : "მინორული"}</span></td><td data-label="ორბი">{aspect.orb}°</td><td data-label="ფაზა">{aspect.applying ? "მოახლოებადი" : "დაშორებადი"}</td><td data-label="მოკლე ინტერპრეტაცია" className="chart-aspect-interpretation">{aspectMeaning(aspect)}</td></tr>)}</tbody></table></div></details>

          <details className="chart-subsection"><summary>ფიქსირებული ვარსკვლავები {fixedStars.length ? `(${fixedStars.length})` : ""}</summary>{fixedStars.length ? <div className="chart-table-wrap"><table className="chart-data-table"><thead><tr><th>ვარსკვლავი</th><th>კონტაქტი</th><th>გრადუსი</th><th>ორბი</th></tr></thead><tbody>{fixedStars.map((star, index) => <tr key={`${star.star}-${star.planet}-${index}`}><td data-label="ვარსკვლავი">{rowButton(star.star, { type: "star", key: star.star })}</td><td data-label="კონტაქტი">{rowButton(DISPLAY_NAMES[star.planet] ?? star.planet, { type: "planet", key: star.planet })}</td><td data-label="გრადუსი">{degreeLabel(star.longitude)}</td><td data-label="ორბი">{star.orb}°</td></tr>)}</tbody></table></div> : <p className="px-2 pb-2 text-sm text-slate-400">ამ რუკაში შერჩეულ ფიქსირებულ ვარსკვლავებთან ზუსტი კონტაქტი არ დაფიქსირდა.</p>}</details>

          <CombinedChartTable planets={planets} planetHouses={planetHouses} houseCusps={houseCusps} aspects={aspects} />

          <div className="rounded-xl border border-slate-500/20 bg-slate-950/25 p-3 text-xs leading-relaxed text-slate-400">MC: {degreeLabel(mc)} · მაჟორული ხაზები ბორბალზე უწყვეტია, მინორული — წყვეტილი. ჩანაწერზე დაჭერით შესაბამის ინტერპრეტაციაზე გადახვალთ.</div>
        </div>
      </div>}
    </div>
  );
}
