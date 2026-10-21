"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";

type Props = {
  lines: readonly string[];
};

/**
 * Nhân vật ở góc màn hình: ảnh cắt nền toàn thân, bấm được.
 * Ảnh thật: đặt file PNG nền trong suốt tại /photos/companion.png (thư mục photos/, KHÔNG phải /public).
 * Route /api/photo/companion kiểm tra cookie rồi mới trả ảnh.
 * Nếu chưa có ảnh thật hoặc chưa mở khóa → tự ẩn.
 */
export function Companion({ lines }: Props) {
  const [line, setLine] = useState<number | null>(null);
  const [broken, setBroken] = useState(false);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    // chỉ hiện sau khi người dùng đã mở thư
    const t = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const speak = () => {
    setLine((l) => (l === null ? 0 : (l + 1) % lines.length));
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLine(null), 4200);
  };

  if (broken || !visible) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex flex-col items-start gap-2 p-3 sm:p-5">
      {line !== null && (
        <div className="pointer-events-auto max-w-[16rem] rounded-2xl rounded-bl-sm border border-rose-300/20 bg-onyx/95 px-4 py-3 text-sm leading-6 text-pearl shadow-2xl backdrop-blur">
          {lines[line]}
        </div>
      )}
      <button
        onClick={speak}
        aria-label="Nói chuyện với anh"
        className="pointer-events-auto group relative animate-[float_5s_ease-in-out_infinite]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/photo/companion"
          alt=""
          onError={() => setBroken(true)}
          className="h-32 w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,.6)] sm:h-40"
        />
        <span className="absolute -right-1 top-1 grid h-7 w-7 place-items-center rounded-full border border-rose-300/40 bg-onyx text-rose-300 opacity-0 transition group-hover:opacity-100">
          <Heart size={13} fill="currentColor" />
        </span>
      </button>
    </div>
  );
}