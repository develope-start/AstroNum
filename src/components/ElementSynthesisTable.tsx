import { Sparkles, ChevronDown } from "lucide-react";
import { ELEMENT_SYNTHESIS } from "@/lib/elementTemperaments";

export default function ElementSynthesisTable({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <details className="interpretation-accordion border-amber-500/20" open={defaultOpen}>
      <summary className="interpretation-accordion-summary p-3 sm:p-4">
        <span className="interpretation-accordion-icon">
          <Sparkles className="h-4 w-4 text-amber-300" />
        </span>
        <span className="interpretation-accordion-title text-amber-200 text-xs sm:text-base font-bold text-left">
          სტიქიათა ინტერაქციის (სინთეზის) ანალიზი
        </span>
        <ChevronDown className="interpretation-accordion-chevron h-4 w-4 shrink-0" />
      </summary>
      <div className="interpretation-accordion-body pt-2 pb-4 px-3 sm:px-4 text-left">
        <p className="mb-3 text-xs leading-relaxed text-slate-300">
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
      </div>
    </details>
  );
}
