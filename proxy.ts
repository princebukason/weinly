import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function verifyAdminSession(token: string, adminPassword: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(adminPassword), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode("weinly-admin-v1"));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Admin route — gate with HTTP-only signed session cookie
  if (path.startsWith("/admin")) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionToken = request.cookies.get("weinly_admin_session")?.value;
    if (!adminPassword || !sessionToken || !(await verifyAdminSession(sessionToken, adminPassword))) {
      const res = NextResponse.redirect(new URL("/", request.url));
      res.cookies.set("weinly_admin_session", "", { maxAge: 0, path: "/" });
      return res;
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in — protect buyer dashboard
  if (!user && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Not logged in — protect supplier dashboard only
  if (!user && path === "/supplier/dashboard") {
    return NextResponse.redirect(new URL("/supplier/auth", request.url));
  }

  // Logged in — redirect away from buyer auth page
  if (user && path === "/auth") {
    const role = user.user_metadata?.role;
    // Only redirect suppliers to supplier dashboard
    // Everyone else (buyer or no role) goes to buyer dashboard
    if (role === "supplier") {
      return NextResponse.redirect(new URL("/supplier/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Logged in — redirect away from supplier auth page
  if (user && path === "/supplier/auth") {
    const role = user.user_metadata?.role;
    if (role === "supplier") {
      return NextResponse.redirect(new URL("/supplier/dashboard", request.url));
    }
    // Buyers who accidentally land on supplier auth go to buyer dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/dashboard/:path*",
    "/supplier/dashboard/:path*",
    "/auth",
    "/supplier/auth",
  ],
};