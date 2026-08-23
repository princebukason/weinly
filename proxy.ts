import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Admin route — no session cookie means show the login form (page handles auth)
  // Only redirect if session cookie is present but invalid
  if (path.startsWith("/admin")) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionToken = request.cookies.get("weinly_admin_session")?.value;

    // No session cookie → let the page load (shows login form)
    if (!sessionToken) {
      return NextResponse.next({ request });
    }

    // No ADMIN_PASSWORD configured → let the page load
    if (!adminPassword) {
      return NextResponse.next({ request });
    }

    // Validate the session cookie
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(adminPassword), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode("weinly-admin-v1"));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const valid =
      sessionToken.length === expected.length &&
      (() => {
        let diff = 0;
        for (let i = 0; i < sessionToken.length; i++) diff |= sessionToken.charCodeAt(i) ^ expected.charCodeAt(i);
        return diff === 0;
      })();

    if (!valid) {
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

  if (!user && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (!user && path.startsWith("/supplier/dashboard")) {
    return NextResponse.redirect(new URL("/supplier/auth", request.url));
  }

  if (user && path === "/auth") {
    const role = user.user_metadata?.role;
    if (role === "supplier") {
      return NextResponse.redirect(new URL("/supplier/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && path === "/supplier/auth") {
    const role = user.user_metadata?.role;
    if (role === "supplier") {
      return NextResponse.redirect(new URL("/supplier/dashboard", request.url));
    }
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
