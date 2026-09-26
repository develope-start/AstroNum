"use client";

import { useEffect, useState } from "react";

export type UiMode = "classic" | "ultra";

export default function UiModeToggle() {
  const [mode, setMode] = useState<UiMode>("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedMode = localStorage.getItem("astronum_ui_mode") as UiMode | null;
      if (savedMode === "ultra") {
        setMode("ultra");
        document.documentElement.classList.add("mode-ultra", "light");
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-ui-theme", "ultra");
      } else {
        setMode("classic");
        document.documentElement.classList.remove("mode-ultra", "light");
        document.documentElement.classList.add("dark");
        document.documentElement.removeAttribute("data-ui-theme");
      }
    } catch {
      // localStorage unavailable or restricted
    }

    const handleExternalChange = (e: Event) => {
      const detail = (e as CustomEvent<{ mode?: UiMode }>).detail;
      if (detail?.mode && (detail.mode === "classic" || detail.mode === "ultra")) {
        setMode(detail.mode);
      }
    };

    window.addEventListener("astronum-ui-mode-changed", handleExternalChange);
    return () => window.removeEventListener("astronum-ui-mode-changed", handleExternalChange);
  }, []);

  const toggleMode = () => {
    const nextMode: UiMode = mode === "classic" ? "ultra" : "classic";
    setMode(nextMode);

    try {
      localStorage.setItem("astronum_ui_mode", nextMode);
    } catch {
      // ignore storage errors
    }

    if (nextMode === "ultra") {
      document.documentElement.classList.add("mode-ultra", "light");
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-ui-theme", "ultra");
    } else {
      document.documentElement.classList.remove("mode-ultra", "light");
      document.documentElement.classList.add("dark");
      document.documentElement.removeAttribute("data-ui-theme");
    }

    window.dispatchEvent(
      new CustomEvent("astronum-ui-mode-changed", { detail: { mode: nextMode } }),
    );
  };

  const isUltra = mounted && mode === "ultra";

  return (
    <button
      type="button"
      onClick={toggleMode}
      role="switch"
      aria-checked={isUltra}
      aria-label={
        isUltra
          ? "ლურჯი ბურთულა: ჩართულია ახალი ღია Neo-Glass დიზაინი (დააჭირეთ ბნელზე დასაბრუნებლად)"
          : "წითელი ბურთულა: ჩართულია კლასიკური ბნელი დიზაინი (დააჭირეთ ახალ ღია დიზაინზე გადასასვლელად)"
      }
      title={
        isUltra
          ? "🔵 ახალი ღია Neo-Glass დიზაინი (დააჭირეთ ბნელ რეჟიმზე დასაბრუნებლად)"
          : "🔴 კლასიკური ბნელი რეჟიმი (დააჭირეთ ახალ ღია Neo-Glass დიზაინზე გადასასვლელად)"
      }
      className={`nav-mode-orb-btn group ${isUltra ? "is-ultra" : "is-classic"}`}
    >
      {/* Visual Beep Glow Pulse Beacon Orb */}
      <span className="nav-toggle-orb-wrap" aria-hidden="true">
        {/* Pulsing Sonar / Beep Glow Wave */}
        <span
          className={`nav-toggle-ping ${
            isUltra ? "nav-toggle-ping-blue" : "nav-toggle-ping-red"
          }`}
        />

        {/* Solid Luminous Radiant Bead */}
        <span
          className={`nav-toggle-orb ${
            isUltra ? "nav-toggle-orb-blue" : "nav-toggle-orb-red"
          }`}
        />
      </span>

      {/* Mode Badge Label */}
      <span
        className={`nav-toggle-label ${
          isUltra ? "nav-toggle-label-blue" : "nav-toggle-label-red"
        }`}
      >
        {isUltra ? "LIGHT" : "DARK"}
      </span>
    </button>
  );
}
