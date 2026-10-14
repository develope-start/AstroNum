"use client";

import { useState } from "react";
import { BookOpen, Compass, Eye, Flame, Gem, Moon, Orbit, Sparkles, Wand2, X, Zap } from "lucide-react";

interface Article {
  id: string;
  category: "karma" | "saturn" | "crystals" | "chakras";
  categoryLabel: string;
  badgeColor: string;
  title: string;
  excerpt: string;
  readTime: string;
  content: string;
  icon: typeof Sparkles;
}

const ARTICLES: Article[] = [
  {
    id: "saturn-return",
    category: "saturn",
    categoryLabel: "პლანეტარული ციკლები",
    badgeColor: "border-violet-500/30 text-violet-300 bg-violet-950/40",
    title: "სატურნის დაბრუნება — 29.5 წლიანი კარმული გამოცდა",
    excerpt: "როგორ გადავლახოთ ცხოვრების ყველაზე საპასუხისმგებლო ასაკობრივი ზღვარი და ვაქციოთ შეზღუდვები დიდ მიღწევად.",
    readTime: "5 წთ საკითხავი",
    icon: Orbit,
    content: `### 🪐 სატურნის დაბრუნება (Saturn Return): 29.5 წლიანი ციკლი

სატურნი — დროის, კარმის, სიმწიფისა და სტრუქტურის პლანეტაა. მას ზუსტად **29.5 წელი** სჭირდება, რათა შემოუაროს მთელ ზოდიაქოს და დაბრუნდეს იმავე გრადუსზე, სადაც თქვენი დაბადების წამს იმყოფებოდა.

#### რას ნიშნავს ეს ეტაპი ადამიანის ცხოვრებაში?
* **27-30 წლის ასაკში**: პირველი სატურნის დაბრუნება. ეს არის ილუზიების მსხვრევის და ნამდვილი ზრდასრულობის დაწყების ხანა. სამსახური, ქორწინება და ღირებულებები გადის მკაცრ ტესტს.
* **58-60 წლის ასაკში**: მეორე დაბრუნება — ცხოვრებისეული სიბრძნის, მემკვიდრეობისა და სულიერი მასწავლებლობის ეტაპი.

#### როგორ მოვემზადოთ?
1. **აიღეთ სრული პასუხისმგებლობა**: სატურნი სჯის თავის არიდებას, მაგრამ უხვად აჯილდოებს დისციპლინასა და შრომისმოყვარეობას.
2. **გაათავისუფლეთ არასაჭირო კავშირები**: ის, რაც ხელოვნურია და მომავალი აღარ აქვს, ამ პერიოდში ბუნებრივად ჩამოგშორდებათ.
3. **შეამოწმეთ სატურნის სახლი თქვენს რუკაში**: სატურნის სახლი (მაგ. მე-7 — პარტნიორობა, მე-10 — კარიერა, მე-2 — ფინანსები) ზუსტად გაჩვენებთ, რომელ სფეროში მოხდება მთავარი გამოცდა.`,
  },
  {
    id: "lilith-black-moon",
    category: "karma",
    categoryLabel: "კარმა & ჩრდილი",
    badgeColor: "border-rose-500/30 text-rose-300 bg-rose-950/40",
    title: "ლილიტი (შავი მთვარე) ნატალურ რუკაში",
    excerpt: "ქვეცნობიერი ცდუნებები, აუხსნელი შიშები და ფარული მაგნეტიზმი — როგორ გავაცნობიეროთ შავი მთვარის ენერგია.",
    readTime: "4 წთ საკითხავი",
    icon: Moon,
    content: `### 🌑 ლილიტი (შავი მთვარე) — ქვეცნობიერის ბნელი სარკე

ლილიტი არ არის ფიზიკური ციური სხეული — ეს არის მთვარის ორბიტის აპოგეა, წერტილი, სადაც მთვარე ყველაზე მეტადაა დაშორებული დედამიწას. ასტროლოგიაში ის განასახიერებს ჩვენს **ჩრდილოვან მხარეს**, ტაბუირებულ სურვილებსა და კარმულ ვალებს.

#### ლილიტის გამოვლინების სამი დონე:
* **დონე 1 (ინსტინქტური)**: ადამიანი სრულად ემორჩილება ცდუნებას და იმეორებს წარსულის კარმულ შეცდომებს.
* **დონე 2 (მსხვერპლი)**: ადამიანი ხვდება იმავე სიტუაციების მსხვერპლი, რასაც წარსულში თავად აკეთებდა, თუმცა იწყებს გაცნობიერებას.
* **დონე 3 (იმუნიტეტი)**: სრული გაცნობიერება. ადამიანი ხედავს ცდუნებას შორიდან და იყენებს ლილიტის კოლოსალურ ენერგიას შემოქმედებისა და ფსიქოლოგიური სიბრძნისთვის.

#### პრაქტიკული რჩევა:
ნუ შეებრძოლებით ლილიტს აგრესიით. გამოიკვლიეთ, რომელ ნიშანში და სახლში დგას ის თქვენს AstroNum რუკაში — ეს არის ადგილი, სადაც სამყარო მოითხოვს უდიდეს სიფხიზლეს.`,
  },
  {
    id: "karmic-nodes",
    category: "karma",
    categoryLabel: "კარმული მისია",
    badgeColor: "border-cyan-500/30 text-cyan-300 bg-cyan-950/40",
    title: "კარმული კვანძები: რაჰუ და კეტუ (ჩრდილოეთი და სამხრეთი)",
    excerpt: "საიდან მოვედით და საით მივდივართ — წარსული ინკარნაციების ბარგი და ამ ცხოვრების უმთავრესი ევოლუციური ამოცანა.",
    readTime: "6 წთ საკითხავი",
    icon: Compass,
    content: `### ♾️ მთვარის კვანძები: სულის ევოლუციის კომპასი

მთვარის კვანძები წარმოადგენს მთვარის ორბიტისა და ეკლიპტიკის გადაკვეთის წერტილებს. ისინი უჩვენებენ ადამიანის კარმულ ღერძს:

#### 1. სამხრეთის კვანძი (Ketu) — საიდან მოვედით?
* ეს არის ჩვენი თანდაყოლილი ნიჭი, ინსტინქტები და წარსული ცხოვრების გამოცდილება.
* **საფრთხე**: აქ დარჩენა იწვევს სტაგნაციას. ეს არის კომფორტის ზონა, რომლის გადაჭარბებული გამოყენებაც ცხოვრებაში ბლოკავს წინსვლას.

#### 2. ჩრდილოეთის კვანძი (Rahu) — საით მივდივართ?
* ეს არის ის თვისებები და გამოცდილება, რაც ჯერ არ გაგვაჩნია და რისი სწავლაც გვეშინია.
* სწორედ აქ დევს ჩვენი უდიდესი ზრდა, იღბალი და სულიერი რეალიზაცია.

#### მაგალითი:
თუ კეტუ გაქვთ სასწორში (ზედმეტი დამოკიდებულება სხვებზე), რაჰუ ვერძში მოითხოვს დამოუკიდებლობას, საკუთარი აზრის დაცვას და გაბედულ ინიციატივას.`,
  },
  {
    id: "crystals-elements",
    category: "crystals",
    categoryLabel: "მინერალური ქვები",
    badgeColor: "border-amber-500/30 text-amber-300 bg-amber-950/40",
    title: "მინერალური ქვები & 4 სტიქიის ჰარმონიზაცია",
    excerpt: "რომელი კრისტალი შეესაბამება თქვენს დომინანტ ან დეფიციტურ სტიქიას (ცეცხლი, მიწა, ჰაერი, წყალი) ენერგეტიკული ბალანსისთვის.",
    readTime: "4 წთ საკითხავი",
    icon: Gem,
    content: `### 💎 მინერალები და 4 სტიქიის ბალანსი

თითოეული მინერალური ქვა ატარებს კრისტალური მესრის უნიკალურ ვიბრაციას, რომელიც რეზონირებს ადამიანის სტიქიურ ტემპერამენტთან:

#### 🔥 ცეცხლის სტიქია (ვერძი, ლომი, მშვილდოსანი)
* **ქვები**: ციტრინი, ძოწი (Garnet), ლალი, ქარვა.
* **დანიშნულება**: ნებისყოფის გაძლიერება, ენერგიის მოზღვავება, ქოლერიკული ტემპერამენტის მიზანმიმართული მართვა.

#### 🌍 მიწის სტიქია (კურო, ქალწული, თხის რქა)
* **ქვები**: ზურმუხტი, ნეფრიტი, შავი ონიქსი, მალაქიტი.
* **დანიშნულება**: მატერიალური სტაბილურობა, დამიწება, სტრესის განმუხტვა, მელანქოლიური განწყობის ბალანსი.

#### 💨 ჰაერის სტიქია (ტყუპები, სასწორი, მერწყული)
* **ქვები**: აქვამარინი, საფირონი, მთის ბროლი, ლაპის ლაზური (ლაზურიტი).
* **დანიშნულება**: მენტალური სიცხადე, კომუნიკაციის გაუმჯობესება, ზედმეტი შფოთვის დაცხრობა.

#### 💧 წყლის სტიქია (კირჩხიბი, მორიელი, თევზები)
* **ქვები**: მთვარის ქვა (Moonstone), ამეთვისტო, მარგალიტი, ფირუზი.
* **დანიშნულება**: ემოციური განკურნება, ინტუიციის გაძლიერება, ფლეგმატიკური მშვიდი ნაკადის შენარჩუნება.`,
  },
  {
    id: "chakras-planets",
    category: "chakras",
    categoryLabel: "ჩაკრები & ეზოთერია",
    badgeColor: "border-emerald-500/30 text-emerald-300 bg-emerald-950/40",
    title: "7 ჩაკრა და პლანეტარული ენერგეტიკული ცენტრები",
    excerpt: "როგორ უკავშირდება პლანეტები ადამიანის ენერგეტიკულ სხეულს: მულადჰარადან საჰასრარამდე.",
    readTime: "5 წთ საკითხავი",
    icon: Sparkles,
    content: `### 🧘 7 ჩაკრა და პლანეტების რეზონანსი

კლასიკურ ეზოთერულ ასტროლოგიაში ადამიანის ენერგეტიკული არხები (ჩაკრები) წარმოადგენს ციური პლანეტების შინაგან პროექციას:

1. **მულადჰარა (ფესვის ჩაკრა)** — **სატურნი & მარსი**: გადარჩენა, ფიზიკური უსაფრთხოება, მიწასთან კავშირი.
2. **სვადჰისტანა (საკრალური ჩაკრა)** — **ვენერა & მთვარე**: შემოქმედება, სექსუალობა, ემოციური სიამოვნება.
3. **მანიპურა (მზის წნული)** — **მზე & მარსი**: პირადი ძალაუფლება, თვითშეფასება, ნებისყოფა, საჭმლის მონელება.
4. **ანაჰატა (გულის ჩაკრა)** — **ვენერა**: უპირობო სიყვარული, ემპათია, ჰარმონია სხვებთან.
5. **ვიშუდჰა (ყელის ჩაკრა)** — **მერკური**: სიმართლის თქმა, თვითგამოხატვა, ხმა და კომუნიკაცია.
6. **აჯნა (მესამე თვალი)** — **იუპიტერი & ურანი**: ინტუიცია, შორსმჭვრეტელობა, უმაღლესი ინტელექტი.
7. **საჰასრარა (გვირგვინის ჩაკრა)** — **ნეპტუნი & მზე**: სამყაროსთან ერთიანობა, კოსმოსური ცნობიერება.`,
  },
];

export default function KnowledgeHub() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  const filteredArticles = activeTab === "all" ? ARTICLES : ARTICLES.filter((a) => a.category === activeTab);

  return (
    <section id="academy" className="relative my-24 w-full scroll-mt-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[450px] w-[750px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/[0.04] blur-[140px]" />

      <div className="mb-10 text-center">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/30 px-3.5 py-1 text-xs font-medium text-cyan-300 backdrop-blur-md">
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span>ცოდნის ბაზა & გზამკვლევები</span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          ასტროლოგიური აკადემია
        </h2>

        {/* Categories Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "ყველა თემა" },
            { id: "saturn", label: "სატურნის ციკლები" },
            { id: "karma", label: "კარმა & კვანძები" },
            { id: "crystals", label: "მინერალური ქვები" },
            { id: "chakras", label: "ჩაკრები & ენერგეტიკა" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === cat.id
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20"
                  : "border border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((art) => {
          const Icon = art.icon;
          return (
            <article
              key={art.id}
              onMouseMove={(e) => {
                const card = e.currentTarget;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty("--mouse-x", `${x}px`);
                card.style.setProperty("--mouse-y", `${y}px`);

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((centerY - y) / centerY) * 6;
                const rotateY = ((x - centerX) / centerX) * 6;
                card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
              }}
              className="cosmic-spotlight group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0c1428]/60 to-[#060a14]/60 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/60 hover:bg-[#0e1933]/70 hover:shadow-[0_0_40px_-5px_rgba(56,189,248,0.3)]"
            >
              {/* Radial ambient glow on hover */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-500 group-hover:bg-cyan-500/25 group-hover:scale-125" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-semibold transition-all duration-300 group-hover:shadow-[0_0_14px_rgba(56,189,248,0.3)] ${art.badgeColor}`}>
                    {art.categoryLabel}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono transition-colors group-hover:text-slate-300">
                    {art.readTime}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-300 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:border-cyan-400/50 group-hover:bg-cyan-950/60 group-hover:text-cyan-200 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white transition-colors duration-200 group-hover:text-cyan-200 line-clamp-2">
                    {art.title}
                  </h3>
                </div>

                <p className="mt-3.5 text-xs leading-relaxed text-slate-300 transition-colors group-hover:text-slate-200 line-clamp-3">
                  {art.excerpt}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReadingArticle(art)}
                className="relative z-10 mt-6 flex w-full cursor-pointer items-center justify-between border-t border-white/[0.06] pt-4 text-left text-xs font-semibold text-cyan-400 transition-all duration-200 hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:text-white group/btn"
              >
                <span className="group-hover/btn:underline group-hover/btn:text-white transition-all">
                  სრული სტატიის წაკითხვა
                </span>
                <span aria-hidden="true" className="text-sm transition-transform duration-300 group-hover/btn:translate-x-2 group-hover/btn:text-cyan-300">
                  →
                </span>
              </button>
            </article>
          );
        })}
      </div>

      {/* Reader Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-b from-[#131b2e] to-[#090d16] p-6 shadow-2xl sm:p-10 text-left">
            <button
              type="button"
              onClick={() => setReadingArticle(null)}
              className="sticky top-0 float-right -mr-2 -mt-2 rounded-full bg-white/10 p-2 text-slate-300 hover:text-white backdrop-blur-md cursor-pointer"
              aria-label="დახურვა"
            >
              <X className="h-5 w-5" />
            </button>

            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-mono font-semibold mb-3 ${readingArticle.badgeColor}`}>
              {readingArticle.categoryLabel}
            </span>

            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              {readingArticle.title}
            </h2>

            <div className="mt-6 border-t border-white/10 pt-6 text-sm leading-relaxed text-slate-200">
              <div className="whitespace-pre-line space-y-4 font-sans">
                {readingArticle.content}
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                AstroNum° Knowledge Base · Swiss Ephemeris Standard
              </span>
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="rounded-xl bg-cyan-600/80 hover:bg-cyan-600 px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
