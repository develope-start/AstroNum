"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type LoadingPhase = "initial" | "navigation" | null;

const INITIAL_MINIMUM_MS = 800;
const NAVIGATION_MINIMUM_MS = 550;
const EXIT_ANIMATION_MS = 220;

/**
 * Gives the first visit and real route changes a consistent visual handoff.
 * It never waits for an arbitrary long animation: the screen stays visible
 * only until the application is ready, with a short minimum to avoid flicker.
 */
export default function AppLoadingScreen() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<LoadingPhase>("initial");
  const [isLeaving, setIsLeaving] = useState(false);
  const startedAtRef = useRef(Date.now());
  const hideTimerRef = useRef<number | null>(null);
  const routeKey = pathname;
  const lastRouteKeyRef = useRef(routeKey);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    const minimum = phase === "initial" ? INITIAL_MINIMUM_MS : NAVIGATION_MINIMUM_MS;
    const remaining = Math.max(0, minimum - (Date.now() - startedAtRef.current));

    clearTimers();
    hideTimerRef.current = window.setTimeout(() => {
      setIsLeaving(true);
      hideTimerRef.current = window.setTimeout(() => {
        setPhase(null);
        setIsLeaving(false);
        hideTimerRef.current = null;
      }, EXIT_ANIMATION_MS);
    }, remaining);
  }, [clearTimers, phase]);

  const startNavigation = useCallback(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    setIsLeaving(false);
    setPhase("navigation");
  }, [clearTimers]);

  useEffect(() => {
    const finishInitial = () => {
      const remaining = Math.max(0, INITIAL_MINIMUM_MS - (Date.now() - startedAtRef.current));
      clearTimers();
      hideTimerRef.current = window.setTimeout(() => {
        setIsLeaving(true);
        hideTimerRef.current = window.setTimeout(() => {
          setPhase(null);
          setIsLeaving(false);
          hideTimerRef.current = null;
        }, EXIT_ANIMATION_MS);
      }, remaining);
    };
    const revealWhenReady = () => requestAnimationFrame(finishInitial);
    if (document.readyState === "complete") revealWhenReady();
    else window.addEventListener("load", revealWhenReady, { once: true });

    return () => {
      window.removeEventListener("load", revealWhenReady);
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (lastRouteKeyRef.current === routeKey) return;
    lastRouteKeyRef.current = routeKey;
    if (phase === "navigation") finish();
  }, [finish, phase, routeKey]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      const isSameDocument = destination.pathname === current.pathname && destination.search === current.search;
      if (destination.origin !== current.origin || isSameDocument) return;

      startNavigation();
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [startNavigation]);

  if (!phase) return null;

  const isInitial = phase === "initial";
  return (
    <div
      className={`app-loading-screen${isLeaving ? " app-loading-screen-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={isInitial ? "აპლიკაცია იტვირთება" : "გვერდი იტვირთება"}
    >
      <div className="app-loading-content">
        <div className="app-loading-logo-wrap">
          <div className="brand-stardust-orbit app-loading-brand-orbit" aria-hidden="true">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle cx="50" cy="50" r="42" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="1" strokeDasharray="3 6" fill="none" />
              <circle cx="50" cy="8" r="2.5" fill="#f43f5e" className="drop-shadow-[0_0_6px_#f43f5e]" />
              <circle cx="92" cy="50" r="2" fill="#38bdf8" className="drop-shadow-[0_0_6px_#38bdf8]" />
              <circle cx="50" cy="92" r="2.5" fill="#eab308" className="drop-shadow-[0_0_6px_#eab308]" />
              <circle cx="8" cy="50" r="2" fill="#a855f7" className="drop-shadow-[0_0_6px_#a855f7]" />
            </svg>
          </div>
          <span className="brand-mark app-loading-logo-mark" aria-hidden="true">
            <img src="/icon-512.png" alt="" width={512} height={512} className="app-loading-logo" />
          </span>
        </div>
        <p className="app-loading-title">Astro<span>Num</span><b>Ge</b></p>
        <p className="app-loading-label">{isInitial ? "ვარსკვლავური სივრცე მზადდება" : "გადავდივართ ახალ სივრცეში"}</p>
      </div>
    </div>
  );
}
