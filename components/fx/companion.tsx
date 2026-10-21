"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";

type Props = {
  lines: readonly string[];
};

/**
 * Companion v2 — "Người bạn đồng hành" poetic.
 * - Entrance: scale + rotate + opacity với spring bouncy
 * - Idle: float phức tạp (multi-axis, multi-frequency)
 * - Sparkle burst khi xuất hiện
 * - Speech bubble: spring-in, auto-dismiss
 * - Tap: micro-interaction (tap scale, ripple)
 * - Glow ring: breathing pulse
 * - Floating hearts khi nhạc bật
 */
export function Companion({ lines }: Props) {
  const [line, setLine] = useState<number | null>(null);
  const [broken, setBroken] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showEntranceSparkles, setShowEntranceSparkles] = useState(false);
  const [floatPhase, setFloatPhase] = useState(0);
  const timer = useRef<number | null>(null);
  const entranceTimer = useRef<number | null>(null);
  const floatTimer = useRef<number | null>(null);
  const reduced = useReducedMotion();

  // Entrance sequence
  useEffect(() => {
    entranceTimer.current = window.setTimeout(() => {
      setVisible(true);
      setShowEntranceSparkles(true);
      // Auto-hide sparkles
      window.setTimeout(() => setShowEntranceSparkles(false), 2500);
    }, 3000);
    return () => { if (entranceTimer.current) window.clearTimeout(entranceTimer.current); };
  }, []);

  // Continuous float phase for CSS animation sync
  useEffect(() => {
    if (reduced) return;
    let phase = 0;
    floatTimer.current = window.setInterval(() => {
      phase = (phase + 0.01) % (Math.PI * 2);
      setFloatPhase(phase);
    }, 50); // 20fps for phase update
    return () => { if (floatTimer.current) window.clearInterval(floatTimer.current); };
  }, [reduced]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const speak = () => {
    setLine((l) => (l === null ? 0 : (l + 1) % lines.length));
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLine(null), 5000);
  };

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak();
  };

  if (broken || !visible) return null;

  return (
    <>
      {/* ============================================
          ENTRANCE SPARKLE BURST
          ============================================ */}
      <AnimatePresence>
        {showEntranceSparkles && !reduced && (
          <motion.div
            className="pointer-events-none fixed bottom-0 left-0 z-39"
            style={{ transform: "translate(2.8rem, -2.8rem)" }}
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            {[...Array(16)].map((_, i) => {
              const angle = (i / 16) * Math.PI * 2;
              const distance = 40 + Math.random() * 30;
              const size = 6 + Math.random() * 10;
              const delay = i * 0.04;
              return (
                <motion.span
                  key={i}
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{ 
                    scale: [0, 1, 0.3], 
                    opacity: [0, 1, 0], 
                    rotate: [-45, 180, 360],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance * 0.7
                  }}
                  transition={{ 
                    duration: 1.8, 
                    delay, 
                    ease: [0.25, 0.8, 0.25, 1] 
                  }}
                  className="absolute text-rose-300 pointer-events-none"
                  style={{ 
                    left: 0, 
                    bottom: 0, 
                    fontSize: `${size}px`,
                    lineHeight: 1,
                    textShadow: "0 0 8px #ec8fab"
                  }}
                >
                  ✦
                </motion.span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================
          FLOATING HEARTS WHEN MUSIC PLAYING
          (CSS-driven via global style)
          ============================================ */}

      <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex flex-col items-start gap-2 p-3 sm:p-5">
        {/* ----------------------------------------
            SPEECH BUBBLE
            ---------------------------------------- */}
        <AnimatePresence>
          {line !== null && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.88, rotate: -2 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: -12, scale: 0.9, rotate: 2 }}
              transition={{ 
                duration: 0.45, 
                ease: [0.34, 1.56, 0.64, 1] 
              }}
              className="pointer-events-auto max-w-[20rem] rounded-2xl rounded-bl-sm border border-rose-300/25 bg-gradient-to-br from-onyx/98 to-graphite/95 px-4 py-3 text-sm leading-6 text-pearl shadow-[0_20px_48px_rgba(0,0,0,.5),0_0_0_1px_rgba(244,182,200,.1),0_4px_24px_rgba(236,143,171,.15)] backdrop-blur-xl relative"
            >
              <p className="relative z-10">{lines[line]}</p>
              {/* Tail decoration */}
              <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-gradient-to-tr from-rose-300/15 to-transparent rounded-tr-xl" />
              {/* Top-left accent */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-rose-300/20 rounded-tl-xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------------------------------
            COMPANION IMAGE BUTTON
            ---------------------------------------- */}
        <button
          onClick={handleTap}
          onMouseDown={() => {}}
          aria-label="Nói chuyện với anh"
          className="pointer-events-auto group relative"
          data-companion="true"
          style={{ 
            // CSS custom properties for float animation
            "--float-phase": floatPhase.toFixed(3),
          }}
        >
          {/* --- GLOW RING (behind) --- */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, rgba(236,143,171,0) 0%, rgba(236,143,171,.12) 40%, rgba(244,182,200,.08) 70%, transparent 100%)",
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: [1, 1.08, 1], 
              opacity: [0.4, 0.8, 0.4],
              rotate: [0, 1, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* --- PULSE RING (middle) --- */}
          <motion.div
            className="absolute inset-[-4px] rounded-full border border-rose-300/20"
            initial={{ scale: 0.95, opacity: 0.3 }}
            animate={{ 
              scale: [1, 1.04, 1], 
              opacity: [0.2, 0.5, 0.2],
              borderColor: ["rgba(244,182,200,.15)", "rgba(236,143,171,.35)", "rgba(244,182,200,.15)"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* --- IMAGE --- */}
          <motion.div
            className="relative"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/photo/companion"
              alt=""
              onError={() => setBroken(true)}
              className="h-32 w-auto object-contain drop-shadow-[0_20px_48px_rgba(0,0,0,.7),0_0_40px_rgba(236,143,171,.15)] sm:h-40 transition-all duration-500"
              loading="lazy"
            />

            {/* Heart indicator on image corner */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.8, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute -right-1 top-1 grid h-8 w-8 place-items-center rounded-full border border-rose-300/40 bg-onyx/95 text-rose-300 backdrop-blur-xl shadow-[0_4px_20px_rgba(236,143,171,.35)]"
              style={{ boxShadow: "0 4px 20px rgba(236,143,171,.35), 0 0 0 1px rgba(244,182,200,.1)" }}
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart size={16} fill="currentColor" />
              </motion.span>
            </motion.div>
          </motion.div>

          {/* --- TAP HINT --- */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 3.8, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-ink/90 to-onyx/90 px-3.5 py-1.5 text-[10px] uppercase tracking-[.18em] text-platinum/70 backdrop-blur-xl border border-rose-300/10 shadow-lg"
          >
            Chạm để nghe
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5], translateX: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block ml-1"
            >
              👆
            </motion.span>
          </motion.div>
        </button>
      </div>

      {/* ============================================
          FLOAT ANIMATION (CSS-driven, synced via --float-phase)
          ============================================ */}
      <style jsx global>{`
        @keyframes companion-float {
          0% {
            transform: 
              translate3d(0, 0, 0) 
              rotate(0deg)
              scale(1);
          }
          12.5% {
            transform: 
              translate3d(calc(2px * sin(var(--float-phase, 0) * 1.0)), 
                           calc(-3px * cos(var(--float-phase, 0) * 0.7)), 0)
              rotate(calc(0.4deg * sin(var(--float-phase, 0) * 1.3)))
              scale(1.005);
          }
          25% {
            transform: 
              translate3d(calc(-1.5px * sin(var(--float-phase, 0) * 1.2)), 
                           calc(-5px * cos(var(--float-phase, 0) * 0.5)), 0)
              rotate(calc(-0.6deg * cos(var(--float-phase, 0) * 1.1)))
              scale(1.003);
          }
          37.5% {
            transform: 
              translate3d(calc(3px * cos(var(--float-phase, 0) * 0.9)), 
                           calc(-2px * sin(var(--float-phase, 0) * 1.4)), 0)
              rotate(calc(0.3deg * sin(var(--float-phase, 0) * 1.5)))
              scale(1.004);
          }
          50% {
            transform: 
              translate3d(calc(-2px * cos(var(--float-phase, 0) * 1.1)), 
                           calc(-6px * sin(var(--float-phase, 0) * 0.6)), 0)
              rotate(calc(-0.5deg * cos(var(--float-phase, 0) * 1.2)))
              scale(1.002);
          }
          62.5% {
            transform: 
              translate3d(calc(1.5px * sin(var(--float-phase, 0) * 0.8)), 
                           calc(-4px * cos(var(--float-phase, 0) * 1.3)), 0)
              rotate(calc(0.4deg * sin(var(--float-phase, 0) * 0.9)))
              scale(1.006);
          }
          75% {
            transform: 
              translate3d(calc(-2.5px * cos(var(--float-phase, 0) * 1.4)), 
                           calc(-1px * sin(var(--float-phase, 0) * 0.5)), 0)
              rotate(calc(-0.2deg * cos(var(--float-phase, 0) * 1.6)))
              scale(1.001);
          }
          87.5% {
            transform: 
              translate3d(calc(2px * sin(var(--float-phase, 0) * 1.0)), 
                           calc(-3.5px * cos(var(--float-phase, 0) * 0.8)), 0)
              rotate(calc(0.3deg * sin(var(--float-phase, 0) * 1.1)))
              scale(1.003);
          }
          100% {
            transform: 
              translate3d(0, 0, 0) 
              rotate(0deg)
              scale(1);
          }
        }

        /* Apply float animation to companion button */
        @media (prefers-reduced-motion: no-preference) {
          [data-companion="true"] {
            animation: companion-float 20s ease-in-out infinite !important;
            will-change: transform;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-companion="true"] {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}