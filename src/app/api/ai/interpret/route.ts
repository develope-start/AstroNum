import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeNatalChart } from "@/lib/astro/chart";
import { eclipticToSign } from "@/lib/astro/signs";
import { houseOfLongitude } from "@/lib/astro/positions";
import { generateNatalInterpretation } from "@/lib/interpretations/natal";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";

const requestSchema = z.object({
  type: z.enum(["natal", "career", "love", "karmic", "question"]),
  name: z.string().trim().max(100).default("მაძიებელი"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "დაბადების თარიღი არასწორია"),
  birthTime: z.string().trim().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).default("12:00"),
  birthPlace: z.string().trim().max(160).default("თბილისი"),
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  timezone: z.string().trim().min(1).max(64),
  question: z.string().trim().max(2_000).optional(),
});

const FOCUS_LABELS = {
  natal: "ნატალური პროფილი",
  career: "კარიერა და პროფესიული მიმართულება",
  love: "ურთიერთობები და პარტნიორობა",
  karmic: "კარმული ასტროლოგიის სიმბოლოები",
  question: "პასუხი ასტროლოგიურ შეკითხვაზე",
} as const;

export async function POST(req: NextRequest) {
  const limiter = rateLimit(getRateLimitKey(req, "ai:interpret"), 8, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "მოთხოვნების ლიმიტი ამოიწურა. სცადეთ მოგვიანებით." }, {
      status: 429,
      headers: { "Retry-After": String(limiter.retryAfterSeconds) },
    });
  }

  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "მონაცემები არასწორია" }, { status: 400 });
    }
    const { type, name, birthDate, birthTime, birthPlace, lat, lon, timezone, question } = parsed.data;

    let chart;
    try {
      chart = computeNatalChart({ date: birthDate, time: birthTime, timezone, lat, lon }, "placidus");
    } catch (error) {
      return NextResponse.json({
        error: error instanceof Error ? error.message : "რუკის გამოთვლა ვერ მოხერხდა",
      }, { status: 400 });
    }

    const chartText = generateNatalInterpretation({
      planets: chart.planets,
      houseCusps: chart.houseCusps,
      ascendant: chart.ascendant,
      mc: chart.mc,
      aspects: chart.aspects,
      houseOfFn: (longitude) => houseOfLongitude(longitude, chart.houseCusps),
    });
    const placements = chart.planets.map((planet) => {
      const sign = eclipticToSign(planet.longitude);
      return `${planet.name}: ${sign.signName} ${sign.degreeInSign.toFixed(2)}°, ${chart.planetHouses[planet.name] ?? "?"}-ე სახლი`;
    }).join("\n");
    const aspects = [...chart.aspects]
      .sort((left, right) => left.orb - right.orb)
      .slice(0, 24)
      .map((aspect) => `${aspect.a} ${aspect.aspect} ${aspect.b} (orb ${aspect.orb}°)`)
      .join("\n") || "მოცემულ ორბებში ასპექტი არ დაფიქსირდა";

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = `დაწერე მკაფიო, გამართული ქართული ასტროლოგიური ინტერპრეტაცია. ეს არის სიმბოლური ასტროლოგიური წაკითხვა და არა სამედიცინო, ფსიქოლოგიური ან ფინანსური დიაგნოზი.

ფოკუსი: ${FOCUS_LABELS[type]}
სახელი: ${name || "მაძიებელი"}
დაბადების ადგილი: ${birthPlace || "მითითებული არ არის"}
${question ? `შეკითხვა: ${question}` : ""}

გამოთვლილი რუკის მონაცემები (ეს პოზიციები გამოიყენე წყაროდ; ახალი პოზიციები არ გამოიგონო):
ასცენდენტი: ${eclipticToSign(chart.ascendant).signName}
MC: ${eclipticToSign(chart.mc).signName}
ეფემერიდა: ${chart.ephemeris.source}
პლანეტების პოზიციები:
${placements}
ასპექტები:
${aspects}

განმარტე მხოლოდ მოწოდებულ მონაცემებზე დაყრდნობით. თუ შეკითხვას რუკა საკმარისად არ პასუხობს, პირდაპირ აღნიშნე ეს. მოერიდე გარანტირებულ წინასწარმეტყველებებსა და გამოგონილ ბიოგრაფიულ ფაქტებს.`;

        const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25_000);
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 1500 },
            }),
            signal: controller.signal,
          },
        ).finally(() => clearTimeout(timeout));

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof generatedText === "string" && generatedText.trim()) {
            return NextResponse.json({
              success: true,
              analysis: generatedText,
              provider: `Gemini (${model}) · ${chart.ephemeris.source}`,
            });
          }
        } else {
          console.warn("Gemini API returned", geminiRes.status);
        }
      } catch (error) {
        console.warn("Gemini request failed; using the local chart interpretation:", error);
      }
    }

    return NextResponse.json({
      success: true,
      analysis: generateLocalInterpretation(type, name || "მაძიებელი", chartText, question),
      provider: `AstroNum-ის ლოკალური ინტერპრეტაცია · ${chart.ephemeris.source}`,
    });
  } catch {
    return NextResponse.json({ error: "ინტერპრეტაციის გენერირების შეცდომა" }, { status: 500 });
  }
}

function generateLocalInterpretation(
  type: keyof typeof FOCUS_LABELS,
  name: string,
  chartText: string,
  question?: string,
) {
  const focusNote = type === "question"
    ? question
      ? `თქვენი შეკითხვა: „${question}“. ადგილობრივი რეჟიმი შეკითხვას ცალკე ტექსტურად ვერ აანალიზებს; ქვემოთ მოცემულია გამოთვლილი ნატალური რუკა, რომელზეც პასუხის მოძებნა შეგიძლიათ.`
      : "ადგილობრივ რეჟიმში შეკითხვაზე ცალკე ტექსტური პასუხი მიუწვდომელია; ქვემოთ მოცემულია გამოთვლილი ნატალური რუკა."
    : `ფოკუსი: ${FOCUS_LABELS[type]}. ადგილობრივი რეჟიმი აჩვენებს გამოთვლილ რუკასა და მის წესებზე დაფუძნებულ განმარტებას; თემაზე თავისუფალი ტექსტის გენერირებისთვის Gemini API უნდა იყოს კონფიგურირებული.`;

  return `# ${FOCUS_LABELS[type]} — ${name}\n\n${focusNote}\n\n${chartText}`;
}
