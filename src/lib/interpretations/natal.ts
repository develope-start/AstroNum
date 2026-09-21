import { PlanetPosition } from "@/lib/astro/positions";
import { AspectHit } from "@/lib/astro/aspects";
import { eclipticToSign, formatDegree, HOUSE_LABELS_KA, PLANET_NAMES_KA } from "@/lib/astro/signs";
import { aspectLibraryInsight, dedupeInsights, natalLibraryInsights } from "./library";
import type { SecondaryProgressionResult } from "@/lib/astro/progressions";
import type { AngularityResult, DeclinationContact, DignityResult, FixedStarContact } from "@/lib/astro/advanced";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";

const PLANET_MEANING_KA: Record<string, string> = {
  Sun: "იდენტობა და ნებისყოფა",
  Moon: "ემოციური სამყარო და შინაგანი საჭიროებები",
  Mercury: "აზროვნების წესი და კომუნიკაცია",
  Venus: "სიყვარულისა და ღირებულებების სამყარო",
  Mars: "მოქმედების სტილი და ენერგია",
  Jupiter: "ზრდისა და რწმენების მიმართულება",
  Saturn: "პასუხისმგებლობისა და თვითდისციპლინის ველი",
  Uranus: "დამოუკიდებლობისა და ცვლილებისადმი მიდრეკილება",
  Neptune: "ინტუიცია და წარმოსახვითი სამყარო",
  Pluto: "სიღრმისეული გარდაქმნის ძალა",
  TrueNode: "განვითარების მთავარი მიმართულება",
  MeanNode: "განვითარების მთავარი მიმართულება",
  SouthNode: "ნაცნობი გამოცდილება, წარსული ჩვევები და საყრდენი რესურსი",
};

PLANET_MEANING_KA.Chiron = "ძველ მგრძნობიარე გამოცდილებას და იმ უნარს აჩვენებს, რომლითაც ადამიანი სხვასაც ეხმარება";
PLANET_MEANING_KA.Lilith = "დაუმუშავებელ სურვილებს, ტაბუებს, უარყოფილ ძალას და საკუთარი საზღვრების დაცვის საჭიროებას აჩვენებს";
PLANET_MEANING_KA.Selena = "შინაგან მხარდაჭერას, კეთილგანწყობილ რესურსს და იმ ღირებულებებს აჩვენებს, რომელთა ერთგულებაც გაძლიერებთ";

const SIGN_QUALITY_KA: Record<string, string> = {
  ვერძი: "პირდაპირ, სწრაფად და ინიციატივით",
  კურო: "მდგრადად, საფუძვლიანად და მოთმინებით",
  ტყუპები: "მოქნილად, ცნობისმოყვარეობითა და მრავალფეროვნებით",
  კირჩხიბი: "სენსიტიურად, დამცავად და ღრმა ემოციურობით",
  ლომი: "თავდაჯერებულად, გულუხვად და გამომსახველობით",
  ქალწული: "ზუსტად, ანალიტიკურად და პრაქტიკულად",
  სასწორი: "დაბალანსებულად, ურთიერთობებზე ორიენტირებით",
  მორიელი: "ინტენსიურად, სიღრმისეულად, კონტროლისკენ მიდრეკილებით",
  მშვილდოსანი: "ფართო ხედვით, ოპტიმისტურად და თავისუფლებისკენ სწრაფვით",
  "თხის რქა": "დისციპლინითა და გრძელვადიან მიზნებზე ორიენტირებით",
  მერწყული: "დამოუკიდებლად, არაორდინალურად, საზოგადოებრივი აზროვნებით",
  თევზები: "ინტუიციურად, თანაგრძნობითა და ზღვრების დნობით",
};

const HOUSE_THEME_KA = [
  "საკუთარ თავსა და გარეგან იმიჯში",
  "ფინანსებსა და პირად ღირებულებებში",
  "ყოველდღიურ ურთიერთობებსა და სწავლაში",
  "ოჯახსა და შინაურ საფუძველში",
  "შემოქმედებით გამოხატვასა და სიყვარულში",
  "სამუშაო რუტინასა და ჯანმრთელობაში",
  "პარტნიორობასა და ღია ურთიერთობებში",
  "საერთო რესურსებსა და სიღრმისეულ ცვლილებებში",
  "მსოფლმხედველობასა და შორეულ გეგმებში",
  "კარიერასა და საზოგადოებრივ სტატუსში",
  "მეგობრობასა და საერთო მიზნებში",
  "შინაგან სამყაროსა და განმარტოებაში",
];

interface PlacementInput {
  planets: PlanetPosition[];
  houseCusps: number[];
  ascendant: number;
  mc: number;
  aspects: AspectHit[];
  houseOfFn: (lon: number) => number;
  advanced?: {
    dignities: DignityResult[];
    angularity: AngularityResult[];
    declinationContacts: DeclinationContact[];
    fixedStarContacts: FixedStarContact[];
  };
}

function planetLine(p: PlanetPosition, houseNum: number): string {
  const { signName, degreeInSign } = eclipticToSign(p.longitude);
  const nameKa = PLANET_NAMES_KA[p.name] ?? p.name;
  const meaning = PLANET_MEANING_KA[p.name] ?? "გავლენა";
  const quality = SIGN_QUALITY_KA[signName] ?? "";
  const theme = HOUSE_THEME_KA[houseNum - 1];
  // კვანძისთვის "რეტროგრადულობა" ჩვეულებრივი და მუდმივი მდგომარეობაა, ამიტომ არ აღვნიშნავთ
  const retro = p.retrograde && p.name !== "TrueNode" && p.name !== "MeanNode" ? " (რეტროგრადული — ეს თემა უფრო შინაგანად, გადამუშავებით ვლინდება)" : "";

  return `**${nameKa}** ${signName}-ში (${formatDegree(degreeInSign)}), ${houseNum}-ე სახლში${retro}. თქვენი ${meaning} ვლინდება ${quality}, უპირატესად ${theme}.`;
}

function aspectLine(hit: AspectHit, planets?: PlanetPosition[], houseOfFn?: (lon: number) => number): string {
  const a = PLANET_NAMES_KA[hit.a] ?? hit.a;
  const b = PLANET_NAMES_KA[hit.b] ?? hit.b;
  const aPoint = planets?.find((planet) => planet.name === hit.a);
  const bPoint = planets?.find((planet) => planet.name === hit.b);
  const placement = (point: PlanetPosition | undefined) => point && houseOfFn
    ? ` (${eclipticToSign(point.longitude).signName}, ${houseOfFn(point.longitude)}-ე სახლი)`
    : "";
  const strength = hit.orb <= 1 ? "ზუსტად" : hit.orb <= 3 ? "ძლიერად" : "უფრო ფართო ორბით";
  const phase = hit.applying ? "მოახლოების ფაზაშია" : "დაშორების ფაზაშია";
  const tone =
    hit.aspect === "Trine" || hit.aspect === "Sextile"
      ? "ეს ურთიერთობა ბუნებრივად, თითქმის შეუმჩნევლად მუშაობს თქვენს სასარგებლოდ"
      : hit.aspect === "Opposition"
      ? "ეს არის შინაგანი დაძაბულობა ორ პოლუსს შორის, რომელიც ბალანსის ძიებას მოითხოვს"
      : hit.aspect === "Square"
      ? "ეს არის შინაგანი ხახუნი, რომელიც ზრდის მამოძრავებელი ძალაა, თუ შეგნებულად გაუმკლავდებით"
      : "ეს ორი ძალა ერთმანეთში ირევა და ერთ თემად ერწყმის თქვენს ხასიათს";

  return `${a}${placement(aPoint)} — ${hit.aspectKa} — ${b}${placement(bPoint)} (ორბი ${hit.orb}°, ${strength}; ${phase}). ${tone}.`;
}

function methodNote(): string {
  return "ეს ტექსტი აგებულია გამოთვლილი პოზიციების, სახლებისა და ასპექტების მიხედვით. ორბი მიუთითებს ასპექტის სიზუსტეს, ხოლო applying/separating — მოძრაობის ფაზას. ინტერპრეტაცია არის სიმბოლური, შემოწმებადი წესების მიხედვით შედგენილი ანალიზი და არა გარანტირებული წინასწარმეტყველება ან სამედიცინო/ფინანსური დიაგნოზი.";
}

const DIGNITY_LABELS: Record<string, string> = {
  domicile: "საკუთარ მმართველობაში",
  exaltation: "ეგზალტაციაში",
  detriment: "დეტრიმენტში",
  fall: "დაცემაში",
  peregrine: "პერეგრინული მდგომარეობა",
  not_classified: "კლასიკური ღირსებით არ ფასდება",
};

const ANGLE_LABELS: Record<string, string> = { ASC: "ასცენდენტთან", MC: "MC-სთან", DSC: "დაღმავალთან", IC: "IC-სთან" };

function advancedAnalysisLines(advanced: PlacementInput["advanced"]): string[] {
  if (!advanced) return [];
  const lines: string[] = ["## ტექნიკური სინთეზი — ღირსებები, კუთხეები და დეკლინაციები"];
  const dignityLines = advanced.dignities
    .filter((item) => item.status !== "not_classified")
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => {
      const name = PLANET_NAMES_KA[item.planet] ?? item.planet;
      const chain = item.dispositorChain.map((planet) => PLANET_NAMES_KA[planet] ?? planet).join(" → ");
      return `**${name}** — ${DIGNITY_LABELS[item.status]} (ქულა ${item.score}); დისპოზიტორთა ჯაჭვი: ${chain}${item.dispositorCycle ? " — ციკლი" : ""}.`;
    });
  if (dignityLines.length) lines.push("### ტრადიციული ღირსებები და დისპოზიტორები", ...dignityLines);

  const angularLines = advanced.angularity
    .filter((item) => item.angle)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8)
    .map((item) => `${PLANET_NAMES_KA[item.planet] ?? item.planet} ${ANGLE_LABELS[item.angle ?? ""] ?? item.angle} — ${item.distance}° (${item.strength === "exact" ? "ზუსტი კუთხურობა" : "კუთხური მდებარეობა"}).`);
  if (angularLines.length) lines.push("### კუთხური პლანეტები", ...angularLines);

  if (advanced.declinationContacts.length) {
    lines.push("### დეკლინაციები", ...advanced.declinationContacts.slice(0, 12).map((item) => `${PLANET_NAMES_KA[item.a] ?? item.a} და ${PLANET_NAMES_KA[item.b] ?? item.b} — ${item.type === "parallel" ? "პარალელი" : "კონტრაპარალელი"} (${item.orb}° ორბი).`));
  }

  if (advanced.fixedStarContacts.length) {
    lines.push("### ფიქსირებული ვარსკვლავები", ...advanced.fixedStarContacts.slice(0, 12).map((item) => `${item.star} — ${PLANET_NAMES_KA[item.planet] ?? item.planet} (${item.orb}° ორბი, ეკლიპტიკური გრძედი ${item.longitude.toFixed(2)}°).`));
  }
  return lines.length > 1 ? lines : [];
}

export function generateNatalInterpretation(input: PlacementInput): string {
  const { planets, houseCusps, ascendant, aspects, houseOfFn } = input;
  const ascSign = eclipticToSign(ascendant);

  const parts: string[] = [];

  parts.push(`\n## ასცენდენტი — ${ascSign.signName} (${formatDegree(ascSign.degreeInSign)})`);
  parts.push(
    `თქვენი ასცენდენტი განსაზღვრავს, როგორ წარსდგებით სამყაროს წინაშე პირველი შეხვედრისას — ${SIGN_QUALITY_KA[ascSign.signName]}. ეს არის თქვენი "ინტერფეისი" გარესამყაროსთან, არა აუცილებლად შინაგანი არსი.`
  );

  parts.push(`\n## რუკის აღწერა — პლანეტები, სახლები და ასპექტები`);
  parts.push("ქვემოთ მოცემული აღწერა აერთიანებს პლანეტის ნიშანს, სახლს, მის ცხოვრებისეულ თემას და სხვა წერტილებთან კავშირებს. ამიტომ თითოეული ფაქტი ცალკე სათაურად კი არა, ერთი მთლიანი რუკის სურათის ნაწილად იკითხება.");
  for (const p of planets) parts.push(planetLine(p, houseOfFn(p.longitude)));

  for (let index = 0; index < houseCusps.length; index += 1) {
    const house = index + 1;
    const cusp = eclipticToSign(houseCusps[index]!);
    parts.push(`**${house} სახლი — ${cusp.signName} (${formatDegree(cusp.degreeInSign)})** — ${HOUSE_THEME_KA[index] ?? "რუკის შესაბამისი გამოცდილებები"} აქტიურდება ამ სფეროში; კუსპიდის ნიშანი აჩვენებს, როგორ შედიხართ ამ თემაში.`);
  }

  if (aspects.length) {
    parts.push(`\n## მთავარი ასპექტები`);
    const sorted = [...aspects].sort((a, b) => a.orb - b.orb);
    for (const hit of sorted) {
      parts.push(aspectLine(hit, planets, houseOfFn));
    }
  }

  const libraryEntries = dedupeInsights(natalLibraryInsights(planets, aspects, houseOfFn));
  if (libraryEntries.length) {
    parts.push("ბიბლიოთეკის კონტექსტი: ზემოთ აღწერილ პოზიციებსა და კავშირებს ემატება შემდეგი განმარტებითი კავშირები:");
    parts.push(...libraryEntries.slice(0, 24).map((entry) => entry.text));
  }

  parts.push(...advancedAnalysisLines(input.advanced));

  // Keep the methodology as the final section so future interpretation
  // additions are always placed above it.
  parts.push(`\n## გამოთვლისა და ინტერპრეტაციის საფუძველი\n\n${methodNote()}`);

  return parts.join("\n\n");
}

export function generateSynastryInterpretation(
  nameA: string,
  nameB: string,
  aspects: AspectHit[]
): string {
  const parts: string[] = [];
  parts.push(`## სინასტრია — ${nameA} და ${nameB}`);
  parts.push(
    `ქვემოთ ჩამოთვლილია ორ რუკას შორის ძირითადი ასპექტები — წერტილები, სადაც ერთის პლანეტები პირდაპირ ეხება მეორის ბუნებას.`
  );
  if (!aspects.length) {
    parts.push("ამ ორბებში მკაცრი მაჟორული ასპექტი არ დაფიქსირდა — კავშირი უფრო ნატიფად, ნაკლებად აშკარად შეიძლება იგრძნობოდეს.");
    return parts.join("\n\n");
  }
  const sorted = [...aspects].sort((a, b) => a.orb - b.orb).slice(0, 15);
  for (const hit of sorted) {
    const a = PLANET_NAMES_KA[hit.a] ?? hit.a;
    const b = PLANET_NAMES_KA[hit.b] ?? hit.b;
    parts.push(`**${nameA}-ს ${a}** — ${hit.aspectKa} — **${nameB}-ს ${b}** (ორბი ${hit.orb}°, ${hit.applying ? "მოახლოების" : "დაშორების"} ფაზა)`);
    parts.push(aspectLibraryInsight(hit, "SYNASTRY").text);
  }
  return parts.join("\n\n");
}

export function generateTransitInterpretation(aspects: AspectHit[], transitDate: string): string {
  const parts: string[] = [];
  parts.push(`## ტრანზიტები — ${formatWideDateDisplay(transitDate)}`);
  if (!aspects.length) {
    parts.push("ამ დღეს ნატალურ რუკასთან მკვეთრი მაჟორული ტრანზიტული ასპექტი არ ფიქსირდება — მშვიდი პერიოდია.");
    return parts.join("\n\n");
  }
  const sorted = [...aspects].sort((a, b) => a.orb - b.orb);
  for (const hit of sorted) {
    const a = PLANET_NAMES_KA[hit.a] ?? hit.a;
    const b = PLANET_NAMES_KA[hit.b] ?? hit.b;
    parts.push(`ტრანზიტული **${a}** — ${hit.aspectKa} — ნატალური **${b}** (ორბი ${hit.orb}°, ${hit.applying ? "მოახლოების" : "დაშორების"} ფაზა)`);
    parts.push(aspectLibraryInsight(hit, "TRANSIT").text);
  }
  return parts.join("\n\n");
}

/** Interval interpretation is deliberately separate from the astronomical scan. */
export function generateTransitIntervalInterpretation(
  currentAspects: AspectHit[],
  transitDate: string,
  startDate: string,
  endDate: string,
  peakAspects: AspectHit[],
): string {
  const relevant = peakAspects.length ? peakAspects : currentAspects;
  const parts = [generateTransitInterpretation(relevant, transitDate)];
  parts.push(`\n## ტრანზიტის ინტერვალის დინამიკა — ${formatWideDateDisplay(startDate)} — ${formatWideDateDisplay(endDate)}`);
  if (!relevant.length) {
    parts.push("მითითებულ შუალედში ძირითადი ტრანზიტული ასპექტი არ დაფიქსირდა. შედეგი ეფუძნება არჩეული პერიოდის მთელ სკანირებას.");
    return parts.join("\n\n");
  }
  parts.push("ქვემოთ მოცემულია შუალედში ყველაზე მცირე ორბით დაფიქსირებული გავლენები; ისინი მიუთითებს იმ პერიოდებზე, სადაც ასპექტი ყველაზე ზუსტია.");
  for (const hit of relevant.slice(0, 12)) parts.push(aspectLine(hit));
  return parts.join("\n\n");
}

export function generateSecondaryProgressionInterpretation(result: SecondaryProgressionResult): string {
  const parts: string[] = [];
  parts.push("## მეორეული პროგრესია");
  parts.push(`სამიზნე თარიღი: ${formatWideDateDisplay(result.targetDate)}. გამოთვლილი ასაკი: ${result.ageYears} წელი. პროგრესირებული მომენტი: ${result.progressedUtcIso}.`);
  parts.push("მეთოდი იყენებს კლასიკურ day-for-a-year პრინციპს: დაბადებიდან ერთი ასტრონომიული დღე პროგრესირებულ რუკაში ერთ წელს შეესაბამება. ეს არის დროითი სიმბოლური ტექნიკა და არა ფიზიკური პროგნოზის მტკიცება.");
  parts.push("### პროგრესირებული ძირითადი განლაგებები");
  for (const planet of result.progressed.planets.filter((item) => ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(item.name))) {
    parts.push(planetLine(planet, result.progressed.planetHouses[planet.name] ?? 0));
  }
  if (result.aspects.length) {
    parts.push("### პროგრესირებული და ნატალური კავშირები");
    for (const aspect of [...result.aspects].sort((a, b) => a.orb - b.orb).slice(0, 12)) parts.push(aspectLine(aspect));
  } else {
    parts.push("პროგრესირებულ და ნატალურ პლანეტებს შორის არჩეულ მაჟორულ ორბებში კავშირი არ დაფიქსირდა.");
  }
  return parts.join("\n\n");
}

export { HOUSE_LABELS_KA };
