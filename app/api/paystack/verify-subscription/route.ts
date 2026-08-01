import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase config." }, { status: 500 });
  }

  // Validate the caller's session — userId must come from the server, never the client
  const cookieStore = req.cookies;
  const authClient = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user }, error: sessionError } = await authClient.auth.getUser();
  if (sessionError || !user) {
    return NextResponse.json({ error: "Unauthorised. Please log in and try again." }, { status: 401 });
  }
  const userId = user.id;

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const body = await req.json();
    const { reference, email } = body;

    if (!reference || !email) {
      return NextResponse.json({ error: "Missing reference or email." }, { status: 400 });
    }

    // Replay protection — reject if this reference has already been used
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (existingSub) {
      return NextResponse.json({ error: "This payment reference has already been used." }, { status: 409 });
    }

    // Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData?.status || !paystackData?.data) {
      return NextResponse.json({ error: "Unable to verify payment." }, { status: 400 });
    }

    const payment = paystackData.data;

    if (payment.status !== "success") {
      return NextResponse.json({ error: "Payment was not successful." }, { status: 400 });
    }

    const plan = payment.metadata?.plan || "pro_monthly";
    const now = new Date();
    const expiresAt = new Date(now);

    if (plan === "pro_yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Save subscription
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert([{
        user_id: userId,
        email,
        plan,
        status: "active",
        payment_method: "paystack",
        payment_reference: reference,
        amount: payment.amount,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }], { onConflict: "user_id" });

    if (subError) {
      console.error("Subscription save error:", subError);
      return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
    }

    // Send confirmation email
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weinlyhq.com";
      await fetch(`${siteUrl}/api/email/notify-pro-welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_API_SECRET || "" },
        body: JSON.stringify({ email, plan }),
      });
    } catch (e) {
      console.error("Pro welcome email failed:", e);
    }

    return NextResponse.json({
      success: true,
      plan,
      expires_at: expiresAt.toISOString(),
      message: "Weinly Pro activated successfully.",
    });
  } catch (error: any) {
    console.error("Verify subscription error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}