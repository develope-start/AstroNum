import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AstroNum° — პროფესიონალური ასტროლოგიური & ეფემერიდული გამოთვლები",
  description: "შვეიცარიული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების გაშიფვრა.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@400;500;600;700;800&family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap"
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
      <body className="relative min-h-screen overflow-x-hidden star-field bg-[#06040e] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        {/* Ambient cosmic violet & gold glowing backdrops */}
        <div className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[650px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-purple-900/35 via-violet-600/20 to-amber-500/15 blur-[150px]" />
        <div className="pointer-events-none fixed top-1/4 -right-40 -z-10 h-[550px] w-[550px] rounded-full bg-purple-600/20 blur-[140px]" />
        <div className="pointer-events-none fixed top-2/3 -left-40 -z-10 h-[550px] w-[550px] rounded-full bg-amber-500/15 blur-[140px]" />

        <Nav />
        <main className="relative mx-auto w-full max-w-full px-3 sm:px-8 lg:px-12 xl:px-16 pb-20 pt-4 sm:pb-24 sm:pt-6 overflow-x-hidden">{children}</main>
      </body>
    </html>
  );
}


