"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type Props = {
  lines: readonly string[];
};

/**
 * Companion: ảnh cắt toàn thân ở góc màn hình.
 * Ảnh thật: /api/photo/companion (kiểm tra cookie).
 * Hiệu ứng: float nhẹ, bấm hiện lời ngẫu nhiên,.sparkle khi xuất hiện.
 */
export function Companion({ lines }: Props) {
  const [line, setLine] = useState<number | null>(null);
  const [broken, setBroken] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const timer = useRef<number | null>(null);
  const sparkleTimer = useRef<number | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const t = window.setTimeout(() => {
      setVisible(true);
      setShowSparkles(true);
      sparkleTimer.current = window.setTimeout(() => setShowSparkles(false), 2000);
    }, 2800);
    return () => { window.clearTimeout(t); if (sparkleTimer.current) window.clearTimeout(sparkleTimer.current); };
  }, []);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const speak = () => {
    setLine((l) => (l === null ? 0 : (l + 1) % lines.length));
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLine(null), 4500);
  };

  if (broken || !visible) return null;

  return (
    <>
      {/* Sparkle burst when companion appears */}
      {showSparkles && !reduced && (
        <div className="pointer-events-none fixed bottom-0 left-0 z-39" style={{ transform: "translate(2.5rem, -2.5rem)" }}>
          {[...Array(12)].map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 1, rotate: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [1, 0.8, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 1.2, delay: i * 0.05, ease: "easeOut" }}
              className="absolute text-rose-300"
              style={{
                left: `${(Math.random() - 0.5) * 60}px`,
                bottom: `${(Math.random() - 0.5) * 60}px`,
                fontSize: `${8 + Math.random() * 8}px`,
              }}
            >
              ✦
            </motion.span>
          ))}
        </div>
      )}

      <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex flex-col items-start gap-2 p-3 sm:p-5">
        {/* Speech bubble */}
        {line !== null && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="pointer-events-auto max-w-[18rem] rounded-2xl rounded-bl-sm border border-rose-300/25 bg-onyx/95 px-4 py-3 text-sm leading-6 text-pearl shadow-[0_12px_32px_rgba(0,0,0,.4)] backdrop-blur-xl"
            style={{ boxShadow: "0 12px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(244,182,200,.08)" }}
          >
            <p className="relative z-10">{lines[line]}</p>
            {/* Decorative corner */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-rose-300/10 rounded-tr-xl" />
          </motion.div>
        )}

        {/* Companion image */}
        <button
          onClick={speak}
          aria-label="Nói chuyện với anh"
          className="pointer-events-auto group relative"
          style={{ animation: reduced ? "none" : "float-gentle 6s ease-in-out infinite" }}
        >
          {/* Glow ring behind */}
          <motion.div
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-rose-400/0 via-rose-300/10 to-rose-400/0"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/photo/companion"
            alt=""
            onError={() => setBroken(true)}
            className="relative h-32 w-auto object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,.7)] sm:h-40 transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          
          {/* Heart indicator */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-rose-300/40 bg-onyx/90 text-rose-300 backdrop-blur"
            style={{ boxShadow: "0 4px 20px rgba(236,143,171,.3)" }}
          >
            <Heart size={15} fill="currentColor" className="animate-pulse" />
          </motion.div>

          {/* Tap hint */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.5, duration: 0.6 }}
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/80 px-3 py-1.5 text-[10px] uppercase tracking-[.18em] text-platinum/70 backdrop-blur"
          >
            Chạm để nghe
          </motion.div>
        </button>
      </div>

      <style jsx>{`
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          25% { transform: translateY(-4px) rotate(0.5deg); }
          50% { transform: translateY(-2px) rotate(0deg); }
          75% { transform: translateY(-6px) rotate(-0.3deg); }
        }
      `}</style>
    </>
  );
}