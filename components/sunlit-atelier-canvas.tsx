"use client";

import { useEffect, useRef } from "react";

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DustMote {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vx: number;
  vy: number;
  phase: number;
  warm: boolean;
}

export function SunlitAtelierCanvas({
  reducedMotion,
  impulseKey = 0,
}: {
  reducedMotion: boolean;
  impulseKey?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energyRef = useRef(1);

  useEffect(() => {
    if (reducedMotion) return;
    energyRef.current = 1;
  }, [impulseKey, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rand = createSeededRandom(301004);
    const motes: DustMote[] = Array.from({ length: 28 }, () => ({
      x: rand(),
      y: rand(),
      radius: 1.1 + rand() * 2.4,
      alpha: 0.16 + rand() * 0.34,
      vx: (rand() - 0.35) * 0.00018,
      vy: (-0.25 - rand() * 0.45) * 0.00022,
      phase: rand() * Math.PI * 2,
      warm: rand() > 0.35,
    }));

    let width = 0;
    let height = 0;
    let rafId = 0;
    let inView = true;
    let pointerX = 0.5;
    let pointerY = 0.35;
    let lastTime = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (now: number) => {
      const dt = Math.min(34, now - lastTime);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Diagonal afternoon studio sunbeam from upper-left window
      const beamX = width * (0.24 + (pointerX - 0.5) * 0.05);
      const beamY = height * (0.14 + (pointerY - 0.5) * 0.04);
      const sunGradient = ctx.createRadialGradient(
        beamX,
        beamY,
        width * 0.04,
        width * 0.52,
        height * 0.54,
        Math.max(width, height) * 0.78
      );
      sunGradient.addColorStop(0, "rgba(255, 244, 218, 0.52)");
      sunGradient.addColorStop(0.45, "rgba(248, 226, 188, 0.20)");
      sunGradient.addColorStop(1, "rgba(244, 236, 224, 0)");
      ctx.fillStyle = sunGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle secondary warm rim glow near bottom-right botanical corner
      const rimGradient = ctx.createRadialGradient(
        width * 0.82,
        height * 0.78,
        width * 0.02,
        width * 0.82,
        height * 0.78,
        width * 0.42
      );
      rimGradient.addColorStop(0, "rgba(235, 184, 132, 0.16)");
      rimGradient.addColorStop(1, "rgba(244, 236, 224, 0)");
      ctx.fillStyle = rimGradient;
      ctx.fillRect(0, 0, width, height);

      const energy = reducedMotion ? 0 : energyRef.current;

      for (const mote of motes) {
        if (energy > 0.01) {
          const drift = Math.sin(now * 0.0012 + mote.phase) * 0.00012;
          mote.x += (mote.vx + drift) * dt * (0.35 + energy * 0.95);
          mote.y += mote.vy * dt * (0.35 + energy * 0.95);
          if (mote.x < -0.04) mote.x = 1.04;
          if (mote.x > 1.04) mote.x = -0.04;
          if (mote.y < -0.04) mote.y = 1.04;
        }

        const px = mote.x * width;
        const py = mote.y * height;
        const twinkle = reducedMotion
          ? 0.85
          : 0.72 + 0.28 * Math.sin(now * 0.002 + mote.phase);
        const alpha = mote.alpha * twinkle;

        ctx.beginPath();
        ctx.arc(px, py, mote.radius, 0, Math.PI * 2);
        ctx.fillStyle = mote.warm
          ? `rgba(218, 162, 78, ${alpha.toFixed(3)})`
          : `rgba(255, 250, 238, ${(alpha * 1.15).toFixed(3)})`;
        ctx.fill();
      }

      if (!reducedMotion && energyRef.current > 0.005) {
        // Settle gently within ~3.8s unless re-energized by user interaction
        energyRef.current = Math.max(0, energyRef.current - dt * 0.00028);
        if (inView && !document.hidden) {
          rafId = window.requestAnimationFrame(drawFrame);
        } else {
          rafId = 0;
        }
      } else {
        rafId = 0;
      }
    };

    const scheduleLoop = () => {
      if (reducedMotion || rafId !== 0 || !inView || document.hidden) return;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(drawFrame);
    };

    resize();
    drawFrame(performance.now());
    if (!reducedMotion) {
      scheduleLoop();
    }

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      energyRef.current = Math.max(energyRef.current, 0.72);
      scheduleLoop();
    };

    const onVisibilityChange = () => {
      if (document.hidden && rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!document.hidden && energyRef.current > 0.01) {
        scheduleLoop();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        inView = Boolean(entries[0]?.isIntersecting);
        if (!inView && rafId !== 0) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        } else if (inView && energyRef.current > 0.01) {
          scheduleLoop();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(canvas);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="atelier-canvas"
      aria-hidden="true"
    />
  );
}
