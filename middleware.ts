import { NextRequest, NextResponse } from "next/server";

async function verifyAdminSession(token: string, adminPassword: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(adminPassword),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode("weinly-admin-v1"));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time comparison
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const sessionToken = req.cookies.get("weinly_admin_session")?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/?admin_error=session", req.url));
  }

  const valid = await verifyAdminSession(sessionToken, adminPassword);
  if (!valid) {
    const res = NextResponse.redirect(new URL("/?admin_error=session", req.url));
    res.cookies.set("weinly_admin_session", "", { maxAge: 0, path: "/" });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
