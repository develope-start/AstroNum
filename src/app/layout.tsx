import type { Metadata } from "next";
import "@fontsource/noto-sans-georgian/georgian-400.css";
import "@fontsource/noto-sans-georgian/georgian-500.css";
import "@fontsource/noto-sans-georgian/georgian-600.css";
import "@fontsource/noto-sans-georgian/georgian-700.css";
import "@fontsource/noto-sans-georgian/georgian-800.css";
import "@fontsource/noto-sans-georgian/latin-400.css";
import "@fontsource/noto-sans-georgian/latin-500.css";
import "@fontsource/noto-sans-georgian/latin-600.css";
import "@fontsource/noto-sans-georgian/latin-700.css";
import "@fontsource/noto-sans-georgian/latin-800.css";
import "@fontsource/noto-serif-georgian/georgian-400.css";
import "@fontsource/noto-serif-georgian/georgian-500.css";
import "@fontsource/noto-serif-georgian/georgian-600.css";
import "@fontsource/noto-serif-georgian/georgian-700.css";
import "@fontsource/noto-serif-georgian/georgian-800.css";
import "@fontsource/noto-serif-georgian/latin-400.css";
import "@fontsource/noto-serif-georgian/latin-500.css";
import "@fontsource/noto-serif-georgian/latin-600.css";
import "@fontsource/noto-serif-georgian/latin-700.css";
import "@fontsource/noto-serif-georgian/latin-800.css";
import "./globals.css";
import "./prismline-aurora.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AstroNum° — პროფესიონალური ასტროლოგიური გამოთვლები",
  description: "შვეიცარული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების შექმნა.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className="dark">
      <body className="app-body relative min-h-screen overflow-x-hidden bg-[#02040a] text-slate-100 selection:bg-cyan-400 selection:text-slate-950 font-body">
        {/* Prismline Aurora Multi-Layer Ambient Canvas (Fixed Viewport Atmosphere) */}
        <div className="aurora-canvas pointer-events-none fixed inset-0 -z-20 overflow-hidden" aria-hidden="true">
          {/* Top Primary Horizontal Aurora Glow Ribbon (Aqua & Violet) */}
          <div className="aurora-horizontal-band aurora-band-top" />
          {/* Mid-Page Horizontal Aurora Ribbon (Violet & Magenta) */}
          <div className="aurora-horizontal-band aurora-band-mid" />
          {/* Lower Page Horizontal Aurora Ribbon (Magenta & Cyan) */}
          <div className="aurora-horizontal-band aurora-band-bottom" />

          {/* Starfield Texture */}
          <div className="star-matrix-overlay" />
        </div>

        {/* Document-Level Scrolling Horizontal Aurora Streams (Follows page scroll) */}
        <div className="aurora-scroll-canvas pointer-events-none absolute inset-x-0 top-0 -z-10 h-full w-full overflow-hidden" aria-hidden="true">
          <div className="aurora-scroll-stream aurora-stream-hero" />
          <div className="aurora-scroll-stream aurora-stream-calc" />
          <div className="aurora-scroll-stream aurora-stream-bento" />
          <div className="aurora-scroll-stream aurora-stream-academy" />
          <div className="aurora-scroll-stream aurora-stream-pricing" />
        </div>

        <Nav />
        <main className="relative mx-auto w-full max-w-full overflow-x-hidden px-4 pb-12 pt-3 sm:px-8 sm:pb-20 sm:pt-6 lg:px-12 xl:px-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
