import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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
  const path = request.nextUrl.pathname;

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
    "/dashboard/:path*",
    "/supplier/dashboard/:path*",
    "/auth",
    "/supplier/auth",
  ],
};