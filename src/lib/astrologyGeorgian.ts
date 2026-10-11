const ASTROLOGY_TERM_GLOSSARY = [
  { aliases: ["მედიუმ ცელის"], preferred: "მედიუმ ქოელის" },
  { aliases: ["მედიუმ ცელს"], preferred: "მედიუმ ქოელს" },
  { aliases: ["მედიუმ ცელით"], preferred: "მედიუმ ქოელით" },
  { aliases: ["მედიუმ ცელად"], preferred: "მედიუმ ქოელად" },
  { aliases: ["მედიუმ ცელზე"], preferred: "მედიუმ ქოელზე" },
  { aliases: ["მედიუმ ცელში"], preferred: "მედიუმ ქოელში" },
  { aliases: ["მედიუმ ცელიდან"], preferred: "მედიუმ ქოელიდან" },
  { aliases: ["მედიუმ ცელი", "medium coeli", "midheaven", "mid heaven"], preferred: "მედიუმ ქოელი" },
  { aliases: ["ascendant"], preferred: "ასცენდენტი" },
  { aliases: ["descendant"], preferred: "დესცენდენტი" },
  { aliases: ["conjunction"], preferred: "კონიუნქცია" },
  { aliases: ["sextile"], preferred: "სექსტილი" },
  { aliases: ["trine"], preferred: "ტრიგონი" },
  { aliases: ["square"], preferred: "კვადრატი" },
  { aliases: ["opposition"], preferred: "ოპოზიცია" },
  { aliases: ["quincunx"], preferred: "კვინკუნქსი" },
] as const;

export const ASTROLOGY_GEORGIAN_STYLE_GUIDE =
  "გამოიყენე ქართულ ასტროლოგიურ ტერმინოლოგიაში მიღებული ფორმები: მედიუმ ქოელი (MC), ასცენდენტი, დესცენდენტი, კონიუნქცია, სექსტილი, ტრიგონი, კვადრატი, ოპოზიცია და კვინკუნქსი. მოერიდე პირდაპირ, გაუმართავ თარგმანს.";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeGeorgianAstrologyTerms(text: string): string {
  return ASTROLOGY_TERM_GLOSSARY.reduce((normalized, entry) => {
    return entry.aliases.reduce((value, alias) => {
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp(alias)}(?=$|[^\\p{L}\\p{N}_])`, "giu");
      return value.replace(pattern, (_match, prefix: string) => `${prefix}${entry.preferred}`);
    }, normalized);
  }, text);
}
