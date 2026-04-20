import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase configuration." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const requestId = String(body.requestId || "").trim();
    const expectedAmount = Number(body.expectedAmount || 0);

    if (!reference || !requestId || !expectedAmount) {
      return NextResponse.json(
        { error: "Missing reference, requestId, or expectedAmount." },
        { status: 400 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing PAYSTACK_SECRET_KEY." },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { error: "Unable to verify payment with Paystack." },
        { status: 400 }
      );
    }

    const payment = paystackData.data;
    const paidAmount = Number(payment.amount || 0);
    const paidStatus = payment.status;

    if (paidStatus !== "success") {
      return NextResponse.json(
        { error: "Payment is not successful." },
        { status: 400 }
      );
    }

    if (paidAmount !== expectedAmount) {
      return NextResponse.json(
        { error: "Payment amount does not match expected amount." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    const { error: requestUpdateError } = await supabase
      .from("fabric_requests")
      .update({
        payment_status: "paid",
        payment_reference: reference,
        paid_at: nowIso,
        contact_request_status: "pending",
      })
      .eq("id", requestId);

    if (requestUpdateError) {
      console.error("Request update error:", requestUpdateError);
      return NextResponse.json(
        { error: "Failed to update request payment state." },
        { status: 500 }
      );
    }

    // FIX 1 & 2 — email is now INSIDE try block, AFTER successful update
    // requestId is in scope here and only runs on success
    try {
      const { data: request } = await supabase
        .from("fabric_requests")
        .select("client_email, client_name")
        .eq("id", requestId)
        .single();

      if (request?.client_email) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weinlyhq.com";
        await fetch(`${siteUrl}/api/email/notify-contact-approved`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyerEmail: request.client_email,
            buyerName: request.client_name,
            requestId,
          }),
        });
      }
    } catch (e) {
      // Email failure should not block payment success response
      console.error("Payment confirmation email failed:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified. Supplier contact release is pending admin approval.",
    });
  } catch (error) {
    console.error("Verify route error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}