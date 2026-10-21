"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, LockKeyhole } from "lucide-react";
import type { AnniversaryData } from "@/lib/anniversary-data";

export function LockScreen({ data }: { data: AnniversaryData }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (value: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.message ?? "Mật khẩu chưa đúng, bé Bo thử lại nhé.");
        setPassword("");
        return;
      }
      router.refresh();
    } catch {
      setError("Mạng chậm quá, em thử lại giúp anh nhé.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-5 py-12">
      <div className="aurora absolute inset-0" />
      <div className="relative z-10 w-full max-w-md text-center">
        <p className="eyebrow mb-8">Một điều nhỏ, chỉ dành cho em</p>

        <div className="royal-border relative mx-auto mb-8 grid aspect-[4/3] w-full max-w-sm place-items-center bg-[#0d0d12] p-8">
          <div className="absolute inset-3 border border-rose-300/10" />
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-rose-300">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-rose-300/50 bg-[#9b2a52] shadow-[0_0_32px_#9b2a5260]"><Heart size={17} fill="currentColor" /></span>
          </div>
          <div>
            <p className="font-script text-4xl text-rose-300">Gửi bé {data.nickname}</p>
            <p className="mt-3 font-display text-3xl italic text-pearl">Một bức thư trong đêm</p>
            <div className="mx-auto my-5 h-px w-16 bg-rose-300/50" />
            <p className="text-xs tracking-[.24em] text-silver">30 · 10 · 2026</p>
          </div>
        </div>

        <p className="mb-5 font-display text-2xl italic text-silver">Dành riêng cho {data.herName}</p>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(password); }}
          className="mx-auto flex max-w-xs gap-2"
        >
          <label className="sr-only" htmlFor="pass">Mật khẩu</label>
          <input
            id="pass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            placeholder="Mật mã bí mật"
            className="min-w-0 flex-1 rounded-full border border-rose-300/20 bg-onyx px-4 py-3 text-center tracking-[.3em] text-pearl placeholder:tracking-normal placeholder:text-platinum focus:border-rose-300 outline-none"
          />
          <button type="submit" disabled={busy} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rose-400 text-ink transition hover:bg-blush disabled:opacity-50" aria-label="Mở khóa"><LockKeyhole size={18} /></button>
        </form>

        {error && <p role="alert" className="mt-3 text-xs text-rose-200/90">{error}</p>}

        <p className="mt-3 text-xs text-platinum">Một ngày đặc biệt của hai đứa mình · gợi ý: 30/10</p>
      </div>
    </main>
  );
}
