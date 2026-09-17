import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AstroNum° — პროფესიონალური ასტროლოგიური & ეფემერიდული გამოთვლები",
  description: "შვეიცარიული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების გაშიფვრა.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className="dark premium-ui">
      <head>
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
      <body className="premium-ui relative min-h-screen overflow-x-hidden star-field bg-[#06040A] text-slate-100 selection:bg-[#FFD26A] selection:text-[#06040A]">
        {/* Mystic Ambient Cosmic Nebula Orbs */}
        <div className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-purple-900/25 via-indigo-600/15 to-amber-500/10 blur-[160px]" />
        <div className="pointer-events-none fixed top-1/3 -right-40 -z-10 h-[600px] w-[600px] rounded-full bg-cyan-600/15 blur-[150px]" />
        <div className="pointer-events-none fixed top-2/3 -left-40 -z-10 h-[600px] w-[600px] rounded-full bg-amber-500/12 blur-[150px]" />

        <Nav />
        <main className="relative mx-auto w-full max-w-full px-3 sm:px-8 lg:px-12 xl:px-16 pb-20 pt-4 sm:pb-24 sm:pt-6 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
