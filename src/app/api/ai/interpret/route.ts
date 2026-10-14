import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeNatalChart } from "@/lib/astro/chart";
import { eclipticToSign } from "@/lib/astro/signs";
import { ASTROLOGY_GEORGIAN_STYLE_GUIDE, normalizeGeorgianAstrologyTerms } from "@/lib/astrologyGeorgian";
import { getRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { requireFeatureAccess } from "@/lib/billing/access";

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
  const accessDenied = await requireFeatureAccess(req, "ai");
  if (accessDenied) return accessDenied;

  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "მონაცემები არასწორია" }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        error: "Gemini AI მიუწვდომელია: სერვერზე GEMINI_API_KEY ჯერ არ არის კონფიგურირებული.",
      }, { status: 503 });
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

    const placements = chart.planets.map((planet) => {
      const sign = eclipticToSign(planet.longitude);
      return `${planet.name}: ${sign.signName} ${sign.degreeInSign.toFixed(2)}°, ${chart.planetHouses[planet.name] ?? "?"}-ე სახლი`;
    }).join("\n");
    const aspects = [...chart.aspects]
      .sort((left, right) => left.orb - right.orb)
      .slice(0, 24)
      .map((aspect) => `${aspect.a} ${aspect.aspect} ${aspect.b} (orb ${aspect.orb}°)`)
      .join("\n") || "მოცემულ ორბებში ასპექტი არ დაფიქსირდა";

    if (apiKey) {
      const prompt = `დაწერე მკაფიო, გამართული ქართული ასტროლოგიური ინტერპრეტაცია. ${ASTROLOGY_GEORGIAN_STYLE_GUIDE} ეს არის სიმბოლური ასტროლოგიური წაკითხვა და არა სამედიცინო, ფსიქოლოგიური ან ფინანსური დიაგნოზი.

ფოკუსი: ${FOCUS_LABELS[type]}
სახელი: ${name || "მაძიებელი"}
დაბადების ადგილი: ${birthPlace || "მითითებული არ არის"}
${question ? `შეკითხვა: ${question}` : ""}

გამოთვლილი რუკის მონაცემები (ეს პოზიციები გამოიყენე წყაროდ; ახალი პოზიციები არ გამოიგონო):
ასცენდენტი: ${eclipticToSign(chart.ascendant).signName}
მედიუმ ქოელი (MC): ${eclipticToSign(chart.mc).signName}
ეფემერიდა: ${chart.ephemeris.source}
პლანეტების პოზიციები:
${placements}
ასპექტები:
${aspects}

განმარტე მხოლოდ მოწოდებულ მონაცემებზე დაყრდნობით. თუ შეკითხვას რუკა საკმარისად არ პასუხობს, პირდაპირ აღნიშნე ეს. მოერიდე გარანტირებულ წინასწარმეტყველებებსა და გამოგონილ ბიოგრაფიულ ფაქტებს.`;

      const configuredModel = process.env.GEMINI_MODEL?.trim();
      const candidateModels = Array.from(new Set([
        configuredModel,
        "gemini-3.8-flash",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
      ].filter((value): value is string => Boolean(value && value.trim()))));

      let lastStatus = 0;
      let lastDetail = "Gemini AI-ის პასუხი ვერ მიიღეს.";

      for (const model of candidateModels) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25_000);
        let geminiRes: Response;
        try {
          geminiRes = await fetch(
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
          );
        } catch (error) {
          const timedOut = error instanceof Error && error.name === "AbortError";
          lastDetail = timedOut
            ? "Gemini-ის მოთხოვნას დრო ამოეწურა. სცადეთ მოგვიანებით."
            : "Gemini სერვისთან დაკავშირება ვერ მოხერხდა.";
          lastStatus = 502;
          break;
        } finally {
          clearTimeout(timeout);
        }

        if (geminiRes.ok) {
          const data = await geminiRes.json().catch(() => null);
          const generatedText = data?.candidates?.[0]?.content?.parts
            ?.map((part: { text?: unknown }) => typeof part.text === "string" ? part.text : "")
            .join("");
          if (typeof generatedText !== "string" || !generatedText.trim()) {
            console.error("Gemini API returned no text candidate");
            return NextResponse.json({
              error: "Gemini-მა გამოსაყენებელი ტექსტი არ დააბრუნა. სცადეთ სხვა შეკითხვით.",
            }, { status: 502 });
          }

          return NextResponse.json({
            success: true,
            analysis: normalizeGeorgianAstrologyTerms(generatedText),
            provider: `Gemini (${model}) · ${chart.ephemeris.source}`,
          });
        }

        if (geminiRes.status === 401 || geminiRes.status === 403) {
          lastDetail = "GEMINI_API_KEY არასწორია ან ამ მოდელზე წვდომა არ აქვს.";
          lastStatus = 401;
          break;
        }

        if (geminiRes.status === 429) {
          lastDetail = "Gemini API-ის მოთხოვნის ან კვოტის ლიმიტი ამოიწურა.";
          lastStatus = 429;
          break;
        }

        if (geminiRes.status === 404 || geminiRes.status === 400 || geminiRes.status === 503) {
          lastStatus = geminiRes.status;
          lastDetail = `Gemini მოდელი „${model}“ ამჟამად მიუწვდომელია; მცდარდება შემდეგი ხელმისაწვდომი მოდელი.`;
          console.warn("Gemini model unavailable, trying fallback", { model, status: geminiRes.status });
          continue;
        }

        lastStatus = geminiRes.status;
        lastDetail = `Gemini API-მ მოთხოვნა უარყო (HTTP ${geminiRes.status}).`;
        break;
      }

      if (lastStatus) {
        return NextResponse.json({ error: lastDetail }, { status: lastStatus === 429 ? 429 : 502 });
      }

      return NextResponse.json({
        error: "Gemini AI-ის პასუხი ვერ დადასტურდა. შეამოწმეთ სერვერის კონფიგურაცია და სცადეთ ხელახლა.",
      }, { status: 502 });
    }

    return NextResponse.json({
      error: "Gemini AI-ის პასუხი ვერ დადასტურდა. შეამოწმეთ სერვერის კონფიგურაცია და სცადეთ ხელახლა.",
    }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "ინტერპრეტაციის გენერირების შეცდომა" }, { status: 500 });
  }
}
