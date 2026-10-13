"use client";

import { type HTMLAttributes, useRef } from "react";

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  borderColor?: string;
}

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(129, 140, 248, 0.12)",
  borderColor = "rgba(56, 189, 248, 0.35)",
  onMouseMove,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    onMouseMove?.(e);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card group relative overflow-hidden rounded-2xl border transition-all duration-300 ${className}`}
      style={
        {
          "--spotlight-color": spotlightColor,
          "--spotlight-border": borderColor,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* Dynamic Cursor Spotlight Surface Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(450px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), var(--spotlight-color), transparent 75%)`,
        }}
        aria-hidden="true"
      />
      {/* Dynamic Cursor Spotlight Border Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          border: "1px solid transparent",
          maskImage: `radial-gradient(280px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), black, transparent)`,
          WebkitMaskImage: `radial-gradient(280px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), black, transparent)`,
          borderColor: "var(--spotlight-border)",
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
