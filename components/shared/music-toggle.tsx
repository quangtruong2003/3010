"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, VolumeX, Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type AudioEngine = {
  context: AudioContext;
  master: GainNode;
  timer: number | null;
  step: number;
};

const progression = [
  [261.63, 329.63, 392, 493.88], // Cmaj7
  [220, 261.63, 329.63, 392], // Am7
  [174.61, 220, 261.63, 329.63], // Fmaj7
  [196, 246.94, 293.66, 392], // Gsus2
];

function playNote(engine: AudioEngine, frequency: number, startAt: number, duration: number, volume: number, type: OscillatorType = "sine") {
  const { context, master } = engine;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(volume, startAt + 0.16);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(envelope);
  envelope.connect(master);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.04);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
}

function playPhrase(engine: AudioEngine) {
  const { context, step } = engine;
  const chord = progression[Math.floor(step / 2) % progression.length];
  const now = context.currentTime + 0.06;
  chord.forEach((frequency, index) => {
    playNote(engine, frequency / 2, now, 3.45, 0.035, "triangle");
    playNote(engine, frequency, now + index * 0.22, 1.9, 0.045, "sine");
  });
  const melody = [chord[2] * 2, chord[1] * 2, chord[3] * 2, chord[2] * 2, chord[1] * 2, chord[0] * 2, chord[2] * 2, chord[3] * 2];
  playNote(engine, melody[step % melody.length], now + 0.55, 2.25, 0.025, "sine");
  engine.step += 1;
}

const STORAGE_KEY = "noir-rose-music";

export function MusicToggle({ unlocked }: { unlocked: boolean }) {
  const engine = useRef<AudioEngine | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    try { const stored = localStorage.getItem(STORAGE_KEY); if (stored === "on") setEnabled(true); } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => { if (!hydrated) return; try { localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off"); } catch {} }, [enabled, hydrated]);

  useEffect(() => () => {
    const current = engine.current;
    if (!current) return;
    if (current.timer !== null) window.clearInterval(current.timer);
    void current.context.close();
    engine.current = null;
  }, []);

  const stop = () => {
    const current = engine.current;
    if (current) {
      if (current.timer !== null) window.clearInterval(current.timer);
      current.timer = null;
      current.master.gain.setTargetAtTime(0.0001, current.context.currentTime, 0.12);
      window.setTimeout(() => { void current.context.close(); if (engine.current === current) engine.current = null; }, 450);
    }
    setEnabled(false);
  };

  const start = async () => {
    if (!unlocked) return;
    try {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) throw new Error("Web Audio is not supported");
      const context = new AudioContextClass();
      await context.resume();
      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.55, context.currentTime + 1.4);
      master.connect(context.destination);
      const next: AudioEngine = { context, master, timer: null, step: 0 };
      engine.current = next;
      playPhrase(next);
      next.timer = window.setInterval(() => { if (context.state === "running") playPhrase(next); }, 3500);
      setEnabled(true);
      setUnavailable(false);
    } catch { setUnavailable(true); setEnabled(false); }
  };

  const toggle = () => { if (enabled) stop(); else void start(); };

  if (!hydrated) return null;

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-3">
      {unavailable && (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-rose-300/20 bg-onyx/95 px-3 py-2 text-xs text-silver shadow-lg backdrop-blur"
        >
          Thiết bị không hỗ trợ nhạc nền
        </motion.span>
      )}
      
      <motion.button
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? "Tắt nhạc nền" : "Bật nhạc nền"}
        title={enabled ? "Tắt nhạc nền" : "Bật nhạc nền"}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        className={`group relative grid h-12 w-12 place-items-center rounded-full border bg-onyx/90 text-rose-300 shadow-[0_0_30px_#9b2a5230] backdrop-blur-xl transition-all duration-300 ${enabled ? "border-rose-300/70 ring-4 ring-rose-300/10" : "border-rose-300/30"}`}
      >
        {/* Background glow ring */}
        {enabled && (
          <>
            <motion.span
              className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-rose-400/0 via-rose-300/15 to-rose-400/0"
              animate={{ 
                scale: [1, 1.12, 1], 
                opacity: [0.4, 0.8, 0.4],
                rotate: [0, 2, 0]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute inset-[-8px] rounded-full border border-rose-300/10"
              animate={{ 
                scale: [1, 1.08, 1], 
                opacity: [0.2, 0.5, 0.2],
                borderColor: ["rgba(244,182,200,.1)", "rgba(236,143,171,.3)", "rgba(244,182,200,.1)"]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        {/* Floating hearts when playing */}
        {enabled && !unavailable && !reduced && (
          <>
            <motion.span
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{ 
                scale: [0, 1, 0], 
                opacity: [0, 0.7, 0], 
                y: [0, -28, -55],
                x: [0, -8, -15]
              }}
              transition={{ duration: 3.2, delay: 0.3, repeat: Infinity, ease: "easeOut" }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-rose-300/70"
              style={{ fontSize: "11px", lineHeight: 1, textShadow: "0 0 8px #ec8fab" }}
            >
              ♡
            </motion.span>
            <motion.span
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{ 
                scale: [0, 1, 0], 
                opacity: [0, 0.6, 0], 
                y: [0, -32, -60],
                x: [0, 10, 20]
              }}
              transition={{ duration: 3.8, delay: 1.6, repeat: Infinity, ease: "easeOut" }}
              className="absolute -top-3 right-1/2 translate-x-1/2 text-rose-300/60"
              style={{ fontSize: "9px", lineHeight: 1, textShadow: "0 0 6px #ec8fab" }}
            >
              ♡
            </motion.span>
            <motion.span
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{ 
                scale: [0, 1, 0], 
                opacity: [0, 0.5, 0], 
                y: [0, -22, -45],
                x: [0, -5, -12]
              }}
              transition={{ duration: 4.2, delay: 2.8, repeat: Infinity, ease: "easeOut" }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 text-rose-300/50"
              style={{ fontSize: "8px", lineHeight: 1 }}
            >
              ♡
            </motion.span>
          </>
        )}

        {/* Icon */}
        <motion.span
          className="relative z-10"
          whileTap={{ scale: 0.85 }}
        >
          {enabled ? (
            <Music2 size={20} className="animate-pulse" />
          ) : (
            <VolumeX size={20} />
          )}
        </motion.span>

        {/* Tooltip */}
        <motion.span
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-ink/95 px-3 py-1.5 text-[10px] font-medium text-pearl shadow-xl backdrop-blur pointer-events-none"
        >
          {enabled ? "Tắt nhạc nền" : "Bật nhạc nền"}
        </motion.span>
      </motion.button>
    </div>
  );
}