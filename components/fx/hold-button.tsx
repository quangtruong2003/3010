"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

type HoldButtonProps = {
  duration?: number;
  onComplete: () => void;
  className?: string;
  children: React.ReactNode;
  label?: string;
};

/** Giữ (press-and-hold) để kích hoạt. Vòng tròn tiến trình romantic. */
export function HoldButton({ duration = 1400, onComplete, className = "", children, label }: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const raf = useRef(0);
  const start = useRef(0);
  const done = useRef(false);
  const reduced = useReducedMotion();

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (!done.current) setProgress(0);
    setActive(false);
    start.current = 0;
    done.current = false;
  }, []);

  const tick = useCallback(() => {
    const p = Math.min(1, (performance.now() - start.current) / duration);
    setProgress(p);
    if (p >= 1) {
      done.current = true;
      setProgress(0);
      setActive(false);
      onComplete();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [duration, onComplete]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const R = 30;
  const C = 2 * Math.PI * R;

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        done.current = false;
        start.current = performance.now();
        setActive(true);
        raf.current = requestAnimationFrame(tick);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative touch-none select-none ${className}`}
    >
      {children}
      {progress > 0 && (
        <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <svg className="h-18 w-18 -rotate-90" viewBox="0 0 72 72">
            {/* Background track */}
            <circle cx="36" cy="36" r={R} fill="none" stroke="rgb(244 182 200 / .12)" strokeWidth="3" />
            {/* Progress ring */}
            <motion.circle
              cx="36" cy="36" r={R} fill="none" stroke="#ec8fab" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 60ms linear", filter: "drop-shadow(0 0 8px #ec8fab)" }}
              animate={{ strokeDashoffset: C * (1 - progress) }}
              initial={false}
            />
            {/* Glow at progress head */}
            <motion.circle
              cx="36" cy="36" r={R} fill="none" stroke="#f9dbe5" strokeWidth="2" strokeLinecap="round"
              strokeDasharray="4, 1000" strokeDashoffset={C * (1 - progress)}
              animate={{ strokeDashoffset: C * (1 - progress), opacity: [0, 1, 0] }}
              transition={{ duration: 0.1 }}
            />
          </svg>
          <span className="absolute text-[10px] uppercase tracking-[.18em] text-rose-200/90">
            {progress > 0.95 ? "✦" : "Giữ…"}
          </span>
        </span>
      )}
      {/* Subtle ripple on press */}
      {active && !reduced && (
        <motion.span
          initial={{ scale: 0.95, opacity: 0.3 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-rose-300/30 pointer-events-none"
        />
      )}
    </button>
  );
}