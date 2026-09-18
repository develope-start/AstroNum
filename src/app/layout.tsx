import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AstroNum° — პროფესიონალური ასტროლოგიური გამოთვლები",
  description: "შვეიცარული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების შექმნა.",
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
      <body className="app-body relative min-h-screen overflow-x-hidden star-field text-slate-100 selection:bg-violet-300 selection:text-slate-950">
        <div className="pointer-events-none fixed -top-48 left-1/2 -z-10 h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[150px]" />
        <div className="pointer-events-none fixed bottom-0 -right-48 -z-10 h-[520px] w-[520px] rounded-full bg-sky-500/5 blur-[130px]" />
        <Nav />
        <main className="relative mx-auto w-full max-w-full overflow-x-hidden px-4 pb-20 pt-2 sm:px-8 sm:pb-24 sm:pt-4 lg:px-12 xl:px-16">{children}</main>
      </body>
    </html>
  );
}
