import assert from "node:assert/strict";
import { AiProviderError, generateAiText } from "../src/lib/ai/generateText";

const originalFetch = globalThis.fetch;
const environmentKeys = ["OPENROUTER_API_KEY", "OPENROUTER_MODEL", "GROQ_API_KEY", "GROQ_MODEL"] as const;
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
const longAnswer = [
  "მზე ვერძში ინიციატივის გამოხატვას აძლიერებს, თუმცა შედეგს ყოველდღიური პასუხისმგებლობა განსაზღვრავს.",
  "მთვარე კირჩხიბში ემოციური უსაფრთხოების საჭიროებას აჩენს და ახლობლებთან გულწრფელ საუბარს უწყობს ხელს.",
  "ასცენდენტი სასწორში პირველ შთაბეჭდილებას დიპლომატიურობას უკავშირებს, მაგრამ არჩევანის გადადება შეიძლება დამღლელი გახდეს.",
  "მერკური ტყუპებში სწრაფ აზროვნებას აღწერს; ინფორმაციის სიღრმისეულად გადამოწმება გადაწყვეტილებებს უფრო მყარ საფუძველს აძლევს.",
  "ვენერა კუროში სტაბილურ სიახლოვეს აფასებს, ხოლო მარსი ლომში სურვილების ღიად გამოხატვისკენ იხრება.",
  "სატურნის ასპექტი მოთმინების განვითარებას მოითხოვს, იუპიტერის კავშირი კი სწავლისა და გამოცდილების გაფართოებას უსვამს ხაზს.",
  "მეექვსე სახლის აქცენტი სამუშაო რიტმსა და პრაქტიკულ ჩვევებზე მიუთითებს, არა წინასწარ განსაზღვრულ პროფესიაზე.",
  "მეათე სახლის კუსპი მიზნების დაგეგმვას უკავშირდება; რეალური კარიერული გზა ინტერესებისა და გარემოებების მიხედვით ყალიბდება.",
  "ჰაერის სტიქიის სიჭარბე იდეების გაცვლას ამარტივებს, თუმცა კონკრეტული გეგმა ყურადღების გაფანტვას ამცირებს.",
  "წყლის ელემენტი მგრძნობელობას მატებს; საზღვრების მკაფიოდ გამოხატვა ურთიერთგაგებას უფრო მდგრადს ხდის.",
  "კვადრატული ასპექტი ორ საჭიროებას შორის დაძაბულობას აჩენს, რომელსაც პატარა ნაბიჯებით და თანმიმდევრული არჩევანით შეიძლება მიუდგე.",
  "ტრინი ბუნებრივ რესურსზე მიანიშნებს, მაგრამ მისი გამოყენება მიზანმიმართულ პრაქტიკას მაინც საჭიროებს.",
  "პლანეტის რეტროგრადული მოძრაობა ასტროლოგიურ ინტერპრეტაციაში შინაგანი გადახედვის სიმბოლოდ განიხილება და არა შეფერხების გარანტიად.",
  "მეორე სახლის მაჩვენებლები პირად ღირებულებებსა და რესურსების მართვის ჩვევებს ეხება, არა მომავალ შემოსავალს.",
  "მეშვიდე სახლის თემები ურთიერთობის მოლოდინების შესახებ დაფიქრების შესაძლებლობას იძლევა; პარტნიორის მონაცემი ამ რუკაში არ შედის.",
  "ჩრდილოეთის კვანძი განვითარების სიმბოლურ მიმართულებას აღნიშნავს და ცხოვრების ერთადერთ დანიშნულებას არ ადგენს.",
  "ქირონის მდებარეობა მოწყვლადობის გააზრებას შეიძლება უკავშირდებოდეს, თუმცა სამედიცინო ან ფსიქოლოგიურ დასკვნას არ წარმოადგენს.",
  "თითოეული ასპექტის მნიშვნელობა მთელ რუკასთან ერთად უნდა განიხილებოდეს, ცალკე აღებული მაჩვენებელი სრულ სურათს ვერ აღწერს.",
  "მონაცემებში არსებული ნიშნები რამდენიმე ალტერნატიულ შესაძლებლობას აჩვენებს; მათგან რომელი გამოიხატება, პირად არჩევანზეც არის დამოკიდებული.",
  "თვითრეფლექსიისთვის იკითხე, რომელი ჩვევა გაძლიერებს და რა მცირე ქმედება დაგეხმარება ამ კვირაში.",
].join("\n\n");
const repetitiveAnswer = "მუტაბელური ".repeat(250);
const naturallyRepeatedWordAnswer = [
  longAnswer,
  ...Array.from({ length: 24 }, (_, index) =>
    `მე-${index + 1} სახლის თემა განსხვავებულ გამოცდილებას უკავშირდება და გააზრებულ არჩევანს მოითხოვს.`,
  ),
].join("\n\n");

function setEnvironment(values: Partial<Record<typeof environmentKeys[number], string | undefined>>) {
  for (const key of environmentKeys) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function completion(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function run() {
  try {
    setEnvironment({ OPENROUTER_API_KEY: "test-openrouter", GROQ_API_KEY: "test-groq" });
    const requests: string[] = [];
    globalThis.fetch = async (input, init) => {
      requests.push(String(input));
      const request = JSON.parse(String(init?.body)) as { model: string };
      assert.equal(request.model, "openrouter/free");
      return completion(longAnswer);
    };
    const openRouter = await generateAiText("system", "chart facts");
    assert.match(openRouter.provider, /^OpenRouter/);
    assert.equal(requests.length, 1, "the preferred provider is used first");

    globalThis.fetch = async () => completion(naturallyRepeatedWordAnswer);
    const naturalRepetition = await generateAiText("system", "chart facts");
    assert.match(naturalRepetition.provider, /^OpenRouter/, "one common Georgian word may recur without rejecting a coherent response");

    requests.length = 0;
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return requests.length === 1
        ? new Response("", { status: 429 })
        : completion(longAnswer);
    };
    const fallback = await generateAiText("system", "chart facts");
    assert.match(fallback.provider, /^Groq/);
    assert.deepEqual(requests, [
      "https://openrouter.ai/api/v1/chat/completions",
      "https://api.groq.com/openai/v1/chat/completions",
    ]);

    requests.length = 0;
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return requests.length === 1 ? completion(repetitiveAnswer) : completion(longAnswer);
    };
    const qualityFallback = await generateAiText("system", "chart facts");
    assert.match(qualityFallback.provider, /^Groq/);

    requests.length = 0;
    globalThis.fetch = async () => completion(repetitiveAnswer);
    await assert.rejects(
      () => generateAiText("system", "chart facts"),
      (error: unknown) =>
        error instanceof AiProviderError
        && error.status === 502
        && error.message.includes("არასრული ან განმეორებადი"),
    );

    requests.length = 0;
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      if (requests.length === 1) {
        const error = new Error("request timed out");
        error.name = "AbortError";
        throw error;
      }
      return new Response("", { status: 429 });
    };
    await assert.rejects(
      () => generateAiText("system", "chart facts"),
      (error: unknown) =>
        error instanceof AiProviderError
        && error.status === 502
        && error.message.includes("OpenRouter")
        && error.message.includes("პასუხის დრო ამოიწურა")
        && error.message.includes("Groq")
        && error.message.includes("429"),
    );

    requests.length = 0;
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return new Response("", { status: 429 });
    };
    await assert.rejects(
      () => generateAiText("system", "chart facts"),
      (error: unknown) =>
        error instanceof AiProviderError
        && error.status === 429
        && error.message.includes("OpenRouter")
        && error.message.includes("Groq")
        && error.message.includes("429"),
    );

    requests.length = 0;
    setEnvironment({
      OPENROUTER_API_KEY: "test-openrouter",
      OPENROUTER_MODEL: "openai/gpt-oss-120b",
      GROQ_API_KEY: "test-groq",
    });
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return completion(longAnswer);
    };
    const paidModelFallback = await generateAiText("system", "chart facts");
    assert.match(paidModelFallback.provider, /^Groq/);
    assert.deepEqual(requests, ["https://api.groq.com/openai/v1/chat/completions"]);

    setEnvironment({});
    await assert.rejects(
      () => generateAiText("system", "chart facts"),
      (error: unknown) => error instanceof AiProviderError && error.status === 503,
    );
    console.log("AI provider validation passed");
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of environmentKeys) {
      const value = originalEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

void run();
