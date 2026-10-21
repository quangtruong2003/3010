import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sessionCookieName, verifySession } from "@/lib/session";
import { anniversary } from "@/lib/anniversary-data";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

/**
 * Phục vụ ảnh thật trong thư mục `photos/` — chỉ trả về khi đã mở khóa.
 * File nằm ngoài /public nên không thể tải trực tiếp.
 * Hỗ trợ id = "companion" cho ảnh cắt đặt góc.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!verifySession(req.cookies.get(sessionCookieName)?.value)) {
    return NextResponse.json({ ok: false, message: "Chưa mở khóa." }, { status: 401 });
  }

  if (!/^[a-z0-9_-]{1,24}$/i.test(id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Companion ảnh cắt đặt góc
  if (id === "companion") {
    try {
      const buf = await readFile(path.join(process.cwd(), "photos", "companion.png"));
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff"
        }
      });
    } catch {
      return NextResponse.json({ ok: false, message: "Chưa có ảnh companion." }, { status: 404 });
    }
  }

  const item = anniversary.gallery.find((p) => p.id === id);
  if (!item) return NextResponse.json({ ok: false }, { status: 404 });

  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    try {
      const buf = await readFile(path.join(process.cwd(), "photos", `${id}.${ext}`));
      return new NextResponse(buf, {
        headers: {
          "Content-Type": MIME[ext],
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff"
        }
      });
    } catch {
      /* thử đuôi tiếp theo */
    }
  }

  return NextResponse.json({ ok: false, message: "Chưa có ảnh thật cho mã này." }, { status: 404 });
}