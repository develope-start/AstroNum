import { ExternalLink, Library, ChevronDown } from "lucide-react";
import { TEMPERAMENT_SOURCES } from "@/lib/elementTemperaments";

export default function ElementSources({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <details className="interpretation-accordion border border-white/10 bg-white/[0.02] rounded-2xl overflow-hidden shadow-inner" open={defaultOpen}>
      <summary className="interpretation-accordion-summary p-3 sm:p-4 cursor-pointer">
        <span className="interpretation-accordion-icon flex h-7 w-7 items-center justify-center rounded-xl border border-slate-400/30 bg-slate-500/15 text-slate-300">
          <Library className="h-4 w-4 text-slate-300" />
        </span>
        <span className="interpretation-accordion-title text-slate-200 text-xs sm:text-base font-bold text-left">
          სტიქიებზე არსებული ინფორმაციები და წყაროები
        </span>
        <ChevronDown className="interpretation-accordion-chevron h-4 w-4 text-slate-400 shrink-0" />
      </summary>
      <div className="interpretation-accordion-body pt-2 pb-4 px-3 sm:px-4 text-left border-t border-white/10">
        <p className="mb-3 text-xs leading-relaxed text-slate-300">
          დამატებითი მასალა სტიქიების, ტემპერამენტებისა და მათი ასტროლოგიური ინტერპრეტაციის შესახებ.
        </p>
        <ol className="element-sources-list space-y-1.5 text-xs">
          {TEMPERAMENT_SOURCES.map((source, index) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 p-2 rounded-xl border border-white/5 bg-[#070914] text-slate-300 hover:text-sky-300 hover:border-sky-400/30 transition-all">
                <span>{index + 1}. {source.title}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
