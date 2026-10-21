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

/** Hold Button v2 — Premium press-and-hold với physics-based progress ring */
export function HoldButton({ duration = 1500, onComplete, className = "", children, label }: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const [burst, setBurst] = useState(false);
  const raf = useRef(0);
  const start = useRef(0);
  const done = useRef(false);
  const reduced = useReducedMotion();

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (!done.current) setProgress(0);
    setActive(false);
    setBurst(false);
    start.current = 0;
    done.current = false;
  }, []);

  const tick = useCallback(() => {
    const elapsed = performance.now() - start.current;
    const p = Math.min(1, elapsed / duration);
    setProgress(p);
    
    if (p >= 1) {
      done.current = true;
      setProgress(0);
      setActive(false);
      setBurst(true);
      onComplete();
      // Hide burst after animation
      window.setTimeout(() => setBurst(false), 600);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [duration, onComplete]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const R = 34;
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
        setBurst(false);
        raf.current = requestAnimationFrame(tick);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative touch-none select-none ${className}`}
      style={{ 
        "--progress": progress.toFixed(3),
        "--duration": `${duration}ms`
      }}
    >
      {children}
      
      {/* ============================================
          PROGRESS RING (SVG with motion)
          ============================================ */}
      {progress > 0 && (
        <motion.span
          initial={false}
          animate={{ opacity: [0, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute inset-0 grid place-items-center"
        >
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden>
            {/* Track glow */}
            <circle 
              cx="40" cy="40" r={R} 
              fill="none" 
              stroke="rgba(244,182,200,0.08)" 
              strokeWidth="4" 
            />
            {/* Track */}
            <circle 
              cx="40" cy="40" r={R} 
              fill="none" 
              stroke="rgba(244,182,200,0.18)" 
              strokeWidth="4" 
            />
            {/* Progress */}
            <motion.circle
              cx="40" cy="40" r={R} 
              fill="none" 
              stroke="url(#hold-gradient)" 
              strokeWidth="4" 
              strokeLinecap="round"
              strokeDasharray={C} 
              strokeDashoffset={C * (1 - progress)}
              style={{ 
                filter: "drop-shadow(0 0 6px #ec8fab) drop-shadow(0 0 12px rgba(236,143,171,0.5))",
                transition: "stroke-dashoffset 50ms linear"
              }}
              animate={{ 
                strokeDashoffset: C * (1 - progress),
                strokeWidth: progress > 0.95 ? [4, 6, 4] : 4
              }}
            />
            {/* Glow head at progress position */}
            <motion.circle
              cx="40" cy="40" r={R}
              fill="none"
              stroke="#fef3f5"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6, 10000"
              strokeDashoffset={C * (1 - progress)}
              animate={{ 
                strokeDashoffset: C * (1 - progress),
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 0.08 }}
            />
            <defs>
              <linearGradient id="hold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f9dbe5" />
                <stop offset="40%" stopColor="#ec8fab" />
                <stop offset="70%" stopColor="#dd6489" />
                <stop offset="100%" stopColor="#c0587c" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center text */}
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: progress > 0.95 ? [1, 1.2, 1] : 1,
              opacity: 1 
            }}
            className="absolute text-[11px] uppercase tracking-[.2em] text-rose-200/90 font-medium"
          >
            {progress > 0.95 ? "✦" : "Giữ…"}
          </motion.span>
        </motion.span>
      )}

      {/* ============================================
          BURST ANIMATION (on complete)
          ============================================ */}
      <AnimatePresence>
        {burst && !reduced && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <svg className="h-24 w-24" viewBox="0 0 100 100" aria-hidden>
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                return (
                  <motion.line
                    key={i}
                    x1="50" y1="50"
                    x2={50 + Math.cos(angle) * 45}
                    y2={50 + Math.sin(angle) * 35}
                    stroke="#f9dbe5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ strokeWidth: 0, opacity: 1 }}
                    animate={{ strokeWidth: 0, opacity: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.02, ease: "easeOut" }}
                  />
                );
              })}
              {/* Central flash */}
              <motion.circle
                cx="50" cy="50" r="8"
                fill="url(#burst-gradient)"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <defs>
                  <radialGradient id="burst-gradient">
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="60%" stopColor="#f9dbe5" />
                    <stop offset="100%" stopColor="#ec8fab" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </motion.circle>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================
          RIPPLE ON PRESS
          ============================================ */}
      {active && !reduced && (
        <motion.span
          initial={{ scale: 0.92, opacity: 0.4 }}
          animate={{ scale: 1.15, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-rose-300/30 pointer-events-none"
        />
      )}

      {/* ============================================
          SUBTLE GLOW BEHIND BUTTON
          ============================================ */}
      <motion.span
        className="absolute -inset-2 rounded-full bg-gradient-to-r from-rose-400/0 via-rose-300/05 to-rose-400/0"
        animate={{ 
          scale: [1, 1.02, 1], 
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </button>
  );
}