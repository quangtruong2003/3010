"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HoldButtonProps = {
  duration?: number;
  onComplete: () => void;
  className?: string;
  children: React.ReactNode;
  label?: string;
};

/** Giữ (press-and-hold) để kích hoạt. Nhả sớm thì hủy. */
export function HoldButton({ duration = 1200, onComplete, className = "", children, label }: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const start = useRef(0);
  const done = useRef(false);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (!done.current) setProgress(0);
    start.current = 0;
  }, []);

  const tick = useCallback(() => {
    const p = Math.min(1, (performance.now() - start.current) / duration);
    setProgress(p);
    if (p >= 1) {
      done.current = true;
      setProgress(0);
      onComplete();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [duration, onComplete]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        done.current = false;
        start.current = performance.now();
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
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={R} fill="none" stroke="rgb(244 182 200 / .18)" strokeWidth="2" />
            <circle
              cx="32" cy="32" r={R} fill="none" stroke="#ec8fab" strokeWidth="2" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 60ms linear" }}
            />
          </svg>
          <span className="absolute text-[10px] uppercase tracking-[.18em] text-rose-200">Giữ…</span>
        </span>
      )}
    </button>
  );
}
