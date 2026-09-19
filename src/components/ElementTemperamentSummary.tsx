import type { ElementTemperamentId } from "@/lib/elementTemperaments";
import { ELEMENT_TEMPERAMENTS } from "@/lib/elementTemperaments";

export default function ElementTemperamentSummary({ element }: { element: ElementTemperamentId }) {
  const guide = ELEMENT_TEMPERAMENTS[element];

  return (
    <>
      <span className="celestial-temperament-kicker">კლასიკური ტემპერამენტების მოდელი</span>
      <strong>{guide.temperament}</strong>
      <span className="celestial-temperament-lede">{guide.short}</span>
      <p>{guide.description}</p>
      <span className="celestial-temperament-note">ისტორიული ფსიქოლოგიური მოდელი — არა კლინიკური დიაგნოზი.</span>
    </>
  );
}
