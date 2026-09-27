"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export type UiMode = "dark" | "light" | "simple";
type FullMode = "dark" | "light";

const MODE_KEY = "astronum_ui_mode";
const RETURN_MODE_KEY = "astronum_ui_return_mode";
const EXPIRES_KEY = "astronum_ui_mode_expires";
const MODE_TTL = 12 * 60 * 60 * 1000;

function readFullMode(value: string | null): FullMode {
  return value === "light" || value === "ultra" ? "light" : "dark";
}

function applyUiMode(mode: UiMode, returnMode: FullMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const fullMode = mode === "simple" ? returnMode : mode;
  const isLight = fullMode === "light";

  root.classList.toggle("simple-document", mode === "simple");
  root.classList.toggle("mode-ultra", mode !== "simple" && isLight);
  root.classList.remove("mode-simple", "mode-simple-light");
  root.classList.toggle("light", mode !== "simple" && isLight);
  root.classList.toggle("dark", mode !== "simple" && !isLight);
  root.setAttribute("data-ui-theme", mode === "simple" ? "simple" : (isLight ? "light" : "dark"));
}

function persistUiMode(mode: UiMode, returnMode: FullMode) {
  const expiresAt = Date.now() + MODE_TTL;
  try {
    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(RETURN_MODE_KEY, returnMode);
    localStorage.setItem(EXPIRES_KEY, String(expiresAt));
  } catch {
    // Ignore storage errors.
  }
  return expiresAt;
}

function clearStoredMode() {
  try {
    localStorage.removeItem(MODE_KEY);
    localStorage.removeItem(RETURN_MODE_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export default function UiModeToggle() {
  const pathname = usePathname();

  const [mode, setMode] = useState<UiMode>(() => {
    if (pathname?.startsWith("/simple")) return "simple";
    return typeof document !== "undefined" && document.documentElement.classList.contains("simple-document") ? "simple" : "dark";
  });
  const [returnMode, setReturnMode] = useState<FullMode>("dark");
  const expiryTimerRef = useRef<number | null>(null);

  const expireMode = () => {
    setMode("dark");
    setReturnMode("dark");
    clearStoredMode();
    applyUiMode("dark", "dark");
    window.dispatchEvent(new CustomEvent("astronum-ui-mode-changed", { detail: { mode: "dark" } }));
  };

  const scheduleExpiry = (expiresAt: number) => {
    if (expiryTimerRef.current) window.clearTimeout(expiryTimerRef.current);
    expiryTimerRef.current = expiresAt > Date.now()
      ? window.setTimeout(expireMode, expiresAt - Date.now())
      : null;
  };

  useEffect(() => {
    const isSimplePath = pathname?.startsWith("/simple") ?? false;
    let savedMode: UiMode = isSimplePath ? "simple" : "dark";
    let savedReturnMode: FullMode = "dark";
    let expiresAt = 0;

    try {
      const saved = localStorage.getItem(MODE_KEY);
      const savedExpiresAt = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
      const isLegacyMode = saved === "classic" || saved === "ultra";
      const isValid = !savedExpiresAt || savedExpiresAt > Date.now();

      if (!isSimplePath && isValid && (saved === "dark" || saved === "light" || saved === "simple")) {
        savedMode = saved;
        savedReturnMode = readFullMode(localStorage.getItem(RETURN_MODE_KEY));
        expiresAt = savedExpiresAt;
      } else if (isValid && isLegacyMode) {
        savedMode = readFullMode(saved);
        savedReturnMode = savedMode;
        expiresAt = persistUiMode(savedMode, savedReturnMode);
      } else if (savedExpiresAt && !isValid) {
        clearStoredMode();
      }
    } catch {
      // Keep the first-visit default: Dark mode.
    }

    setMode(savedMode);
    setReturnMode(savedReturnMode);
    applyUiMode(savedMode, savedReturnMode);
    scheduleExpiry(expiresAt);

    const handleExternalChange = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: UiMode; returnMode?: FullMode }>).detail;
      if (!detail?.mode || !["dark", "light", "simple"].includes(detail.mode)) return;
      const nextReturnMode = detail.returnMode === "light" ? "light" : "dark";
      setMode(detail.mode);
      setReturnMode(nextReturnMode);
      applyUiMode(detail.mode, nextReturnMode);
    };

    window.addEventListener("astronum-ui-mode-changed", handleExternalChange);
    return () => {
      if (expiryTimerRef.current) window.clearTimeout(expiryTimerRef.current);
      window.removeEventListener("astronum-ui-mode-changed", handleExternalChange);
    };
  }, []);

  const activeFullMode: FullMode = mode === "simple" ? returnMode : mode;
  const nextThemeLabel = activeFullMode === "dark" ? "LIGHT" : "DARK";
  const nextThemeMode: FullMode = activeFullMode === "dark" ? "light" : "dark";

  const changeTheme = () => {
    const nextReturnMode = nextThemeMode;
    const nextMode: UiMode = mode === "simple" ? "simple" : nextReturnMode;
    setReturnMode(nextReturnMode);
    setMode(nextMode);
    scheduleExpiry(persistUiMode(nextMode, nextReturnMode));
    applyUiMode(nextMode, nextReturnMode);
    window.dispatchEvent(new CustomEvent("astronum-ui-mode-changed", { detail: { mode: nextMode, returnMode: nextReturnMode } }));
  };

  const changeVersion = () => {
    const nextMode: UiMode = mode === "simple" ? activeFullMode : "simple";
    setMode(nextMode);
    scheduleExpiry(persistUiMode(nextMode, returnMode));
    applyUiMode(nextMode, returnMode);
    window.dispatchEvent(new CustomEvent("astronum-ui-mode-changed", { detail: { mode: nextMode, returnMode } }));
  };

  return (
    <div className="nav-mode-controls" aria-label="საიტის ვიზუალური რეჟიმები">
      {mode !== "simple" && (
        <button
          type="button"
          onClick={changeTheme}
          className={`nav-mode-orb-btn group ${nextThemeMode === "light" ? "is-light-target" : "is-dark-target"}`}
          aria-label={`${nextThemeLabel} რეჟიმზე გადასვლა`}
          title={`${nextThemeLabel} რეჟიმზე გადასვლა`}
        >
          <span className="nav-toggle-orb-wrap" aria-hidden="true">
            <span className={`nav-toggle-ping ${nextThemeMode === "light" ? "nav-toggle-ping-blue" : "nav-toggle-ping-red"}`} />
            <span className={`nav-toggle-orb ${nextThemeMode === "light" ? "nav-toggle-orb-blue" : "nav-toggle-orb-red"}`} />
          </span>
          <span className={`nav-toggle-label ${nextThemeMode === "light" ? "nav-toggle-label-blue" : "nav-toggle-label-red"}`}>
            {nextThemeLabel}
          </span>
        </button>
      )}

      {/* Single Toggle Button: One button to switch between Simple and Advanced */}
      <button
        type="button"
        onClick={changeVersion}
        className={`nav-version-btn ${mode === "simple" ? "nav-btn-advanced" : "nav-btn-simple"}`}
        title={mode === "simple" ? "Advanced დიზაინზე გადასვლა" : "Simple დიზაინზე გადასვლა"}
        aria-label={mode === "simple" ? "Advanced დიზაინზე გადასვლა" : "Simple დიზაინზე გადასვლა"}
      >
        <span className="nav-version-dot" aria-hidden="true" />
        <span>{mode === "simple" ? "ADVANCED" : "SIMPLE"}</span>
      </button>
    </div>
  );
}
