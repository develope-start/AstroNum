"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("light", savedTheme === "light");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full border border-brass/20 bg-ink-2/40 opacity-0" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="თემის შეცვლა"
      title={theme === "dark" ? "ნათელ რეჟიმზე გადართვა" : "ბნელ რეჟიმზე გადართვა"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-brass/30 bg-ink-2/60 text-brass-2 transition-all duration-300 hover:border-brass hover:bg-brass/10 hover:shadow-[0_0_15px_rgba(201,162,75,0.25)] dark:bg-slate-900/70 light:bg-amber-100/60 light:text-amber-800 light:border-amber-400/40"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
