"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Petal Field v2 — Hoa rơi poetic, không mechanical.
 * Mỗi cánh có: physics-based fall (gravity + wind sway), rotation, scale pulse, opacity breath.
 * Dùng CSS custom properties + requestAnimationFrame cho control mượt nhất.
 */
export function PetalField({ count = 28 }: { count?: number }) {
  const reduced = useReducedMotion();
  const [petals, setPetals] = useState<Array<Petal>>([]);

  useEffect(() => {
    if (reduced) { setPetals([]); return; }

    // Tạo petals với properties phong phú cho variety tự nhiên
    const newPetals: Petal[] = Array.from({ length: count }, (_, i) => {
      const type = PETAL_TYPES[Math.floor(Math.random() * PETAL_TYPES.length)];
      const baseSize = 14 + Math.random() * 22; // 14-36px
      const startX = Math.random() * 100;
      const windPhase = Math.random() * Math.PI * 2;
      const fallDuration = 18 + Math.random() * 14; // 18-32s
      const delay = -Math.random() * 25; // staggered entry
      
      return {
        id: i,
        type,
        baseSize,
        startX,
        windPhase,
        fallDuration,
        delay,
        rotationSpeed: (Math.random() - 0.5) * 0.8, // deg/frame
        opacityBase: 0.18 + Math.random() * 0.22,
        opacityBreath: 0.05 + Math.random() * 0.08,
        scaleBreath: 0.92 + Math.random() * 0.12,
        swayAmplitude: 25 + Math.random() * 35, // px
        swayFrequency: 0.0008 + Math.random() * 0.0012,
      };
    });
    setPetals(newPetals);
  }, [count, reduced]);

  if (reduced || petals.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10 overflow-hidden" style={{ pointerEvents: "none" }}>
      {petals.map((p) => (
        <Petal key={p.id} petal={p} />
      ))}
      <style jsx>{PETAL_STYLES}</style>
    </div>
  );
}

interface Petal {
  id: number;
  type: PetalType;
  baseSize: number;
  startX: number;
  windPhase: number;
  fallDuration: number;
  delay: number;
  rotationSpeed: number;
  opacityBase: number;
  opacityBreath: number;
  scaleBreath: number;
  swayAmplitude: number;
  swayFrequency: number;
}

interface PetalType {
  name: string;
  width: number;
  height: number;
  borderRadius: string;
  path?: string; // SVG path for complex shapes
}

const PETAL_TYPES: PetalType[] = [
  { name: "rose", width: 1, height: 1.35, borderRadius: "50% 0 50% 0" },
  { name: "petal", width: 1, height: 1.2, borderRadius: "40% 60% 40% 60%" },
  { name: "heart", width: 1, height: 1, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" },
  { name: "leaf", width: 1, height: 1.4, borderRadius: "30% 70% 30% 70% / 60% 40% 60% 40%" },
  { name: "sakura", width: 1, height: 1, borderRadius: "50%" },
];

const PETAL_COLORS = [
  "radial-gradient(ellipse at 30% 30%, #fff0f5 0%, #f9dbe5 40%, #ec8fab 80%, #c0587c 100%)",
  "radial-gradient(ellipse at 40% 40%, #fef7f9 0%, #f4b6c8 50%, #dd6489 100%)",
  "radial-gradient(ellipse at 50% 50%, #fff5f7 0%, #fce7f3 45%, #f9a8d4 85%, #ec4899 100%)",
  "radial-gradient(ellipse at 35% 35%, #ffffff 0%, #fdf2f8 30%, #fbcfe8 70%, #db2777 100%)",
  "radial-gradient(ellipse at 45% 45%, #fefafa 0%, #fce7f3 50%, #f472b6 90%, #be185d 100%)",
];

function Petal({ petal }: { petal: Petal }) {
  const color = PETAL_COLORS[petal.id % PETAL_COLORS.length];
  const type = petal.type;
  const w = petal.baseSize;
  const h = w * (type.height / type.width);
  
  // CSS custom properties for animation
  const style: React.CSSProperties = {
    left: `${petal.startX}%`,
    width: w,
    height: h,
    background: color,
    borderRadius: type.borderRadius,
    opacity: petal.opacityBase,
    animationDuration: `${petal.fallDuration}s`,
    animationDelay: `${petal.delay}s`,
    // Custom properties for keyframes
    "--wind-phase": petal.windPhase.toFixed(3),
    "--sway-amp": `${petal.swayAmplitude}px`,
    "--sway-freq": petal.swayFrequency.toFixed(6),
    "--rot-speed": `${petal.rotationSpeed}deg`,
    "--opacity-base": petal.opacityBase.toFixed(3),
    "--opacity-breath": petal.opacityBreath.toFixed(3),
    "--scale-breath": petal.scaleBreath.toFixed(3),
    "--fall-duration": `${petal.fallDuration}s`,
    transform: `rotate(${Math.random() * 360}deg)`,
  };

  return (
    <div className="petal-v2" style={style} />
  );
}

const PETAL_STYLES = `
  .petal-v2 {
    position: absolute;
    top: -5vh;
    will-change: transform, opacity;
    filter: drop-shadow(0 1px 2px rgba(220,100,137,0.08)) drop-shadow(0 4px 8px rgba(220,100,137,0.04));
    animation: petal-fall-v2 var(--fall-duration) cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  }

  @keyframes petal-fall-v2 {
    0% {
      transform: 
        translate3d(calc(var(--sway-amp) * sin(var(--wind-phase))), -10vh, 0)
        rotate(0deg)
        scale(var(--scale-breath));
      opacity: 0;
    }
    8% {
      opacity: calc(var(--opacity-base) + var(--opacity-breath) * sin(var(--wind-phase)));
    }
    25% {
      transform: 
        translate3d(calc(var(--sway-amp) * 0.6 * sin(var(--wind-phase) + 1.57)), 25vh, 0)
        rotate(calc(var(--rot-speed) * 90))
        scale(var(--scale-breath));
    }
    50% {
      transform: 
        translate3d(calc(var(--sway-amp) * -0.3 * sin(var(--wind-phase) + 3.14)), 50vh, 0)
        rotate(calc(var(--rot-speed) * 180))
        scale(calc(var(--scale-breath) * 1.02));
      opacity: calc(var(--opacity-base) - var(--opacity-breath) * 0.5);
    }
    75% {
      transform: 
        translate3d(calc(var(--sway-amp) * 0.2 * sin(var(--wind-phase) + 4.71)), 75vh, 0)
        rotate(calc(var(--rot-speed) * 270))
        scale(var(--scale-breath));
    }
    92% {
      opacity: calc(var(--opacity-base) + var(--opacity-breath) * 0.3);
    }
    100% {
      transform: 
        translate3d(calc(var(--sway-amp) * sin(var(--wind-phase) + 6.28)), 115vh, 0)
        rotate(calc(var(--rot-speed) * 360))
        scale(var(--scale-breath));
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .petal-v2 {
      animation: none !important;
      opacity: 0 !important;
      display: none !important;
    }
  }
`;