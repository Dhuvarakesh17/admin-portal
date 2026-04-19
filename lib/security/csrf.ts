import { randomBytes, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { CSRF_COOKIE } from "@/lib/constants";

export function generateCsrfToken() {
  return randomBytes(24).toString("hex");
}

export async function requireValidOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    const allowed = (process.env.ADMIN_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const originHost = new URL(origin).host;
    return originHost === host || allowed.includes(origin);
  } catch {
    return false;
  }
}

export async function assertCsrfToken(request: Request) {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  const isValidOrigin = await requireValidOrigin();
  if (!isValidOrigin) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    return false;
  }

  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}
