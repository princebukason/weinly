import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase config." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const body = await req.json();
    const { reference, email, userId } = body;

    if (!reference || !email || !userId) {
      return NextResponse.json({ error: "Missing reference, email or userId." }, { status: 400 });
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
        headers: { "Content-Type": "application/json" },
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