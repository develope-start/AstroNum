import type { ElementTemperamentId } from "@/lib/elementTemperaments";
import { ELEMENT_TEMPERAMENTS } from "@/lib/elementTemperaments";

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

    </>
  );
}
