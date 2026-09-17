import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AstroNum° — პროფესიონალური ასტროლოგიური & ეფემერიდული გამოთვლები",
  description: "შვეიცარიული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების გაშიფვრა.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className="dark premium-ui-v2" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  if (localStorage.getItem("ui_theme") === "legacy") {
                    document.documentElement.classList.remove("premium-ui-v2");
                    document.documentElement.classList.add("legacy-ui");
                    const syncBody = () => {
                      if (!document.body) return false;
                      document.body.classList.remove("premium-ui-v2");
                      document.body.classList.add("legacy-ui");
                      return true;
                    };
                    if (!syncBody()) {
                      const observer = new MutationObserver(() => {
                        if (syncBody()) observer.disconnect();
                      });
                      observer.observe(document.documentElement, { childList: true });
                    }
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@400;500;600;700;800;900&family=Noto+Sans+Georgian:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-display: 'Noto Serif Georgian', serif;
            --font-body: 'Noto Sans Georgian', sans-serif;
          }
          body { font-family: var(--font-body); }
          h1, h2, h3, .font-display { font-family: var(--font-display); }
        `}</style>
      </head>
      <body suppressHydrationWarning className="premium-ui-v2 relative min-h-screen overflow-x-hidden star-field bg-[#050409] text-slate-100 selection:bg-[#F9D076] selection:text-[#050409]">

        <Nav />
        <main className="relative mx-auto w-full max-w-full px-3 sm:px-8 lg:px-12 xl:px-16 pb-20 pt-4 sm:pb-24 sm:pt-6 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
