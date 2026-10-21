"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import { ArrowDown, ChevronLeft, Heart } from "lucide-react";
import { toast } from "sonner";
import { splitDuration, pad } from "@/lib/dates";
import type { AnniversaryData } from "@/lib/anniversary-data";
import { LenisProvider } from "@/components/shared/lenis-provider";
import { PetalField } from "@/components/fx/petal-field";
import { MusicToggle } from "@/components/shared/music-toggle";
import { HoldButton } from "@/components/fx/hold-button";
import { Lightbox } from "@/components/fx/lightbox";
import { Companion } from "@/components/fx/companion";
import { PhotoImage } from "@/components/fx/photo-src";

const roseColors = ["#f9dbe5", "#f4b6c8", "#ec8fab", "#dd6489", "#f4f0f6", "#bdb8c4"];
const spring = { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.9 };

export default function AnniversaryPage({ data }: { data: AnniversaryData }) {
  const [opened, setOpened] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [yes, setYes] = useState(false);
  const [gentleReply, setGentleReply] = useState(false);
  const [starNote, setStarNote] = useState<number | null>(null);
  const [secret, setSecret] = useState(false);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [reply, setReply] = useState("");
  const progressRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const duration = useMemo(() => (now === null ? null : splitDuration(now)), [now]);
  const anniversaryTime = new Date(data.anniversaryAt).getTime();
  const isAnniversary = now !== null && new Date(now).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }) === "2026-10-30";
  const daysUntil = now === null ? 0 : Math.max(0, Math.ceil((anniversaryTime - now) / 86400000));
  const activeDay = now !== null && now >= anniversaryTime;

  const photo = (id: string) => data.gallery.find((p) => p.id === id);
  const galleryPhotos = data.gallery.map((p) => ({ id: p.id, fallback: p.fallback, caption: p.caption, date: p.date }));

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const root = document.documentElement;
        const max = root.scrollHeight - window.innerHeight;
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const openLetter = () => {
    setOpened(true);
    if (!reduced) window.setTimeout(() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" }), 400);
    else document.getElementById("hero")?.scrollIntoView();
  };

  const confettiBurst = () =>
    confetti({ particleCount: 130, spread: 90, startVelocity: 35, origin: { y: 0.62 }, colors: roseColors, disableForReducedMotion: true });

  const accept = () => {
    setYes(true);
    confettiBurst();
    toast.success(`Anh yêu em, ${data.nickname} ơi 💗`, { description: "Bốn năm rồi, anh vẫn chọn em." });
  };

  const toggleFlip = (i: number) => setFlipped((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép lời của em 💗", { description: "Dán vào Zalo gửi anh nhé, anh đọc là ấm lòng lắm đó." });
      setReply("");
    } catch {
      toast.error("Trình duyệt không cho sao chép. Em copy tay giúp anh nhé.");
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <LenisProvider />
      {opened ? (
        <>
          <PetalField count={reduced ? 0 : 16} />
          <MusicToggle unlocked={opened} />
          <div ref={progressRef} className="pointer-events-none fixed left-0 top-0 z-50 h-[3px] w-full origin-left scale-x-0 bg-gradient-to-r from-rose-300 via-rose-400 to-white/80 shadow-[0_0_12px_#ec8fab80]" aria-hidden />
          <header className="fixed top-0 z-40 flex w-full items-center justify-between gap-3 border-b border-white/5 bg-ink/55 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
            <a href="#hero" className="shrink-0 font-script text-xl text-rose-300 sm:text-2xl">T. & B.</a>
            <nav aria-label="Điều hướng chính" className="flex min-w-0 items-center gap-3 overflow-x-auto text-[10px] text-silver sm:gap-5 sm:text-xs">
              {[["Dòng thời gian", "#timeline"], ["Khoảnh khắc", "#gallery"], ["Lá thư", "#letter"], ["Lời hứa", "#promises"]].map(([label, href]) => (
                <a key={href} className="shrink-0 transition hover:text-rose-300" href={href}>{label}</a>
              ))}
            </nav>
            <span className="hidden shrink-0 text-[10px] tracking-[.18em] text-platinum sm:block">30 · 10 · 2026</span>
          </header>
          <main className="overflow-hidden">
            <section id="hero" className="relative grid min-h-svh place-items-center px-5 pb-16 pt-24 text-center">
              <div className="aurora absolute inset-0" />
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#bdb8c4 0.7px,transparent .7px)", backgroundSize: "42px 42px" }} />
              <motion.div initial={reduced ? false : "hidden"} animate="show" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.12 } } }} className="relative z-10">
                <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="eyebrow mb-4">Một hành trình · Một người thương</motion.p>
                <div className="anniversary-mark relative mx-auto w-fit">
                  <motion.div variants={{ hidden: { opacity: 0, scale: 0.72, rotate: -8 }, show: { opacity: 1, scale: 1, rotate: 0, transition: { ...spring, duration: 1.2 } } }} className="relative z-10 font-display text-[clamp(9rem,35vw,20rem)] font-light leading-[.72] tracking-[-.08em] text-rose-gradient">{data.years}</motion.div>
                  <span aria-hidden className="anniversary-orbit" />
                  <motion.span aria-hidden className="hero-spark" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.9, 0.35], scale: [0, 1, 0.7] }} transition={{ duration: 2.8, repeat: Infinity, repeatType: "mirror", delay: 0.6 }} />
                </div>
                <motion.p variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="mt-7 font-display text-4xl italic text-pearl sm:text-6xl">năm bên nhau</motion.p>
                <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-5 font-script text-5xl text-rose-300 sm:text-7xl">{data.herName}</motion.p>
                <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-5 text-xs tracking-[.22em] text-silver sm:text-sm">30 · 10 · 2022 <span className="px-2 text-rose-400">→</span> 30 · 10 · 2026</motion.p>
                <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mx-auto mt-10 max-w-sm text-sm leading-7 text-silver">Bốn năm — và anh vẫn chọn em, mỗi ngày.</motion.p>
              </motion.div>
              <a href="#counter" aria-label="Cuộn xuống" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-rose-300"><ArrowDown size={20} strokeWidth={1} /></a>
            </section>
            <section id="counter" className="section-shell py-24 text-center sm:py-36">
              <p className="eyebrow mb-5">Every second, still you</p>
              <h2 className="section-title">Thời gian có thể đếm,<br /><span className="italic text-rose-gradient">thương em thì không.</span></h2>
              <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-silver">{isAnniversary ? "Hôm nay là ngày của chúng mình. Chúc mừng bốn năm, bé Bo." : activeDay ? "Mỗi giây đi qua đều là một phần ký ức của hai đứa mình." : `Còn ${daysUntil} ngày nữa là đến ngày kỷ niệm bốn năm.`}</p>
              <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {[{ v: duration?.days ?? "—", l: "ngày" }, { v: duration ? pad(duration.hours) : "—", l: "giờ" }, { v: duration ? pad(duration.minutes) : "—", l: "phút" }, { v: duration ? pad(duration.seconds) : "—", l: "giây" }].map((item) => (
                  <div key={item.l} className="glass royal-border rounded-2xl px-3 py-6 sm:py-8">
                    <AnimatePresence mode="popLayout">
                      <motion.div key={String(item.v)} initial={reduced ? false : { y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="font-display text-5xl font-light text-rose-gradient sm:text-6xl">{item.v}</motion.div>
                    </AnimatePresence>
                    <p className="mt-2 text-[10px] uppercase tracking-[.22em] text-platinum">{item.l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-silver">
                <span className="rounded-full border border-rose-300/15 px-4 py-2">♑ Bền bỉ như Ma Kết</span>
                <span className="rounded-full border border-rose-300/15 px-4 py-2">4 mùa thu đã có nhau</span>
                <span className="rounded-full border border-rose-300/15 px-4 py-2">Vô số lần nhớ em</span>
              </div>
            </section>
            <section id="timeline" className="relative py-24 sm:py-32">
              <div className="section-shell">
                <div className="mb-16 text-center">
                  <p className="eyebrow mb-4">Những trang đầu của chúng mình</p>
                  <h2 className="section-title">Từng chặng đường<br /><span className="italic text-rose-gradient">mình đã đi qua</span></h2>
                  <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-silver">Có những ngày thành dấu mốc. Có những điều nhỏ bé, sau này nhớ lại mới thấy quý vô cùng.</p>
                </div>
                <div className="relative mx-auto max-w-4xl">
                  <div className="absolute bottom-0 left-[7px] top-0 w-px bg-gradient-to-b from-rose-300/70 via-rose-500/25 to-transparent md:left-1/2" />
                  {data.timeline.map((item, i) => {
                    const p = photo(item.photo);
                    return (
                      <motion.article key={item.date} initial={reduced ? false : { opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10% 0px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className={`relative mb-8 pl-8 md:mb-12 md:w-1/2 md:pl-0 ${i % 2 === 0 ? "md:pr-12" : "md:ml-auto md:pl-12"}`}>
                        <span className={`absolute left-0 top-7 h-4 w-4 rounded-full border border-rose-300 bg-ink shadow-[0_0_20px_#ec8fab70] md:left-auto ${i % 2 === 0 ? "md:-right-[8px]" : "md:-left-[8px]"}`} />
                        <div className="glass royal-border overflow-hidden rounded-2xl">
                          {p && (
                            <button type="button" onClick={() => setSelected(p.id)} aria-label={`Phóng to ảnh: ${item.title}`} className="group relative block h-44 w-full overflow-hidden sm:h-52">
                              <PhotoImage id={p.id} fallback={p.fallback} alt={item.title} className="h-full w-full object-cover opacity-80 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-95 group-hover:grayscale-0" />
                              <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] uppercase tracking-[.16em] text-pearl opacity-0 transition group-hover:opacity-100">Phóng to</span>
                            </button>
                          )}
                          <div className="p-5 sm:p-7">
                            <p className="eyebrow">{item.date}</p>
                            <h3 className="mt-3 font-display text-3xl italic text-pearl">{item.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-silver">{item.text}</p>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            </section>
            <section id="gallery" className="section-shell py-24 sm:py-32">
              <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="eyebrow mb-4">Album của hai đứa</p>
                  <h2 className="section-title">Khoảnh khắc<br /><span className="italic text-rose-gradient">mình giữ lại</span></h2>
                </div>
                <p className="max-w-sm text-sm leading-7 text-silver">Một album chỉ có ý nghĩa khi mỗi khung hình là chuyện thật của hai đứa. Chạm vào ảnh bất kỳ để phóng to và vuốt qua từng tấm.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {data.gallery.map((p, i) => (
                  <motion.button key={p.id} type="button" onClick={() => setSelected(p.id)} whileHover={reduced ? {} : { y: -5, rotate: i % 2 === 0 ? -1 : 1 }} whileTap={{ scale: 0.98 }} className={`group relative overflow-hidden rounded-sm border border-rose-300/15 bg-onyx p-2 text-left ${i % 5 === 1 ? "sm:translate-y-7" : ""}`} aria-label={`Mở ảnh: ${p.caption}`}>
                    <div className={`relative overflow-hidden ${i % 4 === 0 ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
                      <PhotoImage id={p.id} fallback={p.fallback} alt={p.caption} className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-95 group-hover:grayscale-0" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-70" />
                    </div>
                    <div className="px-2 pb-2 pt-3">
                      <p className="font-display text-lg italic text-pearl sm:text-xl">{p.caption}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[.2em] text-platinum">{p.date}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
            <section id="letter" className="relative py-24 sm:py-36">
              <div className="aurora absolute inset-0 opacity-50" />
              <div className="section-shell relative max-w-3xl">
                <div className="royal-border bg-onyx/65 px-6 py-10 backdrop-blur-xl sm:px-14 sm:py-16">
                  <div className="mb-10 text-center">
                    <p className="eyebrow mb-4">A letter from {data.hisName}</p>
                    <Heart className="mx-auto text-rose-400" size={20} />
                    <h2 className="section-title mt-5">Gửi <span className="italic text-rose-gradient">bé {data.nickname}</span></h2>
                  </div>
                  <div className="space-y-5 font-display text-xl leading-[1.9] text-pearl/90 sm:text-2xl">
                    {data.letter.map((p, i) => (
                      <motion.p key={i} initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: 0.8, delay: Math.min(i * 0.08, 0.3) }} className={i === 0 || i === data.letter.length - 1 ? "italic text-rose-300" : ""}>{p}</motion.p>
                    ))}
                  </div>
                  <div className="mt-12 border-t border-rose-300/15 pt-8 text-right">
                    <p className="font-display text-sm italic text-silver">Mãi thương em,</p>
                    <p className="mt-1 font-script text-5xl text-rose-300">{data.hisName}</p>
                  </div>
                </div>
              </div>
            </section>
            <section id="constellation" className="relative overflow-hidden py-24 sm:py-36">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#bdb8c4 .8px,transparent .8px)", backgroundSize: "57px 57px" }} />
              <div className="section-shell relative">
                <div className="text-center">
                  <p className="eyebrow mb-4">♑ Capricorn · {data.zodiac}</p>
                  <h2 className="section-title">Chậm mà chắc,<br /><span className="italic text-rose-gradient">như cách mình thương nhau</span></h2>
                  <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-silver">Ma Kết leo từng bước, chậm mà chắc — như cách em đã cùng anh đi qua bốn năm. Chạm vào một ngôi sao nhé, Bo.</p>
                </div>
                <div className="relative mx-auto mt-14 h-[360px] max-w-2xl sm:h-[430px]">
                  {[[18, 20], [42, 9], [56, 30], [35, 42], [66, 52], [48, 68], [76, 78]].map(([x, y], i) => (
                    <div key={i}>
                      <div className="absolute h-px origin-left bg-gradient-to-r from-rose-300/60 to-silver/20" style={{ left: `${x}%`, top: `${y}%`, width: i === 0 ? "25%" : i === 1 ? "15%" : "20%", transform: `rotate(${[18, 65, 128, -42, 155, -70, 0][i]}deg)` }} />
                      <button onClick={() => setStarNote(i % data.starNotes.length)} aria-label={`Lời nhắn ngôi sao ${i + 1}`} className="star z-10 transition hover:scale-[2.2]" style={{ left: `${x}%`, top: `${y}%`, width: i === 3 ? 8 : 5, height: i === 3 ? 8 : 5 }} />
                    </div>
                  ))}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                    <AnimatePresence mode="wait">
                      <motion.p key={starNote ?? "hint"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-sm font-display text-xl italic text-rose-300">{starNote === null ? "Chạm một vì sao để đọc lời nhắn" : data.starNotes[starNote]}</motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </section>
            <section id="promises" className="section-shell py-24 sm:py-32">
              <div className="mb-12 text-center">
                <p className="eyebrow mb-4">Four promises, from the heart</p>
                <h2 className="section-title">Những điều anh hứa<br /><span className="italic text-rose-gradient">không chỉ bằng lời</span></h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.promises.map((p, i) => {
                  const isFlipped = flipped.includes(i);
                  return (
                    <motion.button key={p.title} type="button" onClick={() => toggleFlip(i)} whileTap={{ scale: 0.98 }} className="group min-h-64 text-left" aria-pressed={isFlipped} aria-label={`Lời hứa: ${p.title}`}>
                      <span className="relative block min-h-64" style={{ perspective: "1200px" }}>
                        <motion.span animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.55, ...spring }} style={{ transformStyle: "preserve-3d" }} className="relative block min-h-64">
                          <span className="glass royal-border absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center" style={{ backfaceVisibility: "hidden" }}>
                            <span className="font-display text-6xl text-rose-gradient">0{i + 1}</span>
                            <Heart className="my-5 text-rose-400" size={19} />
                            <span className="font-display text-2xl italic">{p.title}</span>
                            <span className="mt-4 text-[10px] uppercase tracking-[.18em] text-platinum">Chạm để lật</span>
                          </span>
                          <span className="glass royal-border absolute inset-0 flex items-center justify-center rounded-2xl p-6" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                            <span className="text-sm leading-7 text-silver">{p.text}</span>
                          </span>
                        </motion.span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </section>
            <section id="finale" className="relative grid min-h-[90svh] place-items-center overflow-hidden px-5 py-24 text-center">
              <div className="aurora absolute inset-0" />
              <div className="relative z-10 mx-auto max-w-3xl">
                <Heart className="mx-auto mb-8 text-rose-400" size={25} fill={yes ? "currentColor" : "none"} />
                <p className="eyebrow mb-5">And our story goes on</p>
                <h2 className="section-title">{yes ? "Vậy mình đi tiếp nhé, Bo." : data.finale.question}</h2>
                <p className="mx-auto mt-7 max-w-lg text-sm leading-7 text-silver">{yes ? data.finale.afterYes : "Không cần câu trả lời thật lớn lao. Anh chỉ mong sau này, mỗi khi nghĩ về hôm nay, em vẫn thấy mình được yêu thương và trân trọng."}</p>
                <AnimatePresence>
                  {!yes && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 flex min-h-16 flex-wrap items-center justify-center gap-4">
                      <button onClick={accept} className="min-h-12 rounded-full bg-rose-400 px-7 py-3 text-sm font-medium text-ink shadow-[0_0_32px_#ec8fab35] transition hover:bg-blush"><Heart className="mr-2 inline" size={16} fill="currentColor" />{data.finale.yes}</button>
                      <button onClick={() => setGentleReply(true)} className="min-h-12 rounded-full border border-rose-300/25 px-6 py-3 text-sm text-silver transition hover:border-rose-300/60 hover:text-pearl">{data.finale.no}</button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {gentleReply && !yes && (
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-5 max-w-md text-sm leading-7 text-rose-200/80">Không sao cả, bé Bo cứ trả lời theo điều em thật sự cảm thấy. Anh muốn em luôn thấy an toàn và được tôn trọng khi ở bên anh.</motion.p>
                )}
                {yes && (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-10">
                    <p className="font-script text-5xl text-rose-300 sm:text-7xl">Anh yêu em, bé {data.nickname}</p>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })} className="mt-8 inline-flex items-center gap-2 rounded-full border border-rose-300/20 px-5 py-3 text-xs text-silver hover:text-rose-300"><ChevronLeft size={15} /> Xem lại từ đầu</button>
                  </motion.div>
                )}
              </div>
            </section>
            <section id="reply" className="section-shell py-20 sm:py-28">
              <div className="royal-border glass mx-auto max-w-2xl rounded-2xl p-6 text-center sm:p-10">
                <p className="eyebrow mb-4">Một lời nhắn gửi lại</p>
                <h2 className="font-display text-3xl italic text-pearl sm:text-4xl">{data.finale.replyTitle}</h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-silver">{data.finale.replyHint}</p>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={data.finale.replyPlaceholder} rows={3} className="mt-6 w-full resize-none rounded-xl border border-rose-300/20 bg-ink/60 px-4 py-3 text-sm leading-6 text-pearl placeholder:text-platinum focus:border-rose-300 outline-none" />
                <button onClick={sendReply} disabled={!reply.trim()} className="mt-4 min-h-11 rounded-full bg-rose-400 px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-40">Gửi anh 💗</button>
                <p className="mt-4 text-[11px] text-platinum">{data.finale.replyDone}</p>
              </div>
            </section>
          </main>
          <footer className="border-t border-rose-300/10 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 text-center">
            <HoldButton duration={900} onComplete={() => setSecret(true)} label="Giữ trái tim để mở lời nhắn bí mật" className="mx-auto block text-rose-400">
              <Heart size={18} fill="currentColor" />
            </HoldButton>
            <AnimatePresence>
              {secret && <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-4 max-w-md font-display text-xl italic text-rose-300">{data.secret}</motion.p>}
            </AnimatePresence>
            <p className="mt-4 text-[10px] uppercase tracking-[.24em] text-platinum">Made with love · 30.10.2026</p>
            <p className="mt-2 text-xs text-silver/60">{data.hisName} <span className="text-rose-400">×</span> {data.nickname}</p>
          </footer>
          <Companion lines={data.companionLines} />
          <Lightbox photos={galleryPhotos} index={selected === null ? null : data.gallery.findIndex((p) => p.id === selected)} onClose={() => setSelected(null)} onIndexChange={(next) => setSelected(data.gallery[next]?.id ?? null)} />
        </>
      ) : (
        <main className="relative grid min-h-svh place-items-center overflow-hidden px-5 py-12">
          <div className="aurora absolute inset-0" />
          <div className="relative z-10 w-full max-w-md text-center">
            <p className="eyebrow mb-8">Một điều nhỏ, chỉ dành cho em</p>
            <motion.div initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="royal-border relative mx-auto mb-8 grid aspect-[4/3] w-full max-w-sm place-items-center bg-[#0d0d12] p-8">
              <div className="absolute inset-3 border border-rose-300/10" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-rose-300"><span className="grid h-10 w-10 place-items-center rounded-full border border-rose-300/50 bg-[#9b2a52] shadow-[0_0_32px_#9b2a5260]"><Heart size={17} fill="currentColor" /></span></div>
              <div><p className="font-script text-4xl text-rose-300">Gửi bé {data.nickname}</p><p className="mt-3 font-display text-3xl italic text-pearl">Một bức thư trong đêm</p><div className="mx-auto my-5 h-px w-16 bg-rose-300/50" /><p className="text-xs tracking-[.24em] text-silver">30 · 10 · 2026</p></div>
            </motion.div>
            <p className="mb-5 font-display text-2xl italic text-silver">Dành riêng cho {data.herName}</p>
            <HoldButton duration={1400} onComplete={openLetter} label="Giữ để mở thư" className="mx-auto block text-rose-300">
              <span className="text-[10px] uppercase tracking-[.24em]">Giữ để mở</span>
            </HoldButton>
            <p className="mt-3 text-xs text-platinum">Một ngày đặc biệt của hai đứa mình · gợi ý: 30/10</p>
          </div>
        </main>
      )}
    </MotionConfig>
  );
}