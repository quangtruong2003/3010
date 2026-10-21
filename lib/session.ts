import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "bo_unlocked";
const SESSION_SECRET = process.env.SESSION_SECRET || "guboi-3010-bo";
const SITE_PASSWORD = process.env.SITE_PASSWORD || "3010";
const MAX_AGE = 60 * 60 * 24 * 30;

const sign = (value: string) => createHmac("sha256", SESSION_SECRET).update(value).digest("hex");

export const sessionCookieName = COOKIE;

export function checkPassword(input: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(SITE_PASSWORD);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function sessionToken() {
  return `ok.${sign("ok")}`;
}

export function verifySession(token: string | undefined) {
  if (!token) return false;
  const [value, sig] = token.split(".");
  if (value !== "ok" || !sig) return false;
  const expected = sign(value);
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE
};
