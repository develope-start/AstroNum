import { ExternalLink, Library } from "lucide-react";
import { TEMPERAMENT_SOURCES } from "@/lib/elementTemperaments";

export default function ElementSources() {
  return (
    <section className="element-sources" aria-labelledby="element-sources-title">
      <div className="element-sources-heading">
        <Library className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        <div>
          <h4 id="element-sources-title">სტიქიებზე არსებული ინფორმაციები და წყაროები</h4>
          <p>დამატებითი მასალა სტიქიების, ტემპერამენტებისა და მათი ასტროლოგიური ინტერპრეტაციის შესახებ.</p>
        </div>
      </div>
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
    </section>
  );
}
