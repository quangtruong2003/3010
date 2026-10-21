"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";

export type LightboxPhoto = { id: string; fallback: string; caption: string; date: string };

type Props = {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
};

/** Lightbox: chạm đúp zoom, pinch zoom, vuốt ngang đổi ảnh, ESC/backdrop đóng, focus trap. */
export function Lightbox({ photos, index, onClose, onIndexChange }: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [transitioning, setTransitioning] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const swipeStart = useRef<number | null>(null);
  const lastTap = useRef(0);
  const reduced = useReducedMotion();
  const photo = index === null ? null : photos[index];
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (index === null) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setTransitioning(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => setTransitioning(false), 300);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index !== null) onIndexChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft" && index !== null) onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [index, photos.length, onClose, onIndexChange]);

  if (!photo || index === null) return null;

  const src = failed[photo.id] ? photo.fallback : `/api/photo/${photo.id}`;

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
    } else {
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      swipeStart.current = e.clientX;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setScale(Math.min(4, Math.max(1, (pinchStart.current.scale * dist) / pinchStart.current.dist)));
      return;
    }
    if (dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (scale > 1) {
        setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
      } else if (swipeStart.current !== null && Math.abs(dx) > 50) {
        const dir = dx < 0 ? 1 : -1;
        swipeStart.current = null;
        setTransitioning(true);
        onIndexChange((index + dir + photos.length) % photos.length);
        setTimeout(() => setTransitioning(false), 300);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      dragStart.current = null;
      swipeStart.current = null;
    }
  };

  const handleDoubleClick = () => setScale(s => (s > 1 ? 1 : 2.5));

  const handleClick = () => {
    const now = performance.now();
    if (now - lastTap.current < 300) return;
    lastTap.current = now;
  };

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Xem ảnh"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/97 p-4 backdrop-blur-xl"
      >
        {/* Close button */}
        <motion.button
          onClick={onClose}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-4 top-4 z-10 rounded-full border border-rose-300/25 p-3 text-pearl hover:bg-rose-300/10 transition"
          aria-label="Đóng ảnh"
        >
          <X size={20} />
        </motion.button>

        {/* Nav buttons */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); onIndexChange((index - 1 + photos.length) % photos.length); }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-onyx/85 p-3 text-pearl sm:left-8 hover:bg-rose-300/10 transition"
          aria-label="Ảnh trước"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <motion.button
          onClick={(e) => { e.stopPropagation(); onIndexChange((index + 1) % photos.length); }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-onyx/85 p-3 text-pearl sm:right-8 hover:bg-rose-300/10 transition"
          aria-label="Ảnh tiếp theo"
        >
          <ChevronRight size={24} />
        </motion.button>

        {/* Zoom indicator */}
        {scale > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5 text-xs text-pearl/80 backdrop-blur"
          >
            <Maximize2 size={12} />
            <span>{Math.round(scale * 100)}%</span>
            <Minimize2 size={12} />
          </motion.div>
        )}

        <motion.div
          ref={containerRef}
          className="flex w-full max-w-4xl flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={containerRef}
            className="relative h-[58svh] max-h-[70vh] w-full touch-none overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            onClick={handleClick}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={photo.id}
                initial={transitioning ? { opacity: 0, scale: 0.98 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full w-full"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "center center" }}
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

          <AnimatePresence mode="wait">
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-5 w-full text-center"
            >
              <p className="font-display text-2xl italic text-pearl">{photo.caption}</p>
              <p className="mt-2 text-center text-xs tracking-[.18em] text-platinum">{photo.date}</p>
              <p className="mt-4 text-center text-[11px] text-platinum/70">
                {scale > 1 ? "Chạm đúp để thu nhỏ · " : "Chạm đúp để phóng to · "}
                Vuốt ngang để đổi ảnh · {index + 1}/{photos.length}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}