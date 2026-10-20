"use client";
export function PetalField({ count = 22 }: { count?: number }) {
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">{Array.from({ length: count }, (_, i) => <span key={i} className="petal" style={{ left: `${(i * 43) % 100}%`, animationDuration: `${12 + (i % 9)}s`, animationDelay: `${-(i % 14)}s`, opacity: .25 + (i % 5) * .08 }} />)}</div>;
}