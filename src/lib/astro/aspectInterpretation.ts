import type { AspectHit } from "./aspects";

const ASPECT_MEANINGS: Record<string, string> = {
  Conjunction: "ორი ენერგია ერთ წერტილში იყრის თავს და ამ თემას განსაკუთრებით ძლიერად ამუშავებს.",
  Sextile: "იქმნება შესაძლებლობა, რომელიც გაცნობიერებულ მოქმედებასა და თანამშრომლობას მოითხოვს.",
  Square: "ჩნდება დაძაბულობა, რომელიც ზრდისკენ, საზღვრების გადახედვისა და მოქმედების შეცვლისკენ გიბიძგებთ.",
  Trine: "ენერგიები ბუნებრივად თანამშრომლობს და ნიჭის ან მხარდაჭერის სახით შედარებით მარტივად ვლინდება.",
  Opposition: "ორი პოლუსი ერთმანეთის სარკედ მუშაობს და ბალანსის პოვნას მოითხოვს.",
  SemiSextile: "ორი განსხვავებული თემა ახლოს დგას და მცირე, მაგრამ მუდმივ მორგებას საჭიროებს.",
  SemiSquare: "მსუბუქი, განმეორებადი ხახუნია, რომელიც ყურადღებასა და მცირე კორექციას ითხოვს.",
  Quintile: "კავშირი შემოქმედებით ნიჭს, ორიგინალურ გადაწყვეტასა და უნარის განვითარებას აძლიერებს.",
  Sesquiquadrate: "დაგროვილი დაძაბულობა მოქმედების შეცვლას და შინაგანი წნეხის გაცნობიერებას მოითხოვს.",
  Biquintile: "ორი ფუნქცია ერთმანეთის გაძლიერებით განსაკუთრებულ შემოქმედებით ან ინტუიციურ უნარს ქმნის.",
  Quincunx: "ორი განსხვავებული სფერო სრულ მორგებას, ჩვევების შეცვლასა და მოქნილობას მოითხოვს.",
};

export function aspectMeaning(aspect: AspectHit): string {
  const phase = aspect.applying ? "კავშირი ჯერ ძლიერდება" : "კავშირი უკვე დაშორების ფაზაშია";
  return `${ASPECT_MEANINGS[aspect.aspect] ?? "ეს ასპექტი ორ ფუნქციას ერთმანეთთან აკავშირებს."} ${phase}.`;
}

export function sortAspectsByInfluence(aspects: AspectHit[]): AspectHit[] {
  // Major aspects carry the primary structural influence. Within each class,
  // the smallest orb is the strongest and therefore appears first.
  return [...aspects].sort((a, b) =>
    (a.kind === b.kind ? 0 : a.kind === "major" ? -1 : 1) ||
    a.orb - b.orb,
  );
}
