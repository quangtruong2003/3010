"use client";

import Image from "next/image";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { Asterisk, ArrowDown, ChevronLeft, ChevronRight, Heart, ImagePlus, X } from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { RefObject } from "react";
import { anniversary } from "@/config/anniversary";

type PhotoState = "loading" | "loaded" | "error";
type OpeningState = "envelope-idle" | "envelope-opening" | "theater-reveal" | "theater-complete" | "scroll-invitation";

function retryWithMp4Fallback(video: HTMLVideoElement, attempted: { current: boolean }, onFailure: () => void) {
  if (attempted.current) return;
  attempted.current = true;
  video.src = "/media/anniversary-opening.mp4";
  video.load();
  void video.play().catch(onFailure);
}

export default function AnniversaryPage() {
  const reducedMotion = useReducedMotion();
  const [openingComplete, setOpeningComplete] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [photoStates, setPhotoStates] = useState<Record<number, PhotoState>>({});
  const [closing, setClosing] = useState(false);
  const [photoDirection, setPhotoDirection] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photoTriggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedPhoto !== null && !dialog.open) dialog.showModal();
    if (selectedPhoto === null && dialog.open) dialog.close();
  }, [selectedPhoto]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const updatePhoto = (index: number, state: PhotoState) => {
    setPhotoStates(current => current[index] === state ? current : { ...current, [index]: state });
  };

  const toggleLetter = () => setLetterOpen(value => !value);
  const toggleNote = () => setNoteOpen(value => !value);

  const openPhoto = (index: number, trigger: HTMLButtonElement) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    photoTriggerRef.current = trigger;
    setClosing(false);
    setSelectedPhoto(index);
  };

  const closePhoto = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setSelectedPhoto(null);
      setClosing(false);
      closeTimer.current = null;
    }, reducedMotion ? 0 : 180);
  };

  const changePhoto = (direction: number) => {
    setPhotoDirection(direction);
    setSelectedPhoto(index => index === null ? null : (index + direction + anniversary.photos.length) % anniversary.photos.length);
  };

  const selected = selectedPhoto === null ? null : anniversary.photos[selectedPhoto];
  const canMove = !closing;

  return <MotionConfig reducedMotion="user">
    <a className="skip-link" href="#main">Bỏ qua phần đầu</a>
    {openingComplete && <header className="site-header">
      <a className="site-mark" href="#top" aria-label="Về đầu trang">
        <Heart aria-hidden="true" size={20} strokeWidth={1.7} />
        <span>4 năm bên nhau</span>
      </a>
      <nav aria-label="Điều hướng chính" className="site-nav">
        <a href="#moments">Ảnh</a>
        <a href="#letter">Lá thư</a>
        <a href="#note">Bưu thiếp</a>
      </nav>
    </header>}
    <main id="main" className="page-shell">
      <section id="top" className={`cover cover--opening${openingComplete ? " cover--complete" : ""}`} aria-labelledby="cover-title">
        <h1 id="cover-title" className="visually-hidden">{anniversary.title}</h1>

        <OpeningExperience
          reducedMotion={Boolean(reducedMotion)}
          onComplete={() => setOpeningComplete(true)}
          photoStates={photoStates}
          onPhotoStateChange={updatePhoto}
          onOpenPhoto={openPhoto}
        />
      </section>

      <div className={`keepsake-chapters${openingComplete ? " is-ready" : ""}`} aria-hidden={!openingComplete} inert={!openingComplete}>
      <section id="moments" className="moments section-shell" aria-labelledby="moments-title">
        <div className="moments__paper-edge" aria-hidden="true" />
        <PaperGarden className="moments__garden" />
        <BotanicalCluster asset="letter" className="moments__botanical moments__botanical--left" />
        <BotanicalCluster asset="card" className="moments__botanical moments__botanical--right" />
        <div className="section-heading">
          <div>
            <p className="section-heading__note">Mấy khoảnh khắc của tụi mình</p>
            <h2 id="moments-title">{anniversary.galleryTitle}</h2>
            <p>{anniversary.galleryCopy}</p>
          </div>
          <span className="heading-flower" aria-hidden="true"><Heart size={19} /></span>
        </div>

        <div className="photo-grid">
          {anniversary.photos.map((photo, index) => <Fragment key={photo.src}>
            {(index === 8 || index === 15) && <div key={`album-page-${index}`} className="album-page-marker" aria-hidden="true">
              <span>{index === 8 ? "Còn nữa nè em" : "Xem tiếp với anh nha"}</span>
              <Asterisk className="album-page-marker__mark" aria-hidden="true" size={18} strokeWidth={1.4} />
            </div>}
            <PhotoFrame
            photo={photo}
            index={index}
            state={photoStates[index] ?? "loading"}
            onStateChange={updatePhoto}
            onOpen={openPhoto}
            />
          </Fragment>)}
        </div>
      </section>

      <section id="letter" className="letter-section section-shell" aria-labelledby="letter-title">
        <PaperGarden className="letter-section__garden" />
        <BotanicalCluster asset="letter" className="letter-section__botanical letter-section__botanical--left" />
        <BotanicalCluster asset="card" className="letter-section__botanical letter-section__botanical--right" />
        <div className="letter-heading">
          <span className="letter-heading__mark" aria-hidden="true"><Heart size={19} /></span>
          <h2 id="letter-title">{anniversary.letterTitle}</h2>
          <button
            type="button"
            className="letter-toggle"
            aria-expanded={letterOpen}
            aria-controls="letter-copy"
            onClick={toggleLetter}
          >
            {letterOpen ? "Gấp thư lại" : "Mở thư"}
          </button>
        </div>

        <FirstLoveLetterEnvelope open={letterOpen} />
      </section>

      <section id="note" className="last-note section-shell" aria-labelledby="note-title">
        <div className="last-note__sun" aria-hidden="true" />
        <PaperGarden className="last-note__garden last-note__garden--left" />
        <PaperGarden className="last-note__garden last-note__garden--right" />
        <BotanicalCluster asset="card" className="last-note__botanical last-note__botanical--left" />
        <BotanicalCluster asset="letter" className="last-note__botanical last-note__botanical--right" />
        <div className="postcard-heading">
          <p>Mừng tụi mình tròn 4 năm</p>
          <h2 id="note-title">{anniversary.finalTitle}</h2>
        </div>
        <AnniversaryGreetingCard open={noteOpen} />
        <button
          type="button"
          className="note-toggle"
          aria-expanded={noteOpen}
          aria-controls="final-note-copy"
          onClick={toggleNote}
        >
          {noteOpen ? "Gấp thiệp lại" : "Mở thiệp"}
        </button>
      </section>
      </div>
    </main>

    <dialog
      ref={dialogRef}
      className={`photo-dialog${closing ? " photo-dialog--closing" : ""}`}
      aria-labelledby="photo-dialog-title"
      onClose={() => { setSelectedPhoto(null); setClosing(false); photoTriggerRef.current?.focus({ preventScroll: true }); }}
      onCancel={event => { event.preventDefault(); closePhoto(); }}
      onClick={event => { if (event.target === dialogRef.current) closePhoto(); }}
      onKeyDown={event => {
        if (!canMove) return;
        if (event.key === "ArrowLeft") { event.preventDefault(); changePhoto(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); changePhoto(1); }
      }}
    >
      {selected && selectedPhoto !== null && <>
        <div className="photo-dialog__topline">
          <p id="photo-dialog-title">{selected.label}</p>
          <button type="button" className="icon-button" onClick={closePhoto} aria-label="Đóng ảnh">
            <X aria-hidden="true" size={21} />
          </button>
        </div>
        <div className="photo-dialog__image" aria-live="polite">
          <AnimatePresence initial={false}>
            <motion.div
              key={selectedPhoto}
              className="photo-dialog__slide"
              initial={{ opacity: 0, x: reducedMotion ? 0 : photoDirection * 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reducedMotion ? 0 : photoDirection * -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.17, ease: "easeOut" }}
            >
              <Image
                src={selected.src}
                alt={selected.alt}
                fill
                sizes="(max-width: 700px) 100vw, 92vw"
                unoptimized
                className="photo-dialog__img"
                onLoad={() => updatePhoto(selectedPhoto, "loaded")}
                onError={() => updatePhoto(selectedPhoto, "error")}
              />
          {photoStates[selectedPhoto] !== "loaded" && <div className="photo-dialog__status">
                {photoStates[selectedPhoto] === "error"
                  ? <EmptyPhoto />
                  : <><ImagePlus aria-hidden="true" size={28} /><span>Anh đang mở ảnh…</span></>}
              </div>}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="photo-dialog__controls">
          <button type="button" className="icon-button" onClick={() => changePhoto(-1)} aria-label="Ảnh trước" disabled={!canMove}>
            <ChevronLeft aria-hidden="true" size={22} />
          </button>
          <span>{String(selectedPhoto + 1).padStart(2, "0")} / {String(anniversary.photos.length).padStart(2, "0")}</span>
          <button type="button" className="icon-button" onClick={() => changePhoto(1)} aria-label="Ảnh tiếp theo" disabled={!canMove}>
            <ChevronRight aria-hidden="true" size={22} />
          </button>
        </div>
      </>}
    </dialog>
  </MotionConfig>;
}

function PhotoFrame({
  photo,
  index,
  state,
  onStateChange,
  onOpen,
  featured = false
}: {
  photo: (typeof anniversary.photos)[number];
  index: number;
  state: PhotoState;
  onStateChange: (index: number, state: PhotoState) => void;
  onOpen: (index: number, trigger: HTMLButtonElement) => void;
  featured?: boolean;
}) {
  return <button
    type="button"
    className={`photo-frame${featured ? " photo-frame--featured" : ` photo-frame--${photo.shape}`} photo-frame--${index % 4}`}
    onClick={event => onOpen(index, event.currentTarget)}
    aria-label={`Mở ${photo.label}`}
    aria-haspopup="dialog"
  >
    <span className="photo-frame__mat">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={featured ? "(max-width: 700px) 70vw, 340px" : "(max-width: 700px) 46vw, 24vw"}
        loading={featured ? undefined : "lazy"}
        priority={featured}
        unoptimized
        className={`photo-frame__image${state === "loaded" ? " is-loaded" : ""}`}
        onLoad={() => onStateChange(index, "loaded")}
        onError={() => onStateChange(index, "error")}
      />
      {state !== "loaded" && <span className="photo-placeholder" aria-hidden="true">
        <ImagePlus size={21} strokeWidth={1.4} />
        <span>{photo.label}</span>
        <small>{state === "error" ? "Ảnh chưa hiện ra được, em thử tấm khác nha." : "Anh đang mở ảnh…"}</small>
      </span>}
    </span>
    <span className="photo-frame__caption"><span>{photo.label}</span><Heart aria-hidden="true" size={13} /></span>
  </button>;
}

function EmptyPhoto() {
  return <div className="photo-dialog__empty">
    <ImagePlus aria-hidden="true" size={30} strokeWidth={1.3} />
    <p>Ảnh chưa hiện ra được, em thử tấm khác nha.</p>
  </div>;
}

function OpeningExperience({
  reducedMotion,
  onComplete,
  photoStates,
  onPhotoStateChange,
  onOpenPhoto
}: {
  reducedMotion: boolean;
  onComplete: () => void;
  photoStates: Record<number, PhotoState>;
  onPhotoStateChange: (index: number, state: PhotoState) => void;
  onOpenPhoto: (index: number, trigger: HTMLButtonElement) => void;
}) {
  const [openingState, setOpeningState] = useState<OpeningState>("envelope-idle");
  const [renderMode, setRenderMode] = useState(false);
  const [openingGifReady, setOpeningGifReady] = useState(false);
  const [openingGifFailed, setOpeningGifFailed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<HTMLButtonElement>(null);
  const flapRef = useRef<HTMLSpanElement>(null);
  const pocketRef = useRef<HTMLSpanElement>(null);
  const leftFoldRef = useRef<HTMLSpanElement>(null);
  const rightFoldRef = useRef<HTMLSpanElement>(null);
  const sealRef = useRef<HTMLSpanElement>(null);
  const theaterRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const friendsRef = useRef<HTMLDivElement>(null);
  const invitationRef = useRef<HTMLParagraphElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mp4FallbackRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const completeRef = useRef(onComplete);

  useEffect(() => { completeRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    setRenderMode(new URLSearchParams(window.location.search).get("renderOpening") === "1");
  }, []);

  const finishOpening = () => {
    setOpeningState("theater-complete");
    requestAnimationFrame(() => {
      setOpeningState("scroll-invitation");
      invitationRef.current?.focus({ preventScroll: true });
      completeRef.current();
    });
  };
  const finishRef = useRef(finishOpening);
  finishRef.current = finishOpening;

  useEffect(() => {
    if (!renderMode) return;
    const context = gsap.context(() => {
      gsap.set(theaterRef.current, { autoAlpha: 0, scale: .86, y: 34, zIndex: 0, transformOrigin: "center center" });
      gsap.set(photosRef.current, { autoAlpha: 0 });
      gsap.set(friendsRef.current, { autoAlpha: 0, y: 24 });
      gsap.set(invitationRef.current, { autoAlpha: 0, y: 12 });
      const photos = canvasRef.current?.querySelectorAll<HTMLElement>(".theater-photo-wrap");
      gsap.set(photos ?? [], { autoAlpha: 0, y: 38, scale: .9 });
      timelineRef.current = gsap.timeline({ paused: true, onComplete: () => finishRef.current() })
        .to(sealRef.current, { y: -22, scale: .7, autoAlpha: 0, duration: .32, ease: "power1.in" }, 0)
        .to(flapRef.current, { rotateX: -172, duration: .82, ease: "power2.inOut" }, .12)
        .to(leftFoldRef.current, { rotateY: -76, x: -26, z: -38, duration: .8, ease: "power2.inOut" }, .32)
        .to(rightFoldRef.current, { rotateY: 76, x: 26, z: -38, duration: .8, ease: "power2.inOut" }, .32)
        .to(pocketRef.current, { rotateX: -152, z: 12, duration: .78, ease: "power2.inOut" }, .42)
        .to(theaterRef.current, { autoAlpha: 1, scale: 1, y: 0, duration: 1.45, ease: "power3.out" }, .45)
        .call(() => setOpeningState("theater-reveal"), [], .65)
        .to(photosRef.current, { autoAlpha: 1, duration: .35, ease: "power1.out" }, 1.12)
        .to(photos ?? [], { autoAlpha: 1, y: 0, scale: 1, duration: .72, stagger: .14, ease: "back.out(1.25)" }, 1.2)
        .to(friendsRef.current, { autoAlpha: 1, y: 0, duration: .78, ease: "power2.out" }, 1.55)
        .to(envelopeRef.current, { autoAlpha: 0, scale: .9, y: -22, rotateZ: -2, duration: .92, ease: "power2.inOut" }, 1.42)
        .to(theaterRef.current, { zIndex: 6, duration: .01 }, 1.72)
        .to(theaterRef.current, { scale: 1.025, duration: .42, ease: "power1.out" }, 2.8)
        .to(theaterRef.current, { scale: 1, duration: .48, ease: "power1.inOut" }, 3.22)
        .to({}, { duration: 2.02 }, 3.42)
        .call(() => { /* capture reaches its final pose here */ }, [], 5.44);
      (window as Window & { __anniversaryOpeningTimeline?: gsap.core.Timeline }).__anniversaryOpeningTimeline = timelineRef.current;
    }, canvasRef);
    return () => {
      context.revert();
      timelineRef.current = null;
      delete (window as Window & { __anniversaryOpeningTimeline?: gsap.core.Timeline }).__anniversaryOpeningTimeline;
    };
  }, [renderMode]);

  useEffect(() => {
    if (renderMode || openingState !== "envelope-opening" || (!openingGifReady && !openingGifFailed)) return;
    const video = videoRef.current;
    if (!video) { finishRef.current(); return; }
    mp4FallbackRef.current = false;
    video.currentTime = 0;
    void video.play().catch(() => retryWithMp4Fallback(video, mp4FallbackRef, () => finishRef.current()));
  }, [openingState, renderMode, openingGifReady, openingGifFailed]);

  const openEnvelope = () => {
    if (openingState !== "envelope-idle") return;
    if (reducedMotion) {
      finishRef.current();
      return;
    }
    setOpeningState("envelope-opening");
    if (renderMode) timelineRef.current?.play(0);
  };

  const theaterVisible = renderMode || openingState === "theater-complete" || openingState === "scroll-invitation";
  const interactive = openingState === "scroll-invitation";
  const videoActive = !renderMode && (openingState === "envelope-opening" || openingState === "theater-reveal");

  return <div className="opening-experience" data-opening-state={openingState}>
    <div className="opening-botanicals" aria-hidden="true">
      <BotanicalCluster asset="letter" className="opening-botanicals__left" />
      <BotanicalCluster asset="card" className="opening-botanicals__right" />
      <PaperGarden className="opening-botanicals__garden opening-botanicals__garden--left" />
      <PaperGarden className="opening-botanicals__garden opening-botanicals__garden--right" />
    </div>
    <div className="opening-canvas" ref={canvasRef} role="group" aria-label={anniversary.openingSceneLabel}>
      <Image src="/media/anniversary-theater-final-alpha.png" alt="" aria-hidden="true" width={1000} height={694} priority unoptimized className="theater-final-preload" />
      {renderMode ? <TheaterArtwork
        theaterRef={theaterRef}
        photosRef={photosRef}
        friendsRef={friendsRef}
        photoStates={photoStates}
        onPhotoStateChange={onPhotoStateChange}
        onOpenPhoto={onOpenPhoto}
        interactive={interactive}
      /> : theaterVisible ? <TheaterPoster onOpenPhoto={onOpenPhoto} /> : null}
      {(renderMode || openingState === "envelope-idle") && <EntryEnvelope
        envelopeRef={envelopeRef}
        flapRef={flapRef}
        pocketRef={pocketRef}
        leftFoldRef={leftFoldRef}
        rightFoldRef={rightFoldRef}
        sealRef={sealRef}
        onOpen={openEnvelope}
      />}
      {videoActive && <>
        {!openingGifFailed && <Image
          src="/media/anniversary-opening.gif"
          alt=""
          aria-hidden="true"
          width={1000}
          height={694}
          unoptimized
          priority
          className="opening-animation"
          onLoad={() => setOpeningGifReady(true)}
          onError={() => setOpeningGifFailed(true)}
        />}
        <video
        ref={videoRef}
        className={`opening-video${openingGifFailed ? " is-fallback" : ""}`}
        aria-hidden="true"
        tabIndex={-1}
        playsInline
        muted
        preload="auto"
        poster="/media/anniversary-opening-poster.png"
        onTimeUpdate={event => {
          if (event.currentTarget.currentTime >= 1.25) {
            setOpeningState(current => current === "envelope-opening" ? "theater-reveal" : current);
          }
        }}
        onEnded={finishOpening}
        onError={event => {
          const video = event.currentTarget;
          if (mp4FallbackRef.current) {
            if (video.currentSrc.endsWith(".mp4") && video.error) finishRef.current();
            return;
          }
          retryWithMp4Fallback(video, mp4FallbackRef, () => finishRef.current());
        }}
      >
        <source src="/media/anniversary-opening.webm" type="video/webm" />
        <source src="/media/anniversary-opening.mp4" type="video/mp4" />
        </video>
      </>}
    </div>
    <div className={`opening-caption${interactive ? " opening-caption--visible" : ""}`} aria-hidden={!interactive}>
      <p className="opening-caption__kicker">{anniversary.openingCaptionKicker}</p>
      <h2>{anniversary.openingCaptionTitle}</h2>
      <p className="opening-caption__copy">{anniversary.openingCaptionCopy}</p>
    </div>
    {openingState === "envelope-idle" && <p className="opening-instruction">{anniversary.openingInstruction}</p>}
    <p ref={invitationRef} tabIndex={-1} className={`scroll-invitation${interactive ? " scroll-invitation--visible" : ""}`} aria-hidden={!interactive} role={interactive ? "status" : undefined}>
      {anniversary.scrollInvitation}
      <ArrowDown className="scroll-invitation__arrow" aria-hidden="true" size={20} />
    </p>
  </div>;
}

function EntryEnvelope({
  envelopeRef,
  flapRef,
  pocketRef,
  leftFoldRef,
  rightFoldRef,
  sealRef,
  onOpen
}: {
  envelopeRef: RefObject<HTMLButtonElement | null>;
  flapRef: RefObject<HTMLSpanElement | null>;
  pocketRef: RefObject<HTMLSpanElement | null>;
  leftFoldRef: RefObject<HTMLSpanElement | null>;
  rightFoldRef: RefObject<HTMLSpanElement | null>;
  sealRef: RefObject<HTMLSpanElement | null>;
  onOpen: () => void;
}) {
  return <button ref={envelopeRef} type="button" className="entry-envelope" aria-label={anniversary.openingButtonLabel} onClick={onOpen}>
    <span className="entry-envelope__back" aria-hidden="true" />
    <span ref={leftFoldRef} className="entry-envelope__side entry-envelope__side--left" aria-hidden="true" />
    <span ref={rightFoldRef} className="entry-envelope__side entry-envelope__side--right" aria-hidden="true" />
    <span className="entry-envelope__inner" aria-hidden="true" />
    <span ref={pocketRef} className="entry-envelope__pocket" aria-hidden="true" />
    <span ref={flapRef} className="entry-envelope__flap" aria-hidden="true" />
    <span ref={sealRef} className="entry-envelope__seal" aria-hidden="true"><Heart size={25} fill="currentColor" /></span>
  </button>;
}

function TheaterArtwork({
  theaterRef,
  photosRef,
  friendsRef,
  photoStates,
  onPhotoStateChange,
  onOpenPhoto,
  interactive
}: {
  theaterRef: RefObject<HTMLDivElement | null>;
  photosRef: RefObject<HTMLDivElement | null>;
  friendsRef: RefObject<HTMLDivElement | null>;
  photoStates: Record<number, PhotoState>;
  onPhotoStateChange: (index: number, state: PhotoState) => void;
  onOpenPhoto: (index: number, trigger: HTMLButtonElement) => void;
  interactive: boolean;
}) {
  return <div className="paper-theatre" ref={theaterRef} aria-hidden={!interactive} inert={!interactive}>
    <Image className="paper-theatre__shell" src="/artwork/paper-theater-shell-v2.webp" alt="" aria-hidden="true" width={1506} height={1045} sizes="(max-width: 700px) 92vw, 78vw" priority unoptimized />
    <div className="theater-photos" ref={photosRef}>
      <div className="theater-photo-wrap theater-photo-wrap--main">
        <PhotoFrame photo={anniversary.photos[6]} index={6} state={photoStates[6] ?? "loading"} onStateChange={onPhotoStateChange} onOpen={onOpenPhoto} featured />
      </div>
    </div>
    <div className="paper-theatre__friends" ref={friendsRef}><PaperFriends /></div>
  </div>;
}

function TheaterPoster({ onOpenPhoto }: { onOpenPhoto: (index: number, trigger: HTMLButtonElement) => void }) {
  const hotspots = [{ index: 6, className: "theater-hotspot--main" }];
  return <div className="theater-poster" role="group" aria-label={anniversary.finalStageLabel}>
          <Image src="/media/anniversary-theater-final-alpha.png" alt="" aria-hidden="true" fill sizes="(max-width: 700px) 92vw, 78vw" className="theater-poster__image" unoptimized priority />
    {hotspots.map(({ index, className }) => <button
      key={index}
      type="button"
      className={`theater-hotspot ${className}`}
      aria-label={`Mở ${anniversary.photos[index].label}: ${anniversary.photos[index].alt}`}
      aria-haspopup="dialog"
      onClick={event => onOpenPhoto(index, event.currentTarget)}
    />)}
  </div>;
}

function FirstLoveLetterEnvelope({ open }: { open: boolean }) {
  const [animationLoaded, setAnimationLoaded] = useState(false);
  return <div className={`letter-canvas${open ? " letter-canvas--open" : ""}`}>
    {(!open || !animationLoaded) && <div className="letter-envelope" aria-hidden="true" inert={open}>
      <div className="letter-envelope__back" />
      <div className="letter-envelope__inner" />
      <div className="letter-envelope__side-flap letter-envelope__side-flap--left" />
      <div className="letter-envelope__side-flap letter-envelope__side-flap--right" />
      <div className="letter-envelope__pocket"><span>Kỷ niệm 4 năm</span></div>
      <div className="letter-envelope__top-flap"><span>Gửi em yêu,</span></div>
      <span className="letter-envelope__seal"><Heart size={20} fill="currentColor" /></span>
    </div>}
    {open && <div className={`letter-animation-frame${animationLoaded ? " is-ready" : ""}`}>
      <KeepsakeAnimation name="anniversary-letter" onLoad={() => setAnimationLoaded(true)} />
    </div>}
    <FoldingLoveLetter open={open} />
  </div>;
}

function FoldingLoveLetter({ open }: { open: boolean }) {
  return <article id="letter-copy" className="visually-hidden" aria-hidden={!open} inert={!open}>
    <div className="letter-sheet__header">
      <span>Gửi em yêu,</span>
      <span>Kỷ niệm <strong>4 năm</strong></span>
    </div>
    <div className="letter-copy">
      {anniversary.letter.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </div>
    <div className="letter-sheet__signature">
      <span>Thương em nhiều,</span>
      <Heart aria-hidden="true" size={15} fill="currentColor" />
    </div>
  </article>;
}

function AnniversaryGreetingCard({ open }: { open: boolean }) {
  const [animationLoaded, setAnimationLoaded] = useState(false);
  return <div className={`postcard-perspective${open ? " postcard-perspective--open" : ""}`}>
    {(!open || !animationLoaded) && <div className="postcard postcard--closed" aria-hidden={open} inert={open}>
      <CardInterior open={false} />
      <CardCover />
    </div>}
    {open && <div className={`postcard-animation-frame${animationLoaded ? " is-ready" : ""}`}>
      <KeepsakeAnimation name="anniversary-postcard" onLoad={() => setAnimationLoaded(true)} />
    </div>}
    {open && animationLoaded && <CardInterior open visuallyHidden />}
  </div>;
}

function KeepsakeAnimation({ name, onLoad }: { name: "anniversary-letter" | "anniversary-postcard"; onLoad: () => void }) {
  return <picture className="keepsake-animation">
    <source media="(prefers-reduced-motion: reduce) and (max-width: 700px)" srcSet={`/media/${name}-mobile-final.png`} />
    <source media="(prefers-reduced-motion: reduce)" srcSet={`/media/${name}-final.png`} />
    <source media="(max-width: 700px)" srcSet={`/media/${name}-mobile.gif`} />
    <Image src={`/media/${name}.gif`} alt="" fill unoptimized loading="eager" sizes="100vw" onLoad={() => onLoad()} />
  </picture>;
}

function CardInterior({ open, visuallyHidden = false }: { open: boolean; visuallyHidden?: boolean }) {
  return <div id="final-note-copy" className={visuallyHidden ? "visually-hidden" : "postcard__inside"} aria-hidden={!open} inert={!open}>
    <div className="postcard__page postcard__page--left">
      <span className="postcard__page-label">Kỷ niệm 4 năm</span>
      <BotanicalCluster asset="letter" className="postcard__inside-botanical" />
    </div>
    <div className="postcard__page postcard__page--right">
      <span className="postcard__address">Gửi em yêu,</span>
      <p>{anniversary.finalNote}</p>
      <span className="postcard__signature">Thương em nhiều,</span>
    </div>
  </div>;
}

function CardCover() {
  const memoryPhoto = anniversary.photos[6];
  return <div className="postcard__cover" aria-hidden="true">
    <div className="postcard__cover-face postcard__cover-face--front">
      <span className="postcard__cover-kicker">Mừng tụi mình tròn 4 năm</span>
      <h3>{anniversary.finalTitle}</h3>
      <BotanicalCluster asset="card" className="postcard__cover-botanical" />
      <CardStamp />
    </div>
    <div className="postcard__cover-face postcard__cover-face--back">
      <span>Kỷ niệm 4 năm</span>
      <div className="postcard__cover-photo">
        <Image
          src={memoryPhoto.src}
          alt=""
          fill
          sizes="(max-width: 700px) 35vw, 250px"
          unoptimized
          className="postcard__cover-photo-img"
        />
      </div>
      <span className="postcard__page-note">Bốn năm bên nhau</span>
      <BotanicalCluster asset="letter" className="postcard__cover-back-botanical" />
    </div>
  </div>;
}

function CardStamp() {
  return <span className="postcard__stamp" aria-hidden="true">
    <Heart size={20} fill="currentColor" />
  </span>;
}

function BotanicalCluster({ asset, className }: { asset: "letter" | "card"; className: string }) {
  const src = asset === "letter" ? "/artwork/botanical-letter.webp" : "/artwork/botanical-card.webp";
  const dimensions = asset === "letter" ? { width: 1086, height: 1448 } : { width: 1448, height: 1086 };
  return <Image
    src={src}
    alt=""
    aria-hidden="true"
    width={dimensions.width}
    height={dimensions.height}
    sizes="(max-width: 700px) 26vw, 18vw"
    loading="lazy"
    unoptimized
    className={className}
  />;
}

function PaperGarden({ className }: { className: string }) {
  const id = useId().replace(/:/g, "");
  return <svg className={className} viewBox="0 0 260 200" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <pattern id={`${id}-deep-paper`} patternUnits="userSpaceOnUse" width="260" height="200">
        <rect width="260" height="200" fill="#315e45" />
        <image href="/paper-textures/paper-fiber.webp" width="260" height="200" preserveAspectRatio="xMidYMid slice" opacity=".68" />
      </pattern>
      <pattern id={`${id}-sage-paper`} patternUnits="userSpaceOnUse" width="260" height="200">
        <rect width="260" height="200" fill="#477651" />
        <image href="/paper-textures/paper-fine.webp" width="260" height="200" preserveAspectRatio="xMidYMid slice" opacity=".62" />
      </pattern>
      <pattern id={`${id}-leaf-paper`} patternUnits="userSpaceOnUse" width="260" height="200">
        <rect width="260" height="200" fill="#739465" />
        <image href="/paper-textures/paper-crease.webp" width="260" height="200" preserveAspectRatio="xMidYMid slice" opacity=".56" />
        <image href="/paper-textures/paper-handmade.webp" width="260" height="200" preserveAspectRatio="xMidYMid slice" opacity=".16" />
      </pattern>
      <pattern id={`${id}-petal-paper`} patternUnits="userSpaceOnUse" width="260" height="200">
        <rect width="260" height="200" fill="#fff2d7" />
        <image href="/paper-textures/paper-fiber.webp" width="260" height="200" preserveAspectRatio="xMidYMid slice" opacity=".66" />
      </pattern>
      <pattern id={`${id}-ochre-paper`} patternUnits="userSpaceOnUse" width="260" height="200">
        <rect width="260" height="200" fill="#e7ac4c" />
        <image href="/paper-textures/paper-fiber.webp" width="260" height="200" preserveAspectRatio="xMidYMid slice" opacity=".5" />
      </pattern>
    </defs>
    <path d="M0 182c22-29 34-20 50-13 15-44 38-54 70-37 18-48 57-60 82-25 32-22 58-8 65 25v68H0z" fill={`url(#${id}-deep-paper)`} />
    <path d="M0 194c26-26 45-28 66-5 22-35 45-40 69-19 25-30 50-28 70-5 21-20 36-19 55-8v43H0z" fill={`url(#${id}-sage-paper)`} />
    <path d="M22 134c-18-20-14-45-2-54 27 3 33 26 28 44M129 128c-21-34-12-60 10-68 20 21 20 43 4 65M211 141c4-36 21-49 41-48 9 25-5 47-30 56" fill={`url(#${id}-leaf-paper)`} />
    <path d="M49 175c0-28 6-45 17-62m0 62c-10-25-21-31-32-35m32-10c12-17 20-22 30-23" stroke={`url(#${id}-leaf-paper)`} strokeWidth="3" strokeLinecap="round" />
    <g transform="translate(91 149)"><path d="M0-23c8-10 17-3 15 6 12-5 19 7 10 15 11 8 3 20-9 17-6 14-20 10-21-2-14 2-18-13-7-19-7-9 1-18 12-17z" fill={`url(#${id}-petal-paper)`}/><circle cx="6" cy="0" r="6" fill={`url(#${id}-ochre-paper)`} /></g>
    <g transform="translate(219 169) scale(.8)"><path d="M0-23c8-10 17-3 15 6 12-5 19 7 10 15 11 8 3 20-9 17-6 14-20 10-21-2-14 2-18-13-7-19-7-9 1-18 12-17z" fill={`url(#${id}-petal-paper)`}/><circle cx="6" cy="0" r="6" fill={`url(#${id}-ochre-paper)`} /></g>
    <g transform="translate(21 183) scale(.62)"><path d="M0-23c8-10 17-3 15 6 12-5 19 7 10 15 11 8 3 20-9 17-6 14-20 10-21-2-14 2-18-13-7-19-7-9 1-18 12-17z" fill={`url(#${id}-petal-paper)`}/><circle cx="6" cy="0" r="6" fill={`url(#${id}-ochre-paper)`} /></g>
  </svg>;
}

function PaperFriends() {
  return <Image
    className="paper-friends"
    src="/artwork/paper-friends.webp"
    alt=""
    aria-hidden="true"
    width={1254}
    height={1254}
    sizes="(max-width: 700px) 40vw, 18vw"
    priority
    unoptimized
  />;
}
