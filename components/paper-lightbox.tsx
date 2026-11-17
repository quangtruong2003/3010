"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { AnniversaryPhoto } from "@/config/anniversary";

export type PhotoLoadState = "loading" | "loaded" | "error";

interface PaperLightboxProps {
  photos: readonly AnniversaryPhoto[];
  selectedPhoto: number | null;
  closing: boolean;
  direction: number;
  reducedMotion: boolean;
  photoStates: Record<number, PhotoLoadState>;
  triggerRef: RefObject<HTMLElement | null>;
  onUpdatePhotoState: (index: number, state: PhotoLoadState) => void;
  onSelectIndex: (index: number, direction: number) => void;
  onStep: (delta: number) => void;
  onRequestClose: () => void;
  onClosed: () => void;
}

export function PaperLightbox({
  photos,
  selectedPhoto,
  closing,
  direction,
  reducedMotion,
  photoStates,
  triggerRef,
  onUpdatePhotoState,
  onSelectIndex,
  onStep,
  onRequestClose,
  onClosed,
}: PaperLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedPhoto !== null && !dialog.open) {
      dialog.showModal();
    }
    if (selectedPhoto === null && dialog.open) {
      dialog.close();
    }
  }, [selectedPhoto]);

  useEffect(() => {
    if (selectedPhoto === null || !filmstripRef.current) return;
    const activeThumb = filmstripRef.current.querySelector<HTMLButtonElement>(
      `[data-thumb-index="${selectedPhoto}"]`
    );
    activeThumb?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedPhoto, reducedMotion]);

  const selected = selectedPhoto === null ? null : photos[selectedPhoto];
  const canMove = !closing;

  return (
    <dialog
      ref={dialogRef}
      className={`photo-dialog${closing ? " photo-dialog--closing" : ""}`}
      aria-labelledby="photo-dialog-title"
      aria-describedby="photo-dialog-desc"
      onClose={() => {
        onClosed();
        triggerRef.current?.focus({ preventScroll: true });
      }}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onRequestClose();
        }
      }}
      onKeyDown={(event) => {
        if (!canMove) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onStep(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onStep(1);
        }
      }}
    >
      {selected && selectedPhoto !== null && (
        <>
          <div className="photo-dialog__topline">
            <div className="photo-dialog__meta">
              <p id="photo-dialog-title" className="photo-dialog__label">
                {selected.label}
              </p>
              <p id="photo-dialog-desc" className="photo-dialog__caption">
                {selected.alt}
              </p>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={onRequestClose}
              aria-label="Đóng khung xem ảnh"
            >
              <X aria-hidden="true" size={20} strokeWidth={1.8} />
            </button>
          </div>

          <div className="photo-dialog__stage" aria-live="polite">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={selectedPhoto}
                custom={direction}
                className="photo-dialog__slide"
                drag={reducedMotion ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.22}
                onDragEnd={(_event, info) => {
                  if (!canMove) return;
                  if (info.offset.x < -58 || info.velocity.x < -420) {
                    onStep(1);
                  } else if (info.offset.x > 58 || info.velocity.x > 420) {
                    onStep(-1);
                  }
                }}
                initial={{
                  opacity: 0,
                  transform: reducedMotion
                    ? "translateX(0px) scale(1)"
                    : `translateX(${direction * 24}px) scale(0.985)`,
                }}
                animate={{
                  opacity: 1,
                  transform: "translateX(0px) scale(1)",
                }}
                exit={{
                  opacity: 0,
                  transform: reducedMotion
                    ? "translateX(0px) scale(1)"
                    : `translateX(${direction * -20}px) scale(0.985)`,
                }}
                transition={{
                  duration: reducedMotion ? 0.12 : 0.22,
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                <Image
                  src={selected.src}
                  alt={selected.alt}
                  fill
                  sizes="(max-width: 768px) 96vw, 88vw"
                  unoptimized
                  className="photo-dialog__img"
                  draggable={false}
                  onLoad={() => onUpdatePhotoState(selectedPhoto, "loaded")}
                  onError={() => onUpdatePhotoState(selectedPhoto, "error")}
                />
                {photoStates[selectedPhoto] !== "loaded" && (
                  <div className="photo-dialog__status">
                    {photoStates[selectedPhoto] === "error" ? (
                      <div className="photo-dialog__empty">
                        <ImagePlus aria-hidden="true" size={28} strokeWidth={1.4} />
                        <p>Ảnh chưa hiện ra được. Em chuyển sang tấm kế bên xem tiếp nha.</p>
                      </div>
                    ) : (
                      <>
                        <ImagePlus aria-hidden="true" size={26} strokeWidth={1.5} />
                        <span>Đang mở {selected.label}…</span>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="photo-dialog__footer">
            <div className="photo-dialog__controls">
              <button
                type="button"
                className="icon-button"
                onClick={() => onStep(-1)}
                aria-label="Xem ảnh trước"
                disabled={!canMove}
              >
                <ChevronLeft aria-hidden="true" size={21} strokeWidth={1.8} />
              </button>
              <span className="photo-dialog__counter">
                {String(selectedPhoto + 1).padStart(2, "0")} /{" "}
                {String(photos.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                className="icon-button"
                onClick={() => onStep(1)}
                aria-label="Xem ảnh tiếp theo"
                disabled={!canMove}
              >
                <ChevronRight aria-hidden="true" size={21} strokeWidth={1.8} />
              </button>
            </div>

            <div
              ref={filmstripRef}
              className="photo-dialog__filmstrip"
              role="toolbar"
              aria-label="Chọn nhanh ảnh trong album"
            >
              {photos.map((photo, idx) => {
                const isActive = idx === selectedPhoto;
                return (
                  <button
                    key={photo.src}
                    type="button"
                    data-thumb-index={idx}
                    className={`filmstrip-thumb${isActive ? " is-active" : ""}`}
                    aria-label={`Xem ${photo.label}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => {
                      if (idx === selectedPhoto || !canMove) return;
                      onSelectIndex(idx, idx > selectedPhoto ? 1 : -1);
                    }}
                  >
                    <Image
                      src={photo.src}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="56px"
                      unoptimized
                      className="filmstrip-thumb__img"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
