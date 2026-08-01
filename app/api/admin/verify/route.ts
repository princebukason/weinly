import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export function makeAdminSessionToken(adminPassword: string): string {
  return createHmac("sha256", adminPassword).update("weinly-admin-v1").digest("hex");
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      const waitSec = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${waitSec}s.` },
        { status: 429 }
      );
    }
    entry.count += 1;
  } else {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }

  // Timing-safe comparison to prevent timing attacks
  const a = Buffer.from(password ?? "");
  const b = Buffer.from(adminPassword);
  const equal = a.length === b.length && timingSafeEqual(a, b);

  if (!equal) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  attempts.delete(ip);

  const sessionToken = makeAdminSessionToken(adminPassword);
  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ success: true });
  res.cookies.set("weinly_admin_session", sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
