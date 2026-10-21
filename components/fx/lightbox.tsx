"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxPhoto = { id: string; fallback: string; caption: string; date: string };

type Props = {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
};

/** Lightbox: chạm đúp để phóng to, pinch để zoom, vuốt ngang để đổi ảnh, khoá scroll nền. */
export function Lightbox({ photos, index, onClose, onIndexChange }: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const swipeStart = useRef<number | null>(null);
  const photo = index === null ? null : photos[index];

  useEffect(() => {
    if (index === null) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index !== null) onIndexChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft" && index !== null) onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, photos.length, onClose, onIndexChange]);

  if (!photo || index === null) return null;

  const src = failed[photo.id] ? photo.fallback : `/api/photo/${photo.id}`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Xem ảnh" onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/96 p-4 backdrop-blur-xl">
      <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-rose-300/25 p-3 text-pearl" aria-label="Đóng ảnh"><X size={20} /></button>
      <button onClick={(e) => { e.stopPropagation(); onIndexChange((index - 1 + photos.length) % photos.length); }} className="absolute left-2 top-1/2 z-10 rounded-full bg-onyx/85 p-3 text-pearl sm:left-8" aria-label="Ảnh trước"><ChevronLeft /></button>
      <button onClick={(e) => { e.stopPropagation(); onIndexChange((index + 1) % photos.length); }} className="absolute right-2 top-1/2 z-10 rounded-full bg-onyx/85 p-3 text-pearl sm:right-8" aria-label="Ảnh tiếp theo"><ChevronRight /></button>

      <div className="flex w-full max-w-4xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div
          className="relative h-[58svh] max-h-[70vh] w-full touch-none overflow-hidden"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.current.size === 2) {
              const [a, b] = [...pointers.current.values()];
              pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
            } else {
              dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
              swipeStart.current = e.clientX;
            }
          }}
          onPointerMove={(e) => {
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
              } else if (swipeStart.current !== null && Math.abs(dx) > 60) {
                const dir = dx < 0 ? 1 : -1;
                swipeStart.current = null;
                onIndexChange((index + dir + photos.length) % photos.length);
              }
            }
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            if (pointers.current.size < 2) pinchStart.current = null;
            if (pointers.current.size === 0) { dragStart.current = null; swipeStart.current = null; }
          }}
          onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2.5))}
        >
          <div className="relative h-full w-full transition-transform duration-200" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={photo.caption}
              draggable={false}
              className="h-full w-full select-none object-contain"
              onError={() => setFailed((f) => ({ ...f, [photo.id]: true }))}
            />
          </div>
        </div>

        <p className="mt-5 text-center font-display text-2xl italic text-pearl">{photo.caption}</p>
        <p className="mt-2 text-center text-xs tracking-[.18em] text-platinum">{photo.date}</p>
        <p className="mt-4 text-center text-[11px] text-platinum/80">Chạm đúp để phóng to · vuốt ngang để đổi ảnh · {index + 1}/{photos.length}</p>
      </div>
    </div>
  );
}
