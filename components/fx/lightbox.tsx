"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";

export type LightboxPhoto = { id: string; fallback: string; caption: string; date: string };

type Props = {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
};

/** Lightbox v2 — Professional zoom/swipe with buttery smooth animations */
export function Lightbox({ photos, index, onClose, onIndexChange }: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const swipeStart = useRef<{ x: number; time: number } | null>(null);
  const lastTap = useRef(0);
  const reduced = useReducedMotion();
  const photo = index === null ? null : photos[index];
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset transform when photo changes
  useEffect(() => {
    if (index === null) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setDirection(null);
    setTransitioning(true);
    const timer = window.setTimeout(() => setTransitioning(false), 350);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index !== null) navigate(1);
      if (e.key === "ArrowLeft" && index !== null) navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [index, photos.length, onClose, onIndexChange]);

  const navigate = useCallback((dir: 1 | -1) => {
    if (index === null) return;
    setDirection(dir === 1 ? "right" : "left");
    setTransitioning(true);
    onIndexChange((index + dir + photos.length) % photos.length);
    setTimeout(() => setTransitioning(false), 400);
  }, [index, photos.length, onIndexChange]);

  if (!photo || index === null) return null;

  const src = failed[photo.id] ? photo.fallback : `/api/photo/${photo.id}`;

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { 
        dist: Math.hypot(a.x - b.x, a.y - b.y), 
        scale 
      };
    } else {
      dragStart.current = { 
        x: e.clientX, 
        y: e.clientY, 
        ox: offset.x, 
        oy: offset.y 
      };
      swipeStart.current = { x: e.clientX, time: performance.now() };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const newScale = Math.min(4, Math.max(1, (pinchStart.current.scale * dist) / pinchStart.current.dist));
      setScale(newScale);
      return;
    }

    if (dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      if (scale > 1) {
        // Pan when zoomed
        setOffset({ 
          x: dragStart.current.ox + dx, 
          y: dragStart.current.oy + dy 
        });
      } else if (swipeStart.current) {
        // Track swipe for navigation
        swipeStart.current = { ...swipeStart.current, x: e.clientX };
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    
    if (pointers.current.size < 2) pinchStart.current = null;
    
    // Check for swipe navigation
    if (dragStart.current && swipeStart.current && scale <= 1) {
      const dx = e.clientX - swipeStart.current.x;
      const dt = performance.now() - swipeStart.current.time;
      const velocity = Math.abs(dx) / dt;
      
      // Swipe threshold: 60px or high velocity
      if (Math.abs(dx) > 60 || (velocity > 0.3 && Math.abs(dx) > 30)) {
        const dir = dx < 0 ? 1 : -1;
        navigate(dir);
      }
    }
    
    if (pointers.current.size === 0) {
      dragStart.current = null;
      swipeStart.current = null;
    }
  };

  const handleDoubleClick = () => {
    setScale(s => s > 1 ? 1 : 2.5);
  };

  const handleClick = () => {
    const now = performance.now();
    if (now - lastTap.current < 300) return;
    lastTap.current = now;
  };

  // Spring config for smooth animations
  const spring = { type: "spring" as const, stiffness: 280, damping: 28, mass: 0.9 };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Xem ảnh"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.25 } }}
        onClick={onClose}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/98 p-4 backdrop-blur-2xl"
        style={{ backdropFilter: "blur(32px) saturate(150%)" }}
      >
        {/* Close button */}
        <motion.button
          onClick={onClose}
          initial={{ opacity: 0, scale: 0.7, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.7, rotate: 90 }}
          transition={spring}
          className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-rose-300/20 bg-onyx/80 text-pearl hover:bg-rose-300/15 hover:border-rose-300/40 hover:text-rose-300 transition-all duration-300"
          aria-label="Đóng ảnh"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}
        >
          <X size={22} />
        </motion.button>

        {/* Nav buttons */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          initial={{ opacity: 0, x: -30, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.8 }}
          transition={spring}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 grid h-14 w-14 place-items-center rounded-full bg-onyx/85 text-pearl sm:left-10 hover:bg-rose-300/15 hover:text-rose-300 transition-all duration-300"
          aria-label="Ảnh trước"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}
        >
          <ChevronLeft size={28} />
        </motion.button>
        <motion.button
          onClick={(e) => { e.stopPropagation(); navigate(1); }}
          initial={{ opacity: 0, x: 30, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.8 }}
          transition={spring}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 grid h-14 w-14 place-items-center rounded-full bg-onyx/85 text-pearl sm:right-10 hover:bg-rose-300/15 hover:text-rose-300 transition-all duration-300"
          aria-label="Ảnh tiếp theo"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}
        >
          <ChevronRight size={28} />
        </motion.button>

        {/* Zoom indicator */}
        {scale > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -10 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-ink/90 px-4 py-2 text-xs font-medium text-pearl backdrop-blur-xl border border-rose-300/20"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,.3)" }}
          >
            <Maximize2 size={14} />
            <span className="tabular-nums">{Math.round(scale * 100)}%</span>
            <Minimize2 size={14} />
          </motion.div>
        )}

        {/* Counter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 right-6 flex items-center gap-2 rounded-full bg-ink/80 px-4 py-2 text-xs text-platinum/70 backdrop-blur border border-rose-300/15"
        >
          <span className="font-display text-pearl">{index + 1}</span>
          <span className="text-rose-300/50">/</span>
          <span>{photos.length}</span>
        </motion.div>

        <motion.div
          className="flex w-full max-w-5xl flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image container with gesture handling */}
          <div
            ref={containerRef}
            className="relative h-[62svh] max-h-[75vh] w-full touch-none overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            onClick={handleClick}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={photo.id}
                custom={direction}
                initial={transitioning 
                  ? (direction === "right" ? { opacity: 0, x: 40, scale: 0.96 } 
                    : direction === "left" ? { opacity: 0, x: -40, scale: 0.96 }
                    : { opacity: 0, scale: 0.94 })
                  : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={transitioning
                  ? (direction === "right" ? { opacity: 0, x: -40, scale: 0.96 }
                    : direction === "left" ? { opacity: 0, x: 40, scale: 0.96 }
                    : { opacity: 0, scale: 0.94 })
                  : { opacity: 0, scale: 0.92 }}
                transition={{ 
                  duration: reduced ? 0 : 0.45, 
                  ease: [0.22, 1, 0.36, 1] 
                }}
                className="relative h-full w-full"
                style={{ 
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                  transformOrigin: "center center",
                  willChange: "transform"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={src}
                  alt={photo.caption}
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                  onError={() => setFailed(f => ({ ...f, [photo.id]: true }))}
                  onLoad={() => {}}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Caption */}
          <AnimatePresence mode="wait">
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: reduced ? 0 : 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 w-full max-w-3xl text-center px-4"
            >
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-2xl sm:text-3xl italic text-pearl leading-[1.3]"
              >
                {photo.caption}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-3 text-center text-xs tracking-[.18em] text-platinum"
              >
                {photo.date}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-5 text-center text-[11px] text-platinum/60"
              >
                {scale > 1 
                  ? "Chạm đúp để thu nhỏ · " 
                  : "Chạm đúp để phóng to · "}
                Vuốt ngang để đổi ảnh · 
                Pinch để zoom · 
                {index + 1}/{photos.length}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}