import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal admin login: one password from ADMIN_PASSWORD, and a signed,
 * httpOnly cookie that expires after 12 hours.
 */

export const ADMIN_COOKIE = "gr_admin";
const MAX_AGE_S = 60 * 60 * 12;

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) throw new Error("ADMIN_SECRET is not set (see .env.example)");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected === "change-me") return false;
  // compare HMACs so the comparison is constant-time regardless of length
  return safeEqual(sign(`pw:${input}`), sign(`pw:${expected}`));
}

export function makeSessionCookie() {
  const expires = Date.now() + MAX_AGE_S * 1000;
  const value = `${expires}.${sign(`session:${expires}`)}`;
  return { name: ADMIN_COOKIE, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE_S };
}

export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const [expires, sig] = raw.split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  try {
    return safeEqual(sig, sign(`session:${expires}`));
  } catch {
    return false;
  }
}
