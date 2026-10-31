import type { Metadata, Viewport } from "next";
import "@fontsource/noto-sans-georgian/georgian-400.css";
import "@fontsource/noto-sans-georgian/georgian-600.css";
import "@fontsource/noto-sans-georgian/georgian-700.css";
import "@fontsource/noto-sans-georgian/latin-400.css";
import "@fontsource/noto-sans-georgian/latin-600.css";
import "@fontsource/noto-sans-georgian/latin-700.css";
import "@fontsource/noto-serif-georgian/georgian-400.css";
import "@fontsource/noto-serif-georgian/georgian-700.css";
import "@fontsource/noto-serif-georgian/latin-400.css";
import "@fontsource/noto-serif-georgian/latin-700.css";
import "./globals.css";
import "./prismline-aurora.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CosmicStarfield from "@/components/CosmicStarfield";
import FloatingContactHub from "@/components/FloatingContactHub";

export const viewport: Viewport = {
  themeColor: "#0a091e",
};

export const metadata: Metadata = {
  title: "AstroNum° — პროფესიონალური ასტროლოგიური გამოთვლები",
  description: "შვეიცარული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების შექმნა.",
  applicationName: "AstroNum",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "AstroNum° — პროფესიონალური ასტროლოგიური გამოთვლები",
    description: "შვეიცარული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების შექმნა.",
    siteName: "AstroNum",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AstroNum° ასტროლოგიური პლატფორმა",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AstroNum° — პროფესიონალური ასტროლოგიური გამოთვლები",
    description: "შვეიცარული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების შექმნა.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className="dark">
      <body className="app-body relative min-h-screen overflow-x-hidden bg-[#0a091e] text-slate-100 selection:bg-cyan-400 selection:text-slate-950 font-body">
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

        {/* Dynamic Interactive Canvas Starfield */}
        <CosmicStarfield />

        <Nav />
        <main className="relative mx-auto w-full max-w-full overflow-x-hidden px-4 pb-12 pt-3 sm:px-8 sm:pb-20 sm:pt-6 lg:px-12 xl:px-16">{children}</main>
        <Footer />
        <FloatingContactHub />
      </body>
    </html>
  );
}
