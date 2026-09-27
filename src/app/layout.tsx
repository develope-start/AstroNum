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
import "./simple-mode.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AstroNum° — პროფესიონალური ასტროლოგიური გამოთვლები",
  description: "შვეიცარული ეფემერიდის სიზუსტით ნატალური, სინასტრიული და ტრანზიტული ცის რუკების შექმნა.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedMode = localStorage.getItem('astronum_ui_mode');
                const expiresAt = Number(localStorage.getItem('astronum_ui_mode_expires') || 0);
                const valid = !expiresAt || expiresAt > Date.now();
                const mode = valid ? savedMode : 'dark';
                const isSimple = mode === 'simple' || window.location.pathname.startsWith('/simple');
                const isLight = mode === 'light' || mode === 'ultra';
                document.documentElement.classList.toggle('simple-document', isSimple);
                document.documentElement.classList.toggle('mode-ultra', !isSimple && isLight);
                document.documentElement.classList.remove('mode-simple', 'mode-simple-light');
                document.documentElement.classList.toggle('light', !isSimple && isLight);
                document.documentElement.classList.toggle('dark', !isSimple && !isLight);
                document.documentElement.setAttribute('data-ui-theme', isSimple ? 'simple' : (isLight ? 'light' : 'dark'));
              } catch (e) {}
            `,
          }}
        />
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
