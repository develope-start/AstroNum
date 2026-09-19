import { ELEMENT_SYNTHESIS } from "@/lib/elementTemperaments";

export default function ElementSynthesisTable() {
  return (
    <section className="element-synthesis-section border-t border-amber-500/20 pt-4 text-left">
      <h4 className="mb-2 text-center font-display text-sm font-bold text-amber-200 sm:text-base">
        სტიქიათა ინტერაქციის (სინთეზის) ანალიზი
      </h4>
      <p className="mb-3 text-center text-xs leading-relaxed text-slate-300">
        პროფესიონალურ ასტროლოგიაში იშვიათია სუფთა ტიპაჟები. რეალური სიზუსტისთვის გამოიყენება სტიქიათა წყვილების ფორმულები:
      </p>
      <div className="grid gap-2 lg:grid-cols-2">
        {ELEMENT_SYNTHESIS.map((item) => (
          <article key={item.combination} className="rounded-xl border border-slate-700/60 bg-slate-950/35 p-3 text-xs leading-relaxed text-slate-200">
            <h5 className="font-bold text-amber-200">{item.combination} — {item.syndrome}</h5>
            <p className="mt-1 text-slate-300">{item.manifestation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
