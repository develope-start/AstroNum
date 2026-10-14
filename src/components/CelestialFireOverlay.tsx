"use client";

import { useEffect, useRef } from "react";

const SOURCE = "/celestial/202610122306%20(1).mp4";
const FRAME_WIDTH = 480;
const FRAME_HEIGHT = 640;

let sharedFireVideo: HTMLVideoElement | null = null;

export function preloadCelestialFireVideo() {
  if (typeof document === "undefined") return;
  if (!sharedFireVideo) {
    const video = document.createElement("video");
    video.src = SOURCE;
    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    video.autoplay = false;
    video.preload = "auto";
    video.className = "celestial-fire-source";
    video.style.position = "fixed";
    video.style.top = "-9999px";
    video.style.left = "-9999px";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);
    sharedFireVideo = video;
  }
}

/** Chroma-keys the MP4's black matte into real per-pixel transparency. */
export default function CelestialFireOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    preloadCelestialFireVideo();
    const video = sharedFireVideo;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!video || !canvas || !context) return;

    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
    let animationFrame = 0;
    let active = true;
    let lastVideoTime = -1;

    const stopPlayback = () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      video.pause();
      context.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    };

    const handleOutsideSelection = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".celestial-ruler, .celestial-earth")) {
        stopPlayback();
      }
    };

    // A new planet selection remounts the keyed stage and starts a fresh cycle.
    // Any other click cancels the current effect immediately.
    document.addEventListener("pointerdown", handleOutsideSelection, true);

    // Align canvas flush to the stage container (which is already pinned to bottom: 0)
    const syncCanvasToStage = () => {
      const stage = canvas.parentElement;
      if (!stage) return;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.bottom = "0px";
      canvas.style.left = "0px";
      canvas.style.right = "0px";
      canvas.style.top = "auto";
      canvas.style.setProperty("--celestial-fire-drop", "0px");
      canvas.style.setProperty("--celestial-stage-scale", "1");
    };

    syncCanvasToStage();
    const stage = canvas.parentElement;
    const resizeObserver = stage && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(syncCanvasToStage)
      : null;
    if (stage) resizeObserver?.observe(stage);

    video.loop = false;
    video.currentTime = 0;
    void video.play().catch(() => undefined);

    const smoothstep = (value: number) => {
      const t = Math.max(0, Math.min(1, value));
      return t * t * (3 - 2 * t);
    };

    const drawFrame = () => {
      if (!active) return;
      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth &&
        video.videoHeight &&
        video.currentTime !== lastVideoTime
      ) {
        lastVideoTime = video.currentTime;
        const sourceAspect = video.videoWidth / video.videoHeight;
        const targetAspect = FRAME_WIDTH / FRAME_HEIGHT;
        let sx = 0;
        let sy = 0;
        let sw = video.videoWidth;
        let sh = video.videoHeight;

        // Fill the person's full portrait frame instead of leaving the video small/inset.
        if (sourceAspect > targetAspect) {
          sw = video.videoHeight * targetAspect;
          sx = (video.videoWidth - sw) / 2;
        } else {
          sh = video.videoWidth / targetAspect;
          sy = (video.videoHeight - sh) / 2;
        }

        context.drawImage(video, sx, sy, sw, sh, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
        const frame = context.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
        const pixels = frame.data;

        for (let i = 0; i < pixels.length; i += 4) {
          const pixel = i / 4;
          const x = pixel % FRAME_WIDTH;
          const y = Math.floor(pixel / FRAME_WIDTH);
          const brightness = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
          // Remove the dark matte more firmly; preserve the bright flame/smoke detail.
          const t = Math.max(0, Math.min(1, (brightness - 24) / 88));
          let alpha = t * t * (3 - 2 * t);

          // Broad, soft alpha falloff blends smoke into the scene on top and sides.
          // Bottom edge sits flush without artificial fade-out gap.
          alpha *= smoothstep(x / (FRAME_WIDTH * 0.34));
          alpha *= smoothstep((FRAME_WIDTH - 1 - x) / (FRAME_WIDTH * 0.1));
          alpha *= smoothstep(y / (FRAME_HEIGHT * 0.34));

          pixels[i + 3] = Math.round(alpha * 255);
        }

        context.putImageData(frame, 0, 0);
      }
      if (!video.ended) animationFrame = window.requestAnimationFrame(drawFrame);
    };

    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      stopPlayback();
      document.removeEventListener("pointerdown", handleOutsideSelection, true);
      resizeObserver?.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="celestial-fire-smoke" aria-hidden="true" />;
}
