import { createHash } from "node:crypto";
import type { AspectHit } from "@/lib/astro/aspects";
import type { PlanetPosition } from "@/lib/astro/positions";
import { eclipticToSign, PLANET_NAMES_KA } from "@/lib/astro/signs";

export const INTERPRETATION_LIBRARY_VERSION = "2026.09.18.1";

const PLANET_THEMES: Record<string, string> = {
  Sun: "იდენტობა, ნებისყოფა და საკუთარი გზის შექმნა",
  Moon: "ემოციური უსაფრთხოება, ჩვევები და შინაგანი რეაქციები",
  Mercury: "აზროვნება, სწავლა და კომუნიკაციის სტილი",
  Venus: "სიყვარული, ღირებულებები, გემოვნება და ურთიერთგაცვლა",
  Mars: "ინიციატივა, სურვილი, საზღვრები და მოქმედების ტემპი",
  Jupiter: "ზრდა, რწმენა, ცოდნა და შესაძლებლობების გაფართოება",
  Saturn: "პასუხისმგებლობა, სტრუქტურა, დისციპლინა და გამოცდები",
  Uranus: "თავისუფლება, მოულოდნელი ცვლილება და ინდივიდუალობა",
  Neptune: "წარმოსახვა, თანაგრძნობა, ინტუიცია და იდეალიზაცია",
  Pluto: "ღრმა ტრანსფორმაცია, ძალა და ფსიქოლოგიური განახლება",
  TrueNode: "განვითარების მიმართულება და ახალი გამოცდილებისკენ მოძრაობა",
  MeanNode: "განვითარების მიმართულება და განმეორებადი ცხოვრებისეული თემები",
  Chiron: "მტკივნეული გამოცდილების გააზრება და სამკურნალო პოტენციალი",
  Ceres: "ზრუნვა, კვება, მიჯაჭვულობა და დანაკარგის გადამუშავება",
  Pallas: "სტრატეგიული აზროვნება, ნიმუშების დანახვა და შემოქმედებითი გადაწყვეტა",
  Juno: "ერთგულება, თანასწორობა და პარტნიორული შეთანხმებები",
  Vesta: "ერთგულება, შინაგანი კონცენტრაცია და საქმისადმი მიძღვნა",
};

const HOUSE_THEMES = [
  "პიროვნულ იმიჯსა და თვითგამოხატვაში",
  "ფინანსებში, რესურსებსა და თვითღირებულების განცდაში",
  "სწავლაში, საუბარში, წერასა და ახლო გარემოსთან კავშირში",
  "ოჯახში, ფესვებში, სახლში და ემოციურ საყრდენში",
  "შემოქმედებაში, სიყვარულში, სიამოვნებასა და საკუთარი უნიკალურობის ჩვენებაში",
  "ყოველდღიურ შრომაში, ჯანმრთელობასა და პრაქტიკულ ჩვევებში",
  "პარტნიორობაში, შეთანხმებებსა და ღია დაპირისპირებაში",
  "ნდობაში, საერთო რესურსებსა და ფსიქოლოგიურ გარდაქმნაში",
  "მსოფლმხედველობაში, უმაღლეს ცოდნასა და შორეულ ჰორიზონტებში",
  "კარიერაში, სტატუსსა და საზოგადოებრივ პასუხისმგებლობაში",
  "მეგობრობაში, ჯგუფებში, სამომავლო მიზნებსა და საზოგადოებრივ წრეში",
  "ქვეცნობიერში, განმარტოებაში, სულიერ ძიებასა და უხილავ პროცესებში",
];

const ASPECT_MEANINGS: Record<string, string> = {
  Conjunction: "ენერგიები ერთ წერტილში იკრიბება და შესაბამის თემას განსაკუთრებით ძლიერად აჩენს.",
  Sextile: "იქმნება შესაძლებლობა, რომელიც გაცნობიერებულ მოქმედებასა და თანამშრომლობას მოითხოვს.",
  Square: "ჩნდება დაძაბულობა; მისი დამუშავება ზრდას, საზღვრების გადახედვასა და მოქმედების შეცვლას მოითხოვს.",
  Trine: "ენერგიები ბუნებრივად თანამშრომლობს და ნიჭის ან მხარდაჭერის სახით ადვილად ვლინდება.",
  Opposition: "ორი პოლუსი ერთმანეთის სარკედ მუშაობს და ბალანსის პოვნას მოითხოვს.",
};

export interface LibraryInsight {
  key: string;
  chartType: "NATAL" | "SYNASTRY" | "TRANSIT";
  language: "ka";
  text: string;
  sourceUrl: null;
  license: "original";
  fingerprint: string;
}

function insight(key: string, chartType: LibraryInsight["chartType"], text: string): LibraryInsight {
  const fingerprint = createHash("sha256").update(`${INTERPRETATION_LIBRARY_VERSION}\0ka\0${text.trim()}`).digest("hex");
  return { key, chartType, language: "ka", text, sourceUrl: null, license: "original", fingerprint };
}

export function natalLibraryInsights(
  planets: PlanetPosition[],
  aspects: AspectHit[],
  houseOfFn: (longitude: number) => number,
): LibraryInsight[] {
  const entries: LibraryInsight[] = [];
  for (const planet of planets) {
    const house = houseOfFn(planet.longitude);
    const sign = eclipticToSign(planet.longitude).signName;
    const name = PLANET_NAMES_KA[planet.name] ?? planet.name;
    const theme = PLANET_THEMES[planet.name] ?? "ცხოვრების მნიშვნელოვანი თემა";
    entries.push(insight(
      `natal.placement.${planet.name}.${house}.${Math.floor(planet.longitude / 30)}`,
      "NATAL",
      `${name} ${sign}-ში და ${house}-ე სახლში აერთიანებს ${theme}-ს ${HOUSE_THEMES[house - 1] ?? "ცხოვრების არჩეულ სფეროში"}. ეს მდებარეობა ერთმნიშვნელოვან განაჩენს არ წარმოადგენს: მისი ნაყოფიერი გამოვლენა დამოკიდებულია ცნობიერ არჩევანზე, გარემოებებსა და მთელ რუკასთან კავშირზე.`,
    ));
  }
  for (const aspect of [...aspects].sort((a, b) => a.orb - b.orb).slice(0, 20)) {
    const a = PLANET_NAMES_KA[aspect.a] ?? aspect.a;
    const b = PLANET_NAMES_KA[aspect.b] ?? aspect.b;
    const meaning = ASPECT_MEANINGS[aspect.aspect] ?? "ასპექტი ამ ორ ფუნქციას ერთმანეთთან აკავშირებს.";
    entries.push(insight(
      `natal.aspect.${aspect.a}.${aspect.b}.${aspect.aspect}`,
      "NATAL",
      `${a}–${b}-ის ${aspect.aspectKa} (ორბი ${aspect.orb}°) აერთიანებს ${PLANET_THEMES[aspect.a] ?? aspect.a}-სა და ${PLANET_THEMES[aspect.b] ?? aspect.b}-ს. ${meaning} ${aspect.applying ? "ასპექტი უახლოვდება ზუსტ ფაზას." : "ასპექტი დაშორების ფაზაშია და მისი გამოცდილება უკვე დამუშავებულ თემას ჰგავს."}`,
    ));
  }
  return entries;
}

export function aspectLibraryInsight(aspect: AspectHit, chartType: "SYNASTRY" | "TRANSIT"): LibraryInsight {
  const a = PLANET_NAMES_KA[aspect.a] ?? aspect.a;
  const b = PLANET_NAMES_KA[aspect.b] ?? aspect.b;
  const meaning = ASPECT_MEANINGS[aspect.aspect] ?? "ასპექტი ამ ორ ფუნქციას ერთმანეთთან აკავშირებს.";
  const context = chartType === "TRANSIT" ? "ტრანზიტული მოძრაობა ნატალურ პოტენციალს ააქტიურებს" : "ორი ადამიანის რუკებს შორის ეს კავშირი ურთიერთქმედებას აჩვენებს";
  return insight(
    `${chartType.toLowerCase()}.aspect.${aspect.a}.${aspect.b}.${aspect.aspect}`,
    chartType,
    `${context}: ${a} და ${b} ქმნის ${aspect.aspectKa}-ს (ორბი ${aspect.orb}°). ${meaning} ${aspect.applying ? "მიმდინარე ტენდენცია ძლიერდება." : "თემა უფრო გამოცდილებისა და უკვე დაწყებული პროცესის გადამუშავებას უკავშირდება."}`,
  );
}

export function dedupeInsights(entries: LibraryInsight[]): LibraryInsight[] {
  return entries.filter((entry, index, all) => all.findIndex((candidate) => candidate.fingerprint === entry.fingerprint) === index);
}
