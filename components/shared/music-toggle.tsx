"use client";
import { useEffect, useRef, useState } from "react";
import { Music2, VolumeX } from "lucide-react";
export function MusicToggle({ unlocked }: { unlocked: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { try { setEnabled(localStorage.getItem("noir-rose-music") === "on"); } catch {} }, []);
  useEffect(() => {
    if (!audio.current) return;
    if (unlocked && enabled) { audio.current.volume = 0; void audio.current.play().then(() => { const a = audio.current; if (!a) return; let v = 0; const timer = window.setInterval(() => { v = Math.min(.35, v + .025); if (a) a.volume = v; if (v >= .35) window.clearInterval(timer); }, 140); }).catch(() => setEnabled(false)); }
    else audio.current.pause();
  }, [enabled, unlocked]);
  const toggle = () => { const next = !enabled; setEnabled(next); try { localStorage.setItem("noir-rose-music", next ? "on" : "off"); } catch {} };
  return <><audio ref={audio} src="/audio/theme.mp3" loop preload="none" /><button onClick={toggle} aria-label={enabled ? "Tắt nhạc nền" : "Bật nhạc nền"} title={enabled ? "Tắt nhạc" : "Bật nhạc"} className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-rose-300/30 bg-onyx/90 text-rose-300 shadow-[0_0_30px_#9b2a5230] backdrop-blur transition hover:border-rose-300/70">{enabled ? <Music2 size={18}/> : <VolumeX size={18}/>}</button></>;
}