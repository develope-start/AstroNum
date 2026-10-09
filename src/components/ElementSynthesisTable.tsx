import { Sparkles, ChevronDown } from "lucide-react";
import { ELEMENT_SYNTHESIS } from "@/lib/elementTemperaments";

export default function ElementSynthesisTable({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <details className="interpretation-accordion border border-white/10 bg-white/[0.02] rounded-2xl overflow-hidden shadow-inner" open={defaultOpen}>
      <summary className="interpretation-accordion-summary p-3 sm:p-4 cursor-pointer">
        <span className="interpretation-accordion-icon flex h-7 w-7 items-center justify-center rounded-xl border border-pink-400/30 bg-pink-500/15 text-pink-300">
          <Sparkles className="h-4 w-4 text-pink-300" />
        </span>
        <span className="interpretation-accordion-title text-pink-200 text-xs sm:text-base font-bold text-left">
          სტიქიათა ინტერაქციის (სინთეზის) ანალიზი
        </span>
        <ChevronDown className="interpretation-accordion-chevron h-4 w-4 text-pink-300 shrink-0" />
      </summary>
      <div className="interpretation-accordion-body pt-2 pb-4 px-3 sm:px-4 text-left border-t border-white/10">
        <p className="mb-3 text-xs leading-relaxed text-slate-300">
          პროფესიონალურ ასტროლოგიაში იშვიათია სუფთა ტიპაჟები. რეალური სიზუსტისთვის გამოიყენება სტიქიათა წყვილების ფორმულები:
        </p>
        <div className="grid gap-2.5 lg:grid-cols-2">
          {ELEMENT_SYNTHESIS.map((item) => (
            <article key={item.combination} className="rounded-xl border border-white/10 bg-[#070914] p-3 text-xs leading-relaxed text-slate-200">
              <h5 className="font-bold text-pink-300">{item.combination} — {item.syndrome}</h5>
              <p className="mt-1 text-slate-300/80">{item.manifestation}</p>
            </article>
          ))}
        </div>
      </div>
    </details>
  );
}
