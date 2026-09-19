import type { ElementTemperamentId } from "@/lib/elementTemperaments";
import { ELEMENT_TEMPERAMENTS, TEMPERAMENT_SOURCES } from "@/lib/elementTemperaments";

export default function ElementTemperamentDetails({
  element,
  showTitle = true,
}: {
  element: ElementTemperamentId;
  showTitle?: boolean;
}) {
  const guide = ELEMENT_TEMPERAMENTS[element];

  return (
    <>
      {showTitle && (
        <>
          <span className="celestial-temperament-kicker">ფსიქო-ასტროლოგიური ინტერპრეტაცია</span>
          <strong>{guide.icon} {guide.title}</strong>
        </>
      )}

      <div className="element-temperament-facts">
        <p><strong>ზოდიაქოს ნიშნები:</strong> {guide.signs}.</p>
        <p><strong>ასტროლოგიური თვისებები:</strong> {guide.qualities}.</p>
      </div>

      <section className="element-temperament-section">
        <h6>ფსიქოლოგიური სუბსტრატი</h6>
        <p>{guide.psychologicalSubstrate}</p>
      </section>

      <section className="element-temperament-section">
        <h6>ასტროლოგიური კონვერტაცია და სიმბიოზი</h6>
        <p>{guide.astrologicalConversion}</p>
      </section>

      <section className="element-temperament-section">
        <h6>ნეგატიური ასპექტი</h6>
        <p>{guide.negativeAspect}</p>
      </section>

      <section className="element-temperament-sources">
        <h6>ზოგადი სტიქიების განმარტებები და წყაროები</h6>
        <ul>
          {TEMPERAMENT_SOURCES.map((source, index) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {index + 1}. {source.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
