"use client";

import Image from "next/image";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { gsap } from "gsap";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Heart,
  ImagePlus,
  LayoutGrid,
  Mail,
  MailOpen,
  Menu,
  RotateCcw,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";
import {
  Fragment,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { anniversary } from "@/config/anniversary";
import type { AnniversaryPhoto } from "@/config/anniversary";
import { PaperLightbox } from "@/components/paper-lightbox";
import type { PhotoLoadState } from "@/components/paper-lightbox";
import { SunlitAtelierCanvas } from "@/components/sunlit-atelier-canvas";

type OpeningState =
  | "envelope-idle"
  | "envelope-opening"
  | "theater-reveal"
  | "scroll-invitation";

type AlbumFilter = "all" | "portrait" | "wide" | "tall";
type AlbumLayout = "scrapbook" | "contact";

export default function AnniversaryPage() {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = Boolean(prefersReducedMotion);

  const [unlocked, setUnlocked] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);
  const [canvasImpulse, setCanvasImpulse] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeChapter, setActiveChapter] = useState(0);
  const [albumFilter, setAlbumFilter] = useState<AlbumFilter>("all");
  const [albumLayout, setAlbumLayout] = useState<AlbumLayout>("scrapbook");

  const [letterOpen, setLetterOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [photoStates, setPhotoStates] = useState<Record<number, PhotoLoadState>>({});
  const [closingDialog, setClosingDialog] = useState(false);
  const [photoDirection, setPhotoDirection] = useState(1);

  const [heartCount, setHeartCount] = useState(4);
  const [heartBurstId, setHeartBurstId] = useState(0);
  const [liveStatus, setLiveStatus] = useState("");

  const progressBarRef = useRef<HTMLSpanElement>(null);
  const photoTriggerRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  // Reduced motion visitors immediately unlock the entire keepsake per DESIGN.md
  useEffect(() => {
    if (reducedMotion) {
      setUnlocked(true);
    }
  }, [reducedMotion]);

  // Hydrate saved heart seal count safely after mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("anniversary-hearts-v2");
      if (saved) {
        const parsed = Number.parseInt(saved, 10);
        if (Number.isFinite(parsed) && parsed >= 4) {
          setHeartCount(parsed);
        }
      }
    } catch {
      // Ignore storage access restrictions
    }
  }, []);

  // Zero-render GPU scroll progress bar + section reveal observer
  useEffect(() => {
    const updateScrollProgress = () => {
      const bar = progressBarRef.current;
      if (!bar) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, [unlocked, letterOpen, noteOpen, albumFilter, albumLayout]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  // Observe story walkthrough beats on scroll
  useEffect(() => {
    if (!unlocked) return;
    const nodes = chapterRefs.current.filter(
      (node): node is HTMLElement => node !== null
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-chapter-idx"));
            if (Number.isFinite(idx)) {
              setActiveChapter(idx);
            }
          }
        }
      },
      { rootMargin: "-28% 0px -42% 0px", threshold: 0.25 }
    );

    for (const node of nodes) {
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, [unlocked]);

  // Observe paper sections for one-time clip-path / opacity entrance
  useEffect(() => {
    if (!unlocked) return;
    if (reducedMotion) {
      document
        .querySelectorAll<HTMLElement>("[data-paper-reveal]")
        .forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const targets = document.querySelectorAll<HTMLElement>("[data-paper-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [unlocked, reducedMotion]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  const updatePhotoState = useCallback((index: number, state: PhotoLoadState) => {
    setPhotoStates((current) =>
      current[index] === state ? current : { ...current, [index]: state }
    );
  }, []);

  const openPhoto = useCallback((index: number, trigger: HTMLElement) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    photoTriggerRef.current = trigger;
    setClosingDialog(false);
    setPhotoDirection(1);
    setSelectedPhoto(index);
  }, []);

  const requestClosePhoto = useCallback(() => {
    if (closingDialog) return;
    setClosingDialog(true);
    closeTimerRef.current = setTimeout(
      () => {
        setSelectedPhoto(null);
        setClosingDialog(false);
        closeTimerRef.current = null;
      },
      reducedMotion ? 0 : 170
    );
  }, [closingDialog, reducedMotion]);

  const stepPhoto = useCallback((delta: number) => {
    setPhotoDirection(delta);
    setSelectedPhoto((index) =>
      index === null
        ? null
        : (index + delta + anniversary.photos.length) % anniversary.photos.length
    );
  }, []);

  const selectPhotoIndex = useCallback((index: number, direction: number) => {
    setPhotoDirection(direction);
    setSelectedPhoto(index);
  }, []);

  const openRandomPhoto = (trigger: HTMLButtonElement) => {
    const randomIndex = Math.floor(Math.random() * anniversary.photos.length);
    openPhoto(randomIndex, trigger);
    setLiveStatus(`Đang mở ngẫu nhiên ${anniversary.photos[randomIndex].label}`);
  };

  const filterCounts = useMemo(() => {
    let portrait = 0;
    let wide = 0;
    let tall = 0;
    for (const p of anniversary.photos) {
      if (p.shape === "portrait") portrait += 1;
      else if (p.shape === "landscape" || p.shape === "square") wide += 1;
      else if (p.shape === "tall") tall += 1;
    }
    return {
      all: anniversary.photos.length,
      portrait,
      wide,
      tall,
    };
  }, []);

  const filteredPhotos = useMemo(() => {
    return anniversary.photos
      .map((photo, originalIndex) => ({ photo, originalIndex }))
      .filter(({ photo }) => {
        if (albumFilter === "all") return true;
        if (albumFilter === "portrait") return photo.shape === "portrait";
        if (albumFilter === "wide")
          return photo.shape === "landscape" || photo.shape === "square";
        return photo.shape === "tall";
      });
  }, [albumFilter]);

  const handleFilterChange = (nextFilter: AlbumFilter, label: string) => {
    startTransition(() => {
      setAlbumFilter(nextFilter);
    });
    setLiveStatus(`Đã lọc album: ${label}`);
  };

  const jumpToLetterAndOpen = () => {
    setMobileMenuOpen(false);
    setLetterOpen(true);
    const el = document.getElementById("letter");
    el?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  const jumpToCardAndOpen = () => {
    setMobileMenuOpen(false);
    setNoteOpen(true);
    const el = document.getElementById("note");
    el?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  const handleReplayEnvelope = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    setCanvasImpulse((n) => n + 1);
    setReplayNonce((n) => n + 1);
    setLiveStatus("Đã gấp lại phong bì kỷ niệm ở đầu trang.");
  };

  const handlePressHeartSeal = () => {
    setHeartCount((prev) => {
      const next = prev + 1;
      try {
        window.localStorage.setItem("anniversary-hearts-v2", String(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
    setHeartBurstId((id) => id + 1);
    setLiveStatus("Đã gửi thêm một dấu tim kỷ niệm.");
  };

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Chuyển thẳng đến nội dung chính
      </a>

      <div className="visually-hidden" role="status" aria-live="polite">
        {liveStatus}
      </div>

      {unlocked && (
        <header className="site-header">
          <div className="site-header__inner">
            <a
              className="site-mark"
              href="#top"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Về đầu trang: 4 năm bên nhau"
            >
              <span className="site-mark__seal" aria-hidden="true">
                <Heart size={15} fill="currentColor" strokeWidth={1.8} />
              </span>
              <span className="site-mark__text">4 năm bên nhau</span>
            </a>

            <nav aria-label="Điều hướng chương kỷ niệm" className="site-nav">
              <a href="#top">Sân khấu</a>
              <a href="#highlights">Chặng đường</a>
              <a href="#moments">Album 20 ảnh</a>
              <a href="#letter">Lá thư</a>
              <a href="#note">Thiệp chúc</a>
            </nav>

            <div className="site-header__actions">
              <button
                type="button"
                className="header-cta"
                onClick={jumpToLetterAndOpen}
              >
                <MailOpen aria-hidden="true" size={16} strokeWidth={1.8} />
                <span>Đọc thư tay</span>
              </button>

              <button
                type="button"
                className="mobile-menu-toggle"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-sheet"
                aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? (
                  <X aria-hidden="true" size={20} strokeWidth={1.9} />
                ) : (
                  <Menu aria-hidden="true" size={20} strokeWidth={1.9} />
                )}
              </button>
            </div>
          </div>

          <span
            ref={progressBarRef}
            className="site-header__progress"
            aria-hidden="true"
          />

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                id="mobile-nav-sheet"
                className="mobile-nav-sheet"
                initial={{ opacity: 0, transform: "translateY(-8px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                exit={{ opacity: 0, transform: "translateY(-6px)" }}
                transition={{ duration: reducedMotion ? 0.08 : 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                <nav aria-label="Menu di động" className="mobile-nav-sheet__links">
                  <a href="#top" onClick={() => setMobileMenuOpen(false)}>
                    <span>Sân khấu giấy</span>
                    <small>Khung hình mở màn</small>
                  </a>
                  <a href="#highlights" onClick={() => setMobileMenuOpen(false)}>
                    <span>Chặng đường 4 năm</span>
                    <small>4 lát cắt thương nhớ</small>
                  </a>
                  <a href="#moments" onClick={() => setMobileMenuOpen(false)}>
                    <span>Album 20 tấm ảnh</span>
                    <small>Toàn bộ khung hình kỷ niệm</small>
                  </a>
                  <a href="#letter" onClick={() => setMobileMenuOpen(false)}>
                    <span>Lá thư gửi em yêu</span>
                    <small>Đôi lời anh viết riêng</small>
                  </a>
                  <a href="#note" onClick={() => setMobileMenuOpen(false)}>
                    <span>Thiệp gấp cuối trang</span>
                    <small>Lời chúc tròn 4 năm</small>
                  </a>
                </nav>
                <div className="mobile-nav-sheet__footer">
                  <button
                    type="button"
                    className="paper-button paper-button--full"
                    onClick={jumpToLetterAndOpen}
                  >
                    <MailOpen aria-hidden="true" size={17} />
                    <span>Mở đọc lá thư của anh</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      <main id="main" className="page-shell">
        {/* ACT I: HERO — CLOSED TACTILE ENVELOPE -> LIVE INTERACTIVE PAPER THEATRE */}
        <section
          id="top"
          className={`hero-atelier${unlocked ? " hero-atelier--unlocked" : ""}`}
          aria-labelledby="cover-title"
        >
          <SunlitAtelierCanvas
            reducedMotion={reducedMotion}
            impulseKey={canvasImpulse}
          />

          <OpeningExperience
            key={replayNonce}
            reducedMotion={reducedMotion}
            alreadyUnlocked={unlocked}
            photoStates={photoStates}
            onPhotoStateChange={updatePhotoState}
            onOpenPhoto={openPhoto}
            onWakeCanvas={() => setCanvasImpulse((n) => n + 1)}
            onComplete={() => {
              setUnlocked(true);
              setCanvasImpulse((n) => n + 1);
            }}
          />
        </section>

        {/* CHAPTERS UNLOCKED AFTER OPENING (OR IMMEDIATELY ON REDUCED MOTION) */}
        <div
          className={`keepsake-chapters${unlocked ? " is-ready" : ""}`}
          aria-hidden={!unlocked}
          inert={!unlocked}
        >
          {/* ACT II: STICKY POLAROID DESK WALKTHROUGH */}
          <section
            id="highlights"
            className="chapter-walkthrough"
            aria-labelledby="highlights-title"
            data-paper-reveal
          >
            <div className="deckle-divider deckle-divider--top" aria-hidden="true" />

            <div className="section-wrap">
              <div className="walkthrough-header">
                <h2 id="highlights-title">{anniversary.openingCaptionTitle}</h2>
                <p>{anniversary.openingCaptionCopy}</p>
              </div>

              {/* Mobile / Compact Quick Step Switcher */}
              <div
                className="walkthrough-tabs"
                role="tablist"
                aria-label="Chọn lát cắt kỷ niệm"
              >
                {anniversary.storyChapters.map((chapter, idx) => {
                  const isActive = activeChapter === idx;
                  return (
                    <button
                      key={chapter.handNote}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`walkthrough-tab${isActive ? " is-active" : ""}`}
                      onClick={() => {
                        setActiveChapter(idx);
                        const card = chapterRefs.current[idx];
                        if (window.innerWidth > 860 && card) {
                          card.scrollIntoView({
                            behavior: reducedMotion ? "auto" : "smooth",
                            block: "center",
                          });
                        }
                      }}
                    >
                      <span>{anniversary.photos[chapter.photoIndex].label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="walkthrough-grid">
                {/* Sticky Physical Polaroid Stack */}
                <div className="walkthrough-desk">
                  <div className="walkthrough-desk__board">
                    <BotanicalCluster
                      asset="card"
                      className="walkthrough-desk__botanical"
                    />
                    <div className="polaroid-stack">
                      {anniversary.storyChapters.map((chapter, idx) => {
                        const photo = anniversary.photos[chapter.photoIndex];
                        const offset = idx - activeChapter;
                        const isTop = idx === activeChapter;
                        const baseAngles = [-2.2, 1.8, -1.4, 2.1];
                        const rotateDeg = isTop ? -0.8 : baseAngles[idx % 4] + offset * 2.2;
                        const translateY = isTop ? 0 : Math.abs(offset) * 10 + 6;
                        const translateX = isTop ? 0 : offset * 14;
                        const scale = isTop ? 1 : Math.max(0.9, 0.96 - Math.abs(offset) * 0.025);

                        return (
                          <button
                            key={photo.src}
                            type="button"
                            className={`stacked-polaroid${isTop ? " is-top" : ""}`}
                            style={{
                              zIndex: isTop ? 10 : 6 - Math.abs(offset),
                              transform: reducedMotion
                                ? "none"
                                : `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotateDeg}deg) scale(${scale})`,
                              opacity: reducedMotion && !isTop ? 0 : isTop ? 1 : 0.76,
                              pointerEvents: isTop ? "auto" : "none",
                            }}
                            aria-label={`Phóng to ${photo.label}: ${chapter.handNote}`}
                            aria-haspopup="dialog"
                            tabIndex={isTop ? 0 : -1}
                            onClick={(e) => openPhoto(chapter.photoIndex, e.currentTarget)}
                          >
                            <span className="stacked-polaroid__tape" aria-hidden="true" />
                            <span className="stacked-polaroid__mat">
                              <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                sizes="(max-width: 860px) 84vw, 420px"
                                unoptimized
                                className="stacked-polaroid__img"
                                onLoad={() => updatePhotoState(chapter.photoIndex, "loaded")}
                                onError={() => updatePhotoState(chapter.photoIndex, "error")}
                              />
                            </span>
                            <span className="stacked-polaroid__footer">
                              <span className="stacked-polaroid__note">
                                {chapter.handNote}
                              </span>
                              <span className="stacked-polaroid__tag">{photo.label}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Scrolling Narrative Beats */}
                <div className="walkthrough-beats">
                  {anniversary.storyChapters.map((chapter, idx) => {
                    const isActive = activeChapter === idx;
                    const photo = anniversary.photos[chapter.photoIndex];
                    return (
                      <article
                        key={chapter.title}
                        ref={(node) => {
                          chapterRefs.current[idx] = node;
                        }}
                        data-chapter-idx={idx}
                        className={`story-beat${isActive ? " is-active" : ""}`}
                        onClick={() => setActiveChapter(idx)}
                      >
                        <div className="story-beat__meta">
                          <span className="story-beat__badge">{photo.label}</span>
                          <span className="story-beat__hand">{chapter.handNote}</span>
                        </div>
                        <h3>{chapter.title}</h3>
                        <p>{chapter.copy}</p>
                        <button
                          type="button"
                          className="story-beat__link"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPhoto(chapter.photoIndex, event.currentTarget);
                          }}
                        >
                          <span>Ngắm kỹ tấm hình này</span>
                          <ChevronRight aria-hidden="true" size={16} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ACT III: FULL 20-PHOTO TACTILE KEEPSAKE ALBUM */}
          <section
            id="moments"
            className="moments-section"
            aria-labelledby="moments-title"
            data-paper-reveal
          >
            <BotanicalCluster
              asset="letter"
              className="moments-section__botanical moments-section__botanical--left"
            />
            <BotanicalCluster
              asset="card"
              className="moments-section__botanical moments-section__botanical--right"
            />

            <div className="section-wrap moments-sheet">
              <div className="album-header">
                <div className="album-header__copy">
                  <h2 id="moments-title">{anniversary.galleryTitle}</h2>
                  <p>{anniversary.galleryCopy}</p>
                </div>

                <div className="album-header__actions">
                  <button
                    type="button"
                    className="paper-button paper-button--secondary"
                    onClick={(event) => openRandomPhoto(event.currentTarget)}
                  >
                    <Shuffle aria-hidden="true" size={16} strokeWidth={1.8} />
                    <span>Mở ngẫu nhiên 1 tấm</span>
                  </button>
                </div>
              </div>

              {/* Filter & Layout Mode Controls with Shared-Element Pill */}
              <div className="album-toolbar">
                <div
                  className="album-filters"
                  role="group"
                  aria-label="Lọc ảnh theo khung hình"
                >
                  {(
                    [
                      { id: "all", label: `Tất cả (${filterCounts.all})` },
                      { id: "portrait", label: `Khung đứng (${filterCounts.portrait})` },
                      { id: "wide", label: `Ngang & vuông (${filterCounts.wide})` },
                      { id: "tall", label: `Toàn cảnh (${filterCounts.tall})` },
                    ] as const
                  ).map((tab) => {
                    const active = albumFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`filter-pill${active ? " is-active" : ""}`}
                        aria-pressed={active}
                        onClick={() => handleFilterChange(tab.id, tab.label)}
                      >
                        {active && (
                          <motion.span
                            layoutId="album-filter-pill"
                            className="filter-pill__bg"
                            transition={{
                              type: "spring",
                              duration: 0.38,
                              bounce: 0,
                            }}
                          />
                        )}
                        <span className="filter-pill__label">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className="album-layout-switch"
                  role="group"
                  aria-label="Kiểu trình bày album"
                >
                  <button
                    type="button"
                    className={`layout-btn${albumLayout === "scrapbook" ? " is-active" : ""}`}
                    aria-pressed={albumLayout === "scrapbook"}
                    onClick={() => setAlbumLayout("scrapbook")}
                  >
                    <LayoutGrid aria-hidden="true" size={16} />
                    <span>Sổ ảnh</span>
                  </button>
                  <button
                    type="button"
                    className={`layout-btn${albumLayout === "contact" ? " is-active" : ""}`}
                    aria-pressed={albumLayout === "contact"}
                    onClick={() => setAlbumLayout("contact")}
                  >
                    <Grid2X2 aria-hidden="true" size={16} />
                    <span>Cuộn phim</span>
                  </button>
                </div>
              </div>

              {/* 20-Photo Editorial Spread */}
              <div
                className={`photo-grid photo-grid--${albumLayout}`}
                data-filtered={albumFilter !== "all" ? "true" : "false"}
              >
                {filteredPhotos.map(({ photo, originalIndex }, renderIdx) => (
                  <Fragment key={photo.src}>
                    {albumFilter === "all" &&
                      albumLayout === "scrapbook" &&
                      (renderIdx === 7 || renderIdx === 14) && (
                        <div className="album-spread-divider" aria-hidden="true">
                          <span className="album-spread-divider__line" />
                          <span className="album-spread-divider__text">
                            {renderIdx === 7
                              ? "Còn nữa nè em, lật tiếp trang sau nha"
                              : "Những khung hình cuối trang album"}
                          </span>
                          <span className="album-spread-divider__line" />
                        </div>
                      )}
                    <PhotoFrame
                      photo={photo}
                      index={originalIndex}
                      state={photoStates[originalIndex] ?? "loading"}
                      onStateChange={updatePhotoState}
                      onOpen={openPhoto}
                      hasWashiTape={
                        albumLayout === "scrapbook" &&
                        (originalIndex % 5 === 0 || originalIndex === 7 || originalIndex === 14)
                      }
                    />
                  </Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* ACT IV: INTERACTIVE 3D WAX-SEALED FOLDING LOVE LETTER */}
          <section
            id="letter"
            className="letter-section"
            aria-labelledby="letter-title"
            data-paper-reveal
          >
            <div className="deckle-divider deckle-divider--warm" aria-hidden="true" />
            <BotanicalCluster
              asset="letter"
              className="letter-section__botanical letter-section__botanical--left"
            />
            <BotanicalCluster
              asset="card"
              className="letter-section__botanical letter-section__botanical--right"
            />

            <div className="section-wrap letter-wrap">
              <div className="letter-header">
                <div className="letter-header__titles">
                  <h2 id="letter-title">{anniversary.letterTitle}</h2>
                  <p>
                    Một phong thư nhỏ anh gấp kỹ trên giấy kem. Em chạm vào dấu sáp đỏ hoặc nút bên cạnh để mở đọc nha.
                  </p>
                </div>

                <button
                  type="button"
                  className="paper-button"
                  aria-expanded={letterOpen}
                  aria-controls="letter-sheet-article"
                  onClick={() => setLetterOpen((open) => !open)}
                >
                  {letterOpen ? (
                    <>
                      <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
                      <span>Gấp thư lại</span>
                    </>
                  ) : (
                    <>
                      <MailOpen aria-hidden="true" size={17} strokeWidth={1.8} />
                      <span>Mở thư đọc</span>
                    </>
                  )}
                </button>
              </div>

              <TactileLoveLetter
                open={letterOpen}
                reducedMotion={reducedMotion}
                onToggle={() => setLetterOpen((open) => !open)}
                onContinueToCard={jumpToCardAndOpen}
              />
            </div>
          </section>

          {/* ACT V: INTERACTIVE 3D SPINE-HINGED BOTANICAL GREETING CARD */}
          <section
            id="note"
            className="card-section"
            aria-labelledby="note-title"
            data-paper-reveal
          >
            <BotanicalCluster
              asset="card"
              className="card-section__botanical card-section__botanical--left"
            />
            <BotanicalCluster
              asset="letter"
              className="card-section__botanical card-section__botanical--right"
            />

            <div className="section-wrap card-wrap">
              <div className="card-header">
                <h2 id="note-title">{anniversary.finalTitle}</h2>
                <p>
                  Tấm thiệp xanh lá trà cuối cuốn sổ lưu niệm — mở đôi cánh thiệp để xem lời nhắn anh để dành ở trang cuối nha em.
                </p>
              </div>

              <TactileGreetingCard
                open={noteOpen}
                reducedMotion={reducedMotion}
                onToggle={() => setNoteOpen((open) => !open)}
                onOpenPhoto={openPhoto}
              />

              <div className="card-actions">
                <button
                  type="button"
                  className="paper-button"
                  aria-expanded={noteOpen}
                  aria-controls="final-note-spread"
                  onClick={() => setNoteOpen((open) => !open)}
                >
                  <BookOpen aria-hidden="true" size={17} strokeWidth={1.8} />
                  <span>{noteOpen ? "Khép cánh thiệp lại" : "Mở tấm thiệp chúc"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* CLOSING KEEPSAKE COLOPHON & HEART WAX SEAL */}
          <footer className="keepsake-footer">
            <div className="section-wrap keepsake-footer__inner">
              <div className="keepsake-seal-box">
                <div className="keepsake-seal-box__button-wrap">
                  <button
                    type="button"
                    className="wax-heart-btn"
                    onClick={handlePressHeartSeal}
                    aria-label={`Đóng dấu tim yêu thương, hiện có ${heartCount} dấu tim`}
                  >
                    <Heart aria-hidden="true" size={24} fill="currentColor" />
                  </button>
                  <AnimatePresence>
                    {heartBurstId > 0 && (
                      <motion.span
                        key={heartBurstId}
                        className="wax-heart-burst"
                        aria-hidden="true"
                        initial={{ opacity: 0.95, transform: "translate(-50%, 0px) scale(0.85)" }}
                        animate={{ opacity: 0, transform: "translate(-50%, -34px) scale(1.18)" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reducedMotion ? 0.15 : 0.55, ease: [0.23, 1, 0.32, 1] }}
                      >
                        +1 ♥
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="keepsake-seal-box__copy">
                  <p className="keepsake-seal-box__title">
                    Chúc mừng 4 năm bên nhau nha em yêu
                  </p>
                  <p className="keepsake-seal-box__sub">
                    Chạm vào con dấu sáp đỏ để lưu thêm một nhịp tim kỷ niệm:{" "}
                    <strong className="tabular-nums">{heartCount}</strong> dấu tim đã giữ.
                  </p>
                </div>
              </div>

              <div className="keepsake-footer__ctas">
                <button
                  type="button"
                  className="paper-button paper-button--secondary"
                  onClick={handleReplayEnvelope}
                >
                  <RotateCcw aria-hidden="true" size={16} strokeWidth={1.8} />
                  <span>Gấp lại phong bì mở màn</span>
                </button>
                <a className="paper-button" href="#moments">
                  <ArrowUp aria-hidden="true" size={16} strokeWidth={1.8} />
                  <span>Xem lại Album 20 ảnh</span>
                </a>
              </div>

              <div className="keepsake-footer__bottom">
                <nav aria-label="Liên kết cuối trang" className="keepsake-footer__nav">
                  <a href="#top">Sân khấu đầu trang</a>
                  <a href="#highlights">Chặng đường</a>
                  <a href="#moments">Album ảnh</a>
                  <a href="#letter">Lá thư</a>
                  <a href="#note">Thiệp chúc</a>
                </nav>
                <p className="keepsake-footer__credit">
                  Lưu bút thủ công kỷ niệm bốn năm bên nhau · Giữ trọn 20 khung hình thương nhớ.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </main>

      <PaperLightbox
        photos={anniversary.photos}
        selectedPhoto={selectedPhoto}
        closing={closingDialog}
        direction={photoDirection}
        reducedMotion={reducedMotion}
        photoStates={photoStates}
        triggerRef={photoTriggerRef}
        onUpdatePhotoState={updatePhotoState}
        onSelectIndex={selectPhotoIndex}
        onStep={stepPhoto}
        onRequestClose={requestClosePhoto}
        onClosed={() => {
          setSelectedPhoto(null);
          setClosingDialog(false);
        }}
      />
    </MotionConfig>
  );
}

function OpeningExperience({
  reducedMotion,
  alreadyUnlocked,
  photoStates,
  onPhotoStateChange,
  onOpenPhoto,
  onWakeCanvas,
  onComplete,
}: {
  reducedMotion: boolean;
  alreadyUnlocked: boolean;
  photoStates: Record<number, PhotoLoadState>;
  onPhotoStateChange: (index: number, state: PhotoLoadState) => void;
  onOpenPhoto: (index: number, trigger: HTMLElement) => void;
  onWakeCanvas: () => void;
  onComplete: () => void;
}) {
  const [openingState, setOpeningState] = useState<OpeningState>(
    reducedMotion ? "scroll-invitation" : "envelope-idle"
  );
  const [stageSceneIdx, setStageSceneIdx] = useState(0);
  const [sceneDirection, setSceneDirection] = useState(1);

  const stageWrapRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<HTMLButtonElement>(null);
  const flapRef = useRef<HTMLSpanElement>(null);
  const pocketRef = useRef<HTMLSpanElement>(null);
  const leftFoldRef = useRef<HTMLSpanElement>(null);
  const rightFoldRef = useRef<HTMLSpanElement>(null);
  const sealRef = useRef<HTMLSpanElement>(null);
  const theaterRef = useRef<HTMLDivElement>(null);
  const stagePhotoRef = useRef<HTMLDivElement>(null);
  const friendsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const completeCallbackRef = useRef(onComplete);

  useEffect(() => {
    completeCallbackRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (reducedMotion) {
      setOpeningState("scroll-invitation");
    }
  }, [reducedMotion]);

  // Pointer-driven 4-plane spring parallax once theatre is active
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 20, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 20, mass: 0.6 });

  const shellTransform = useTransform(
    [smoothX, smoothY],
    ([x, y]: number[]) => `translate3d(${(x * -7).toFixed(2)}px, ${(y * -5).toFixed(2)}px, 0)`
  );
  const photoTransform = useTransform(
    [smoothX, smoothY],
    ([x, y]: number[]) =>
      `translate3d(${(x * 5).toFixed(2)}px, ${(y * 4).toFixed(2)}px, 0) rotate(-1deg)`
  );
  const friendsTransform = useTransform(
    [smoothX, smoothY],
    ([x, y]: number[]) => `translate3d(${(x * 11).toFixed(2)}px, ${(y * 7).toFixed(2)}px, 0)`
  );

  // Set up GSAP 60fps 3D unfolding timeline
  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.set(theaterRef.current, {
        autoAlpha: 0,
        scale: 0.88,
        y: 30,
        transformOrigin: "center bottom",
      });
      gsap.set(stagePhotoRef.current, {
        autoAlpha: 0,
        y: 26,
        scale: 0.93,
      });
      gsap.set(friendsRef.current, {
        autoAlpha: 0,
        y: 20,
        scale: 0.95,
      });

      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          setOpeningState("scroll-invitation");
          completeCallbackRef.current();
        },
      });

      tl.to(
        sealRef.current,
        {
          y: -20,
          scale: 0.82,
          autoAlpha: 0,
          duration: 0.26,
          ease: "power2.out",
        },
        0
      )
        .to(
          flapRef.current,
          {
            rotateX: -174,
            duration: 0.68,
            ease: "power2.inOut",
          },
          0.08
        )
        .to(
          leftFoldRef.current,
          {
            rotateY: -58,
            x: -18,
            duration: 0.64,
            ease: "power2.inOut",
          },
          0.24
        )
        .to(
          rightFoldRef.current,
          {
            rotateY: 58,
            x: 18,
            duration: 0.64,
            ease: "power2.inOut",
          },
          0.24
        )
        .to(
          pocketRef.current,
          {
            y: 14,
            autoAlpha: 0.4,
            duration: 0.56,
            ease: "power2.out",
          },
          0.32
        )
        .call(() => setOpeningState("theater-reveal"), [], 0.42)
        .to(
          theaterRef.current,
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.98,
            ease: "power3.out",
          },
          0.38
        )
        .to(
          envelopeRef.current,
          {
            autoAlpha: 0,
            scale: 0.93,
            y: -18,
            duration: 0.54,
            ease: "power2.inOut",
          },
          0.86
        )
        .to(
          stagePhotoRef.current,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.62,
            ease: "back.out(1.2)",
          },
          0.88
        )
        .to(
          friendsRef.current,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.62,
            ease: "power2.out",
          },
          1.08
        );

      timelineRef.current = tl;
    }, stageWrapRef);

    return () => {
      ctx.revert();
      timelineRef.current = null;
    };
  }, [reducedMotion]);

  const handleOpenEnvelope = () => {
    if (openingState !== "envelope-idle") return;
    onWakeCanvas();
    if (reducedMotion || !timelineRef.current) {
      setOpeningState("scroll-invitation");
      completeCallbackRef.current();
      return;
    }
    setOpeningState("envelope-opening");
    timelineRef.current.play(0);
  };

  const handleStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || openingState !== "scroll-invitation") return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerX.set(nx);
    pointerY.set(ny);
  };

  const handleStagePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const stepScene = (delta: number) => {
    setSceneDirection(delta);
    setStageSceneIdx(
      (idx) =>
        (idx + delta + anniversary.stageScenes.length) %
        anniversary.stageScenes.length
    );
    onWakeCanvas();
  };

  const isInteractive = openingState === "scroll-invitation";
  const showEnvelope = openingState !== "scroll-invitation";
  const activeScene = anniversary.stageScenes[stageSceneIdx];
  const activeStagePhoto = anniversary.photos[activeScene.photoIndex];

  return (
    <div
      className="opening-experience"
      data-opening-state={openingState}
      onPointerMove={handleStagePointerMove}
      onPointerLeave={handleStagePointerLeave}
    >
      {/* Decorative Authored Paper Botanicals */}
      <div className="opening-botanicals" aria-hidden="true">
        <BotanicalCluster asset="letter" className="opening-botanicals__left" />
        <BotanicalCluster asset="card" className="opening-botanicals__right" />
      </div>

      {/* Hero Heading & Story Lead */}
      <div className="hero-header" data-enter="support">
        <h1 id="cover-title" className="hero-title">
          {anniversary.title}
        </h1>
        <p className="hero-subtitle">{anniversary.description}</p>
      </div>

      {/* Centerpiece Canvas: Closed Envelope -> 3D Paper Theatre */}
      <div
        ref={stageWrapRef}
        className="opening-canvas"
        role="group"
        aria-label={
          isInteractive ? anniversary.finalStageLabel : anniversary.openingSceneLabel
        }
        data-enter="lead"
      >
        {/* Layered Paper Theatre (no envelope in final stage) */}
        <div
          ref={theaterRef}
          className={`paper-theatre${isInteractive ? " is-interactive" : ""}`}
          aria-hidden={!isInteractive}
          inert={!isInteractive}
        >
          <motion.div
            className="paper-theatre__shell-layer"
            style={reducedMotion ? undefined : { transform: shellTransform }}
          >
            <Image
              className="paper-theatre__shell"
              src="/artwork/paper-theater-shell-v2.webp"
              alt=""
              aria-hidden="true"
              width={1506}
              height={1045}
              sizes="(max-width: 768px) 94vw, 860px"
              priority
              unoptimized
            />
          </motion.div>

          <div ref={stagePhotoRef} className="theater-photos">
            <motion.div
              className="theater-photo-wrap"
              style={reducedMotion ? undefined : { transform: photoTransform }}
            >
              <AnimatePresence initial={false} custom={sceneDirection} mode="popLayout">
                <motion.div
                  key={activeScene.photoIndex}
                  className="theater-photo-card"
                  initial={{
                    opacity: 0,
                    transform: reducedMotion
                      ? "scale(1)"
                      : `translateX(${sceneDirection * 18}px) scale(0.96)`,
                  }}
                  animate={{
                    opacity: 1,
                    transform: "translateX(0px) scale(1)",
                  }}
                  exit={{
                    opacity: 0,
                    transform: reducedMotion
                      ? "scale(1)"
                      : `translateX(${sceneDirection * -18}px) scale(0.96)`,
                  }}
                  transition={{
                    duration: reducedMotion ? 0.12 : 0.26,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                >
                  <PhotoFrame
                    photo={activeStagePhoto}
                    index={activeScene.photoIndex}
                    state={photoStates[activeScene.photoIndex] ?? "loading"}
                    onStateChange={onPhotoStateChange}
                    onOpen={onOpenPhoto}
                    featured
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          <div ref={friendsRef} className="paper-theatre__friends">
            <motion.div
              className="paper-theatre__friends-motion"
              style={reducedMotion ? undefined : { transform: friendsTransform }}
            >
              <Image
                className="paper-friends"
                src="/artwork/paper-friends.webp"
                alt=""
                aria-hidden="true"
                width={1254}
                height={1254}
                sizes="(max-width: 768px) 34vw, 210px"
                priority
                unoptimized
              />
            </motion.div>
          </div>
        </div>

        {/* Closed Tactile Paper Envelope (removed completely once theatre completes) */}
        {showEnvelope && (
          <EntryEnvelope
            envelopeRef={envelopeRef}
            flapRef={flapRef}
            pocketRef={pocketRef}
            leftFoldRef={leftFoldRef}
            rightFoldRef={rightFoldRef}
            sealRef={sealRef}
            disabled={openingState !== "envelope-idle"}
            onOpen={handleOpenEnvelope}
          />
        )}
      </div>

      {/* Action Area Beneath Centerpiece */}
      <div className="hero-controls" data-enter="cta">
        {openingState === "envelope-idle" && (
          <div className="hero-idle-cta">
            <button
              type="button"
              className="paper-button paper-button--hero"
              onClick={handleOpenEnvelope}
            >
              <Sparkles aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{anniversary.openingButtonLabel}</span>
            </button>
            <p className="opening-instruction">{anniversary.openingInstruction}</p>
            {alreadyUnlocked && (
              <a className="hero-skip-scroll" href="#moments">
                <span>Đi thẳng xuống album 20 ảnh</span>
                <ArrowDown aria-hidden="true" size={15} />
              </a>
            )}
          </div>
        )}

        {(openingState === "envelope-opening" ||
          openingState === "theater-reveal") && (
          <p className="opening-instruction opening-instruction--playing">
            Đang mở sân khấu kỷ niệm của tụi mình…
          </p>
        )}

        {isInteractive && (
          <div className="stage-interactive-bar">
            <div
              className="stage-scene-pills"
              role="toolbar"
              aria-label="Đổi ảnh trưng bày trên sân khấu giấy"
            >
              <button
                type="button"
                className="stage-arrow-btn"
                onClick={() => stepScene(-1)}
                aria-label="Cảnh sân khấu trước"
              >
                <ChevronLeft aria-hidden="true" size={18} />
              </button>

              <div className="stage-scene-pills__list">
                {anniversary.stageScenes.map((scene, idx) => {
                  const active = idx === stageSceneIdx;
                  return (
                    <button
                      key={scene.cueLabel}
                      type="button"
                      className={`stage-cue-pill${active ? " is-active" : ""}`}
                      aria-pressed={active}
                      onClick={() => {
                        if (idx === stageSceneIdx) return;
                        setSceneDirection(idx > stageSceneIdx ? 1 : -1);
                        setStageSceneIdx(idx);
                        onWakeCanvas();
                      }}
                    >
                      {active && (
                        <motion.span
                          layoutId="stage-cue-indicator"
                          className="stage-cue-pill__bg"
                          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                        />
                      )}
                      <span className="stage-cue-pill__text">{scene.cueLabel}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="stage-arrow-btn"
                onClick={() => stepScene(1)}
                aria-label="Cảnh sân khấu tiếp theo"
              >
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            </div>

            <p className="stage-scene-note">{activeScene.note}</p>

            <a className="scroll-invitation-cta" href="#highlights">
              <span>{anniversary.scrollInvitation}</span>
              <ArrowDown
                className="scroll-invitation-cta__arrow"
                aria-hidden="true"
                size={18}
              />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function EntryEnvelope({
  envelopeRef,
  flapRef,
  pocketRef,
  leftFoldRef,
  rightFoldRef,
  sealRef,
  disabled,
  onOpen,
}: {
  envelopeRef: RefObject<HTMLButtonElement | null>;
  flapRef: RefObject<HTMLSpanElement | null>;
  pocketRef: RefObject<HTMLSpanElement | null>;
  leftFoldRef: RefObject<HTMLSpanElement | null>;
  rightFoldRef: RefObject<HTMLSpanElement | null>;
  sealRef: RefObject<HTMLSpanElement | null>;
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      ref={envelopeRef}
      type="button"
      className="entry-envelope"
      aria-label={anniversary.openingButtonLabel}
      disabled={disabled}
      onClick={onOpen}
    >
      <span className="entry-envelope__back" aria-hidden="true" />
      <span className="entry-envelope__inner" aria-hidden="true">
        <span className="entry-envelope__peek-card">
          <span>Gửi em yêu,</span>
        </span>
      </span>
      <span
        ref={leftFoldRef}
        className="entry-envelope__side entry-envelope__side--left"
        aria-hidden="true"
      />
      <span
        ref={rightFoldRef}
        className="entry-envelope__side entry-envelope__side--right"
        aria-hidden="true"
      />
      <span ref={pocketRef} className="entry-envelope__pocket" aria-hidden="true">
        <span className="entry-envelope__calligraphy">Kỷ niệm 4 năm bên nhau</span>
      </span>
      <span ref={flapRef} className="entry-envelope__flap" aria-hidden="true" />
      <span ref={sealRef} className="entry-envelope__seal" aria-hidden="true">
        <Heart size={24} fill="currentColor" />
      </span>
    </button>
  );
}

function PhotoFrame({
  photo,
  index,
  state,
  onStateChange,
  onOpen,
  featured = false,
  hasWashiTape = false,
}: {
  photo: AnniversaryPhoto;
  index: number;
  state: PhotoLoadState;
  onStateChange: (index: number, state: PhotoLoadState) => void;
  onOpen: (index: number, trigger: HTMLElement) => void;
  featured?: boolean;
  hasWashiTape?: boolean;
}) {
  return (
    <button
      type="button"
      className={`photo-frame ${
        featured ? "photo-frame--featured" : `photo-frame--${photo.shape}`
      } photo-frame--tilt-${index % 4}`}
      onClick={(event) => onOpen(index, event.currentTarget)}
      aria-label={`Mở ${photo.label}: ${photo.alt}`}
      aria-haspopup="dialog"
    >
      {hasWashiTape && <span className="photo-frame__washi" aria-hidden="true" />}
      <span className="photo-frame__mat">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={
            featured
              ? "(max-width: 768px) 62vw, 340px"
              : "(max-width: 768px) 46vw, 26vw"
          }
          loading={featured ? undefined : "lazy"}
          priority={featured}
          unoptimized
          className={`photo-frame__image${state === "loaded" ? " is-loaded" : ""}`}
          onLoad={() => onStateChange(index, "loaded")}
          onError={() => onStateChange(index, "error")}
        />
        {state !== "loaded" && (
          <span className="photo-placeholder" aria-hidden="true">
            <ImagePlus size={20} strokeWidth={1.5} />
            <span>{photo.label}</span>
            <small>
              {state === "error"
                ? "Ảnh chưa tải được, chạm xem tấm khác nha."
                : "Đang mở ảnh…"}
            </small>
          </span>
        )}
      </span>
      {!featured && (
        <span className="photo-frame__caption">
          <span>{photo.label}</span>
          <Heart aria-hidden="true" size={12} />
        </span>
      )}
    </button>
  );
}

function TactileLoveLetter({
  open,
  reducedMotion,
  onToggle,
  onContinueToCard,
}: {
  open: boolean;
  reducedMotion: boolean;
  onToggle: () => void;
  onContinueToCard: () => void;
}) {
  return (
    <div className={`tactile-letter-stage${open ? " is-open" : ""}`}>
      {/* Closed Envelope Interactive Trigger */}
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.button
            key="closed-envelope"
            type="button"
            className="love-envelope-btn"
            onClick={onToggle}
            aria-label="Mở phong bì đọc lá thư của anh"
            initial={{ opacity: 0, transform: "scale(0.97)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.97)" }}
            transition={{ duration: reducedMotion ? 0.1 : 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="love-envelope__back" aria-hidden="true" />
            <span className="love-envelope__sheet-peek" aria-hidden="true">
              <span>Em yêu à, bốn năm rồi đó…</span>
            </span>
            <span
              className="love-envelope__wing love-envelope__wing--left"
              aria-hidden="true"
            />
            <span
              className="love-envelope__wing love-envelope__wing--right"
              aria-hidden="true"
            />
            <span className="love-envelope__pocket" aria-hidden="true">
              <span className="love-envelope__note">Chạm để mở phong thư</span>
            </span>
            <span className="love-envelope__flap" aria-hidden="true">
              <span>Gửi em yêu,</span>
            </span>
            <span className="love-envelope__seal" aria-hidden="true">
              <Heart size={20} fill="currentColor" />
            </span>
          </motion.button>
        ) : (
          <motion.article
            key="open-letter"
            id="letter-sheet-article"
            className="archival-letter-sheet"
            initial={{
              opacity: 0,
              transform: reducedMotion
                ? "translateY(0px) scale(1)"
                : "translateY(18px) scale(0.975)",
            }}
            animate={{
              opacity: 1,
              transform: "translateY(0px) scale(1)",
            }}
            exit={{
              opacity: 0,
              transform: reducedMotion
                ? "translateY(0px) scale(1)"
                : "translateY(10px) scale(0.98)",
            }}
            transition={{ duration: reducedMotion ? 0.12 : 0.34, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="archival-letter-sheet__fold-line" aria-hidden="true" />

            <header className="archival-letter-sheet__top">
              <span className="archival-letter-sheet__salutation">Gửi em yêu,</span>
              <span className="archival-letter-sheet__stamp">
                Kỷ niệm <strong>4 năm</strong>
              </span>
            </header>

            <div className="archival-letter-sheet__body">
              {anniversary.letter.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <footer className="archival-letter-sheet__footer">
              <div className="archival-letter-sheet__actions">
                <button
                  type="button"
                  className="text-action-btn"
                  onClick={onContinueToCard}
                >
                  <span>Xem tiếp tấm thiệp nhỏ bên dưới</span>
                  <ArrowDown aria-hidden="true" size={15} />
                </button>
              </div>
              <div className="archival-letter-sheet__signature">
                <span>Thương em nhiều,</span>
                <Heart aria-hidden="true" size={16} fill="currentColor" />
              </div>
            </footer>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  );
}

function TactileGreetingCard({
  open,
  reducedMotion,
  onToggle,
  onOpenPhoto,
}: {
  open: boolean;
  reducedMotion: boolean;
  onToggle: () => void;
  onOpenPhoto: (index: number, trigger: HTMLElement) => void;
}) {
  const keepsakePhoto = anniversary.photos[6];

  return (
    <div className={`greeting-card-stage${open ? " is-open" : ""}`}>
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.button
            key="card-closed"
            type="button"
            className="greeting-card-cover"
            onClick={onToggle}
            aria-label="Mở tấm thiệp kỷ niệm bốn năm"
            initial={{ opacity: 0, transform: "scale(0.97)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.97)" }}
            transition={{ duration: reducedMotion ? 0.1 : 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="greeting-card-cover__spine" aria-hidden="true" />
            <span className="greeting-card-cover__stamp" aria-hidden="true">
              <Heart size={19} fill="currentColor" />
            </span>
            <div className="greeting-card-cover__content">
              <h3>{anniversary.finalTitle}</h3>
              <p>Chạm để mở đôi cánh thiệp</p>
            </div>
            <BotanicalCluster
              asset="card"
              className="greeting-card-cover__botanical"
            />
          </motion.button>
        ) : (
          <motion.div
            key="card-open"
            id="final-note-spread"
            className="greeting-card-spread"
            initial={{
              opacity: 0,
              transform: reducedMotion
                ? "translateY(0px) scale(1)"
                : "translateY(14px) scale(0.975)",
            }}
            animate={{
              opacity: 1,
              transform: "translateY(0px) scale(1)",
            }}
            exit={{
              opacity: 0,
              transform: reducedMotion
                ? "translateY(0px) scale(1)"
                : "translateY(8px) scale(0.98)",
            }}
            transition={{ duration: reducedMotion ? 0.12 : 0.32, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Left Wing of Greeting Card */}
            <div className="greeting-card-page greeting-card-page--left">
              <span className="greeting-card-page__tag">Kỷ niệm 4 năm</span>
              <button
                type="button"
                className="greeting-card-polaroid"
                aria-label={`Phóng to ${keepsakePhoto.label}`}
                aria-haspopup="dialog"
                onClick={(event) => onOpenPhoto(6, event.currentTarget)}
              >
                <span className="greeting-card-polaroid__tape" aria-hidden="true" />
                <span className="greeting-card-polaroid__mat">
                  <Image
                    src={keepsakePhoto.src}
                    alt={keepsakePhoto.alt}
                    fill
                    sizes="(max-width: 768px) 68vw, 260px"
                    unoptimized
                    className="greeting-card-polaroid__img"
                  />
                </span>
                <span className="greeting-card-polaroid__caption">
                  Bốn năm bên nhau
                </span>
              </button>
              <BotanicalCluster
                asset="letter"
                className="greeting-card-page__botanical"
              />
            </div>

            {/* Center Crease Spine */}
            <span className="greeting-card-spread__crease" aria-hidden="true" />

            {/* Right Wing of Greeting Card */}
            <div className="greeting-card-page greeting-card-page--right">
              <span className="greeting-card-page__salutation">Gửi em yêu,</span>
              <p className="greeting-card-page__note">{anniversary.finalNote}</p>
              <div className="greeting-card-page__signature">
                <span>Thương em nhiều,</span>
                <Heart aria-hidden="true" size={15} fill="currentColor" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BotanicalCluster({
  asset,
  className,
}: {
  asset: "letter" | "card";
  className: string;
}) {
  const src =
    asset === "letter"
      ? "/artwork/botanical-letter.webp"
      : "/artwork/botanical-card.webp";
  const dimensions =
    asset === "letter"
      ? { width: 1086, height: 1448 }
      : { width: 1448, height: 1086 };
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={dimensions.width}
      height={dimensions.height}
      sizes="(max-width: 768px) 32vw, 240px"
      loading="lazy"
      unoptimized
      className={className}
    />
  );
}
