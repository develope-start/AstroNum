import { ExternalLink, Library, ChevronDown } from "lucide-react";
import { TEMPERAMENT_SOURCES } from "@/lib/elementTemperaments";

export default function ElementSources({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <details className="interpretation-accordion border-amber-500/20" open={defaultOpen}>
      <summary className="interpretation-accordion-summary p-3 sm:p-4">
        <span className="interpretation-accordion-icon">
          <Library className="h-4 w-4 text-amber-300" />
        </span>
        <span className="interpretation-accordion-title text-amber-200 text-xs sm:text-base font-bold text-left">
          სტიქიებზე არსებული ინფორმაციები და წყაროები
        </span>
        <ChevronDown className="interpretation-accordion-chevron h-4 w-4 shrink-0" />
      </summary>
      <div className="interpretation-accordion-body pt-2 pb-4 px-3 sm:px-4 text-left">
        <p className="mb-3 text-xs leading-relaxed text-slate-300">
          დამატებითი მასალა სტიქიების, ტემპერამენტებისა და მათი ასტროლოგიური ინტერპრეტაციის შესახებ.
        </p>
        <ol className="element-sources-list">
          {TEMPERAMENT_SOURCES.map((source, index) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                <span>{index + 1}. {source.title}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
