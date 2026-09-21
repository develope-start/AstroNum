export const ZODIAC_SIGNS_KA = [
  "ვერძი",
  "კურო",
  "ტყუპები",
  "კირჩხიბი",
  "ლომი",
  "ქალწული",
  "სასწორი",
  "მორიელი",
  "მშვილდოსანი",
  "თხის რქა",
  "მერწყული",
  "თევზები",
] as const;

export const PLANET_NAMES_KA: Record<string, string> = {
  Sun: "მზე",
  Moon: "მთვარე",
  Mercury: "მერკური",
  Venus: "ვენერა",
  Mars: "მარსი",
  Jupiter: "იუპიტერი",
  Saturn: "სატურნი",
  Uranus: "ურანი",
  Neptune: "ნეპტუნი",
  Pluto: "პლუტონი",
  TrueNode: "ჩრდილო კვანძი",
  MeanNode: "ჩრდილო კვანძი (საშუალო)",
};

PLANET_NAMES_KA.Lilith = "ლილითი";
PLANET_NAMES_KA.Selena = "სელენა";
PLANET_NAMES_KA.Chiron = "ქირონი";

export const HOUSE_LABELS_KA = [
  "I — პიროვნება, გარეგნობა",
  "II — ფინანსები, ღირებულებები",
  "III — კომუნიკაცია, გარემო",
  "IV — ოჯახი, ფესვები",
  "V — შემოქმედება, სიყვარული",
  "VI — ყოველდღიურობა, ჯანმრთელობა",
  "VII — პარტნიორობა, ქორწინება",
  "VIII — ტრანსფორმაცია, საერთო რესურსები",
  "IX — მსოფლმხედველობა, მოგზაურობა",
  "X — კარიერა, სტატუსი",
  "XI — მეგობრები, საზოგადოება",
  "XII — ქვეცნობიერი, განმარტოება",
];

export function eclipticToSign(longitude: number): { signIndex: number; signName: string; degreeInSign: number } {
  const norm = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const degreeInSign = norm - signIndex * 30;
  return { signIndex, signName: ZODIAC_SIGNS_KA[signIndex], degreeInSign };
}

export function formatDegree(degreeInSign: number): string {
  const deg = Math.floor(degreeInSign);
  const minutes = Math.round((degreeInSign - deg) * 60);
  return `${deg}°${minutes.toString().padStart(2, "0")}'`;
}
