import { NextRequest, NextResponse } from "next/server";
import { checkPassword, cookieOptions, sessionCookieName, sessionToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false, message: "Mật khẩu chưa đúng, bé Bo thử lại nhé." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName, sessionToken(), cookieOptions);
  return res;
}
