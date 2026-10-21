"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const PETAL_SHAPES = [
  // Hoa hồng rơi
  { w: 10, h: 14, borderRadius: "50% 0 50% 0", rot: 0 },
  { w: 12, h: 16, borderRadius: "50% 0 50% 0", rot: 15 },
  { w: 8, h: 12, borderRadius: "50% 0 50% 0", rot: -10 },
  // Hoa nhỏ
  { w: 6, h: 6, borderRadius: "50%", rot: 0 },
  { w: 7, h: 7, borderRadius: "50%", rot: 0 },
  // Lá tim
  { w: 9, h: 9, borderRadius: "50% 0", rot: 45 },
  { w: 9, h: 9, borderRadius: "50% 0", rot: -45 },
];

const COLORS = [
  "linear-gradient(135deg, #f9dbe5 0%, #ec8fab 100%)",
  "linear-gradient(135deg, #f4b6c8 0%, #dd6489 100%)",
  "linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)",
  "linear-gradient(135deg, #fff1f2 0%, #fda4af 100%)",
  "linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)",
];

export function PetalField({ count = 24 }: { count?: number }) {
  const reduced = useReducedMotion();
  const [petals, setPetals] = useState<Array<{
    id: number;
    left: number;
    size: number;
    duration: number;
    delay: number;
    color: string;
    shape: typeof PETAL_SHAPES[0];
    opacity: number;
    sway: number;
  }>>([]);

  useEffect(() => {
    if (reduced) { setPetals([]); return; }

    const newPetals = Array.from({ length: count }, (_, i) => {
      const shape = PETAL_SHAPES[Math.floor(Math.random() * PETAL_SHAPES.length)];
      const baseSize = 16 + Math.random() * 20;
      return {
        id: i,
        left: Math.random() * 100,
        size: baseSize,
        duration: 14 + Math.random() * 12,
        delay: -Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape,
        opacity: 0.15 + Math.random() * 0.25,
        sway: 30 + Math.random() * 60,
      };
    });
    setPetals(newPetals);
  }, [count, reduced]);

  if (reduced || petals.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10 overflow-hidden" style={{ pointerEvents: "none" }}>
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute top-[-5vh] animate-petal-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.shape.h / p.shape.w),
            background: p.color,
            borderRadius: p.shape.borderRadius,
            opacity: p.opacity,
            transform: `rotate(${p.shape.rot}deg)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            filter: "drop-shadow(0 2px 4px rgba(220, 100, 137, 0.15))",
            // Custom sway via CSS variable
            "--sway": `${p.sway}px`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes petal-fall {
          0% { transform: translate3d(var(--sway, 30px), -10vh, 0) rotate(0deg); opacity: 0; }
          10% { opacity: var(--petal-opacity, 0.3); }
          30% { transform: translate3d(calc(var(--sway, 30px) * 0.3), 30vh, 0) rotate(120deg); }
          60% { transform: translate3d(calc(var(--sway, 30px) * -0.2), 60vh, 0) rotate(240deg); }
          90% { opacity: var(--petal-opacity, 0.2); transform: translate3d(calc(var(--sway, 30px) * 0.1), 90vh, 0) rotate(360deg); }
          100% { transform: translate3d(var(--sway, 30px), 110vh, 0) rotate(420deg); opacity: 0; }
        }
        .animate-petal-fall { animation: petal-fall linear infinite; }
      `}</style>
    </div>
  );
}