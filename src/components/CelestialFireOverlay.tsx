"use client";

import { useEffect, useRef } from "react";

const SOURCE = "/celestial/202610122306%20(1).mp4";
const FRAME_WIDTH = 480;
const FRAME_HEIGHT = 640;
const LOOP_START_SECONDS = 5.3;
const LOOP_END_SECONDS = 11.3;
const LOOP_FPS = 18;
const LOOP_FRAME_INTERVAL_MS = 1000 / LOOP_FPS;
const CACHED_FRAME_WIDTH = 240;
const CACHED_FRAME_HEIGHT = 320;

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
    let playbackMode: "source" | "reverse" | "forward" = "source";
    let loopFrames: HTMLCanvasElement[] = [];
    let loopFrameIndex = 0;
    let lastLoopFrameTime = 0;
    let lastCachedVideoTime = -Infinity;

    const stopPlayback = () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      video.pause();
      loopFrames = [];
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
    video.playbackRate = 1;
    // The shared video is preloaded while the page is open. Avoid seeking to
    // zero when it is already there; that seek can blank the first painted frame.
    if (video.ended || video.currentTime > 0.04) video.currentTime = 0;
    void video.play().catch(() => undefined);

    const smoothstep = (value: number) => {
      const t = Math.max(0, Math.min(1, value));
      return t * t * (3 - 2 * t);
    };

    const drawFrame = (timestamp: number) => {
      if (!active) return;
      if (playbackMode !== "source") {
        if (timestamp - lastLoopFrameTime >= LOOP_FRAME_INTERVAL_MS && loopFrames.length > 1) {
          context.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
          context.drawImage(loopFrames[loopFrameIndex], 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
          lastLoopFrameTime = timestamp;

          if (playbackMode === "reverse") {
            loopFrameIndex -= 1;
            if (loopFrameIndex < 0) {
              playbackMode = "forward";
              loopFrameIndex = 1;
            }
          } else {
            loopFrameIndex += 1;
            if (loopFrameIndex >= loopFrames.length) {
              playbackMode = "reverse";
              loopFrameIndex = loopFrames.length - 2;
            }
          }
        }
        animationFrame = window.requestAnimationFrame(drawFrame);
        return;
      }
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

        const loopEnd = Number.isFinite(video.duration)
          ? Math.min(LOOP_END_SECONDS, video.duration)
          : LOOP_END_SECONDS;
        const loopStart = Math.min(LOOP_START_SECONDS, Math.max(0, loopEnd - 0.5));
        if (
          video.currentTime >= loopStart &&
          video.currentTime - lastCachedVideoTime >= 1 / LOOP_FPS
        ) {
          const cached = document.createElement("canvas");
          cached.width = CACHED_FRAME_WIDTH;
          cached.height = CACHED_FRAME_HEIGHT;
          const cachedContext = cached.getContext("2d");
          if (cachedContext) {
            cachedContext.drawImage(canvas, 0, 0, CACHED_FRAME_WIDTH, CACHED_FRAME_HEIGHT);
            loopFrames.push(cached);
            lastCachedVideoTime = video.currentTime;
          }
        }

        if (video.currentTime >= loopEnd && loopFrames.length > 1) {
          // The 5.5–7s keyed frames are already in memory: bounce between them
          // without seeking/reloading the MP4 at the loop boundary.
          video.pause();
          playbackMode = "reverse";
          loopFrameIndex = loopFrames.length - 1;
          lastLoopFrameTime = timestamp;
        }
      }
      if (playbackMode !== "source" || !video.ended) {
        animationFrame = window.requestAnimationFrame(drawFrame);
      }
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
