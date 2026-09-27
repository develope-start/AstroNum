"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

  root.classList.toggle("mode-ultra", isLight);
  root.classList.toggle("light", isLight);
  root.classList.toggle("dark", !isLight);
  root.setAttribute("data-ui-theme", isLight ? "light" : "dark");
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
  const isSimpleRoute = pathname?.startsWith("/simple") ?? false;

  const [mode, setMode] = useState<UiMode>("dark");
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
    let savedMode: UiMode = "dark";
    let savedReturnMode: FullMode = "dark";
    let expiresAt = 0;

    try {
      const saved = localStorage.getItem(MODE_KEY);
      const savedExpiresAt = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
      const isLegacyMode = saved === "classic" || saved === "ultra";
      const isValid = !savedExpiresAt || savedExpiresAt > Date.now();

      if (isValid && (saved === "dark" || saved === "light" || saved === "simple")) {
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

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("mode-simple", isSimpleRoute);
    }
  }, [isSimpleRoute]);

  const activeFullMode: FullMode = mode === "simple" ? returnMode : mode;
  const nextThemeLabel = activeFullMode === "dark" ? "LIGHT" : "DARK";
  const nextThemeMode: FullMode = activeFullMode === "dark" ? "light" : "dark";

  const changeTheme = () => {
    const nextReturnMode = nextThemeMode;
    const nextMode: UiMode = isSimpleRoute ? "simple" : nextReturnMode;
    setReturnMode(nextReturnMode);
    setMode(nextMode);
    scheduleExpiry(persistUiMode(nextMode, nextReturnMode));
    applyUiMode(nextMode, nextReturnMode);
    window.dispatchEvent(new CustomEvent("astronum-ui-mode-changed", { detail: { mode: nextMode, returnMode: nextReturnMode } }));
  };

  return (
    <div className="nav-mode-controls" aria-label="საიტის ვიზუალური რეჟიმები">
      {/* Light / Dark Mode Button - Preserved with original colors and orb */}
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

      {/* Identical Sized Dual Buttons: SIMPLE & ADVANCED */}
      <div className="nav-version-group" role="group" aria-label="დიზაინის ვერსია">
        <Link
          href="/simple"
          className={`nav-version-btn nav-btn-simple ${isSimpleRoute ? "is-active" : ""}`}
          aria-current={isSimpleRoute ? "page" : undefined}
          title="Simple დიზაინის გვერდზე გადასვლა"
        >
          <span className="nav-version-dot" aria-hidden="true" />
          <span>SIMPLE</span>
        </Link>

        <Link
          href="/"
          className={`nav-version-btn nav-btn-advanced ${!isSimpleRoute ? "is-active" : ""}`}
          aria-current={!isSimpleRoute ? "page" : undefined}
          title="Advanced დიზაინზე გადასვლა"
        >
          <span className="nav-version-dot" aria-hidden="true" />
          <span>ADVANCED</span>
        </Link>
      </div>
    </div>
  );
}
