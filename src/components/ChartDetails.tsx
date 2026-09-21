"use client";

import { eclipticToSign, formatDegree, PLANET_NAMES_KA } from "@/lib/astro/signs";
import type { AspectHit } from "@/lib/astro/aspects";
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

function focus(target: { type: string; key: string }) {
  window.dispatchEvent(new CustomEvent("focus-interpretation", { detail: target }));
}

function degreeLabel(longitude: number) {
  const sign = eclipticToSign(longitude);
  return `${sign.signName} · ${formatDegree(sign.degreeInSign)}`;
}

function rowButton(label: string, target: { type: string; key: string }) {
  return <button type="button" onClick={() => focus(target)} className="chart-detail-link">{label}</button>;
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
  const tightAspects = aspects.slice().sort((a, b) => a.orb - b.orb).slice(0, 4);
  const uniqueStars = Array.from(new Set(fixedStars.map((item) => item.star)));

  return (
    <div className="chart-details mt-4 space-y-3 text-left">
      <section className="chart-summary-card rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-purple-950/30 to-slate-950/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-amber-300">ასტრო-რეზიუმე</p>
            <h3 className="mt-1 text-base font-extrabold text-slate-100 sm:text-lg">რუკის ყველაზე მნიშვნელოვანი კავშირები</h3>
          </div>
          <span className="rounded-full border border-slate-500/30 px-2.5 py-1 text-[0.68rem] font-bold text-slate-300">ASC {degreeLabel(ascendant)}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">ეს არის სწრაფი სურათი. პლანეტების, სახლებისა და ასპექტების სრულ განმარტებებზე გადასასვლელად დააჭირეთ შესაბამის ჩანაწერს ან ჩამოშალეთ რუკის დეტალები.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-500/20 bg-slate-950/35 p-3"><span className="block text-[0.68rem] text-slate-400">პოზიციები</span><strong className="mt-1 block text-sm text-amber-200">{planets.length} წერტილი</strong></div>
          <div className="rounded-xl border border-slate-500/20 bg-slate-950/35 p-3"><span className="block text-[0.68rem] text-slate-400">ასპექტები</span><strong className="mt-1 block text-sm text-sky-200">{aspects.length} კავშირი</strong></div>
          <div className="rounded-xl border border-slate-500/20 bg-slate-950/35 p-3"><span className="block text-[0.68rem] text-slate-400">ფიქსირებული ვარსკვლავები</span><strong className="mt-1 block text-sm text-yellow-200">{uniqueStars.length || "არცერთი"}</strong></div>
        </div>
        {tightAspects.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tightAspects.map((aspect) => <button key={`${aspect.a}-${aspect.b}-${aspect.aspect}`} type="button" onClick={() => focus({ type: "aspect", key: `${aspect.a}|${aspect.aspect}|${aspect.b}` })} className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-100 transition hover:border-sky-300">{DISPLAY_NAMES[aspect.a] ?? aspect.a} {aspect.aspectKa} {DISPLAY_NAMES[aspect.b] ?? aspect.b} · {aspect.orb}°</button>)}</div>}
      </section>

      <details className="chart-details-accordion">
        <summary><span>▾</span><strong>რუკის დეტალები</strong><small>პოზიციები, სახლები, ასპექტები და ვარსკვლავები</small></summary>
        <div className="space-y-3 p-3 sm:p-5">
          <details open className="chart-subsection"><summary>პლანეტები და დამატებითი წერტილები</summary><div className="chart-table-wrap"><table className="chart-data-table"><thead><tr><th>ობიექტი</th><th>ზოდიაქო / გრადუსი</th><th>სახლი</th></tr></thead><tbody>{planets.map((planet) => <tr key={planet.name}><td>{rowButton(DISPLAY_NAMES[planet.name] ?? planet.name, { type: "planet", key: planet.name })}</td><td>{degreeLabel(planet.longitude)}</td><td>{rowButton(`${planetHouses[planet.name] ?? "—"}`, { type: "house", key: String(planetHouses[planet.name] ?? "") })}</td></tr>)}</tbody></table></div></details>

          <details className="chart-subsection"><summary>12 სახლის კუსპიდები</summary><div className="chart-table-wrap"><table className="chart-data-table"><thead><tr><th>სახლი</th><th>დაწყება</th><th>თემა</th></tr></thead><tbody>{houseCusps.map((cusp, index) => <tr key={index}><td>{rowButton(`${index + 1}`, { type: "house", key: String(index + 1) })}</td><td>{degreeLabel(cusp)}</td><td>{HOUSE_NAMES[index]}</td></tr>)}</tbody></table></div></details>

          <details className="chart-subsection"><summary>მაჟორული და მინორული ასპექტები ({aspects.length})</summary><div className="chart-table-wrap"><table className="chart-data-table"><thead><tr><th>კავშირი</th><th>ტიპი</th><th>ორბი</th><th>ფაზა</th></tr></thead><tbody>{aspects.map((aspect, index) => <tr key={`${aspect.a}-${aspect.b}-${aspect.aspect}-${index}`}><td>{rowButton(`${DISPLAY_NAMES[aspect.a] ?? aspect.a} ${aspect.aspectKa} ${DISPLAY_NAMES[aspect.b] ?? aspect.b}`, { type: "aspect", key: `${aspect.a}|${aspect.aspect}|${aspect.b}` })}</td><td><span className={aspect.kind === "major" ? "chart-kind-major" : "chart-kind-minor"}>{aspect.kind === "major" ? "მაჟორული" : "მინორული"}</span></td><td>{aspect.orb}°</td><td>{aspect.applying ? "მოახლოებადი" : "დაშორებადი"}</td></tr>)}</tbody></table></div></details>

          <details className="chart-subsection"><summary>ფიქსირებული ვარსკვლავები {fixedStars.length ? `(${fixedStars.length})` : ""}</summary>{fixedStars.length ? <div className="chart-table-wrap"><table className="chart-data-table"><thead><tr><th>ვარსკვლავი</th><th>კონტაქტი</th><th>გრადუსი</th><th>ორბი</th></tr></thead><tbody>{fixedStars.map((star, index) => <tr key={`${star.star}-${star.planet}-${index}`}><td>{rowButton(star.star, { type: "star", key: star.star })}</td><td>{rowButton(DISPLAY_NAMES[star.planet] ?? star.planet, { type: "planet", key: star.planet })}</td><td>{degreeLabel(star.longitude)}</td><td>{star.orb}°</td></tr>)}</tbody></table></div> : <p className="px-2 pb-2 text-sm text-slate-400">ამ რუკაში შერჩეულ ფიქსირებულ ვარსკვლავებთან ზუსტი კონტაქტი არ დაფიქსირდა.</p>}</details>

          <div className="rounded-xl border border-slate-500/20 bg-slate-950/25 p-3 text-xs leading-relaxed text-slate-400">MC: {degreeLabel(mc)} · ასპექტის ხაზები: მაჟორული — უწყვეტი, მინორული — წყვეტილი. ცხრილში ნებისმიერ ჩანაწერზე დაჭერით შესაბამის განმარტებაზე გადახვალთ.</div>
        </div>
      </details>
    </div>
  );
}
