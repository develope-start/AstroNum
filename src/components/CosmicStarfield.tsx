"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  layer: number; // 1 = far, 2 = mid, 3 = near
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  decay: number;
}

const STAR_COLORS = [
  "rgba(255, 255, 255,",
  "rgba(216, 180, 254,", // violet
  "rgba(125, 211, 252,", // cyan
  "rgba(253, 230, 138,", // gold
];

export default function CosmicStarfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    // Generate stars
    const starCount = Math.floor(Math.min(180, Math.max(80, (width * height) / 12000)));
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      const layer = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
      const baseAlpha = layer === 1 ? 0.35 + Math.random() * 0.3 : layer === 2 ? 0.55 + Math.random() * 0.35 : 0.75 + Math.random() * 0.25;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: layer === 1 ? 0.7 + Math.random() * 0.5 : layer === 2 ? 1.2 + Math.random() * 0.8 : 1.8 + Math.random() * 1.0,
        alpha: baseAlpha,
        baseAlpha,
        twinkleSpeed: 0.008 + Math.random() * 0.02,
        layer,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]!,
      });
    }

    let meteors: Meteor[] = [];
    let nextMeteorTime = Date.now() + 5000 + Math.random() * 6000;

    const spawnMeteor = () => {
      const startX = Math.random() * width * 0.8;
      const startY = Math.random() * (height * 0.4);
      meteors.push({
        x: startX,
        y: startY,
        length: 80 + Math.random() * 90,
        speed: 8 + Math.random() * 7,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 deg
        opacity: 0.85,
        decay: 0.015 + Math.random() * 0.01,
      });
      nextMeteorTime = Date.now() + 8000 + Math.random() * 12000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - width / 2) * 0.035;
      targetMouseY = (e.clientY - height / 2) * 0.035;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let isDocumentVisible = true;
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (!isDocumentVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Render stars
      const now = Date.now();
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]!;

        // Twinkle calculation
        star.alpha = star.baseAlpha + Math.sin(now * star.twinkleSpeed + i) * 0.25;
        if (star.alpha < 0.1) star.alpha = 0.1;
        if (star.alpha > 1) star.alpha = 1;

        // Parallax offset based on layer
        const offsetX = mouseX * star.layer * 0.4;
        const offsetY = mouseY * star.layer * 0.4;

        let posX = star.x + offsetX;
        let posY = star.y + offsetY;

        // Wrap around viewport edges
        if (posX < 0) posX += width;
        else if (posX > width) posX -= width;
        if (posY < 0) posY += height;
        else if (posY > height) posY -= height;

        ctx.fillStyle = `${star.color} ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(posX, posY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra glow for near bright stars
        if (star.layer === 3 && star.alpha > 0.6) {
          ctx.fillStyle = `${star.color} ${star.alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(posX, posY, star.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Handle meteors
      if (now > nextMeteorTime && meteors.length === 0) {
        spawnMeteor();
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]!;
        const endX = m.x - Math.cos(m.angle) * m.length;
        const endY = m.y - Math.sin(m.angle) * m.length;

        const gradient = ctx.createLinearGradient(m.x, m.y, endX, endY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
        gradient.addColorStop(0.3, `rgba(167, 139, 250, ${m.opacity * 0.7})`);
        gradient.addColorStop(1, "rgba(99, 102, 241, 0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Advance meteor
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= m.decay;

        if (m.opacity <= 0 || m.x > width + 100 || m.y > height + 100) {
          meteors.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[-15] block h-full w-full"
      aria-hidden="true"
    />
  );
}
