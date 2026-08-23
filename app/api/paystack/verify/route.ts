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

    if (!reference || !requestId) {
      return NextResponse.json(
        { error: "Missing reference or requestId." },
        { status: 400 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing PAYSTACK_SECRET_KEY." },
        { status: 500 }
      );
    }

    // Fetch the expected fee from the database — never trust client-provided amount
    const { data: fabricRequest, error: requestFetchError } = await supabase
      .from("fabric_requests")
      .select("contact_access_fee, payment_status")
      .eq("id", requestId)
      .single();

    if (requestFetchError || !fabricRequest) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (fabricRequest.payment_status === "paid") {
      return NextResponse.json({ error: "This request has already been paid for." }, { status: 409 });
    }

    // contact_access_fee is stored in Naira; Paystack amounts are in kobo
    const feeNaira = Number(fabricRequest.contact_access_fee || 0);
    if (!feeNaira) {
      return NextResponse.json({ error: "No access fee configured for this request." }, { status: 400 });
    }
    const expectedAmount = feeNaira * 100; // convert to kobo

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
        contact_request_status: "approved",
      })
      .eq("id", requestId);

    if (requestUpdateError) {
      console.error("Request update error:", requestUpdateError);
      return NextResponse.json(
        { error: "Failed to update request payment state." },
        { status: 500 }
      );
    }

    // Release supplier contacts immediately on payment
    await supabase
      .from("quotes")
      .update({ is_contact_released: true })
      .eq("request_id", requestId);

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weinlyhq.com";
      await fetch(`${siteUrl}/api/email/notify-contact-approved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
    } catch (e) {
      console.error("Payment confirmation email failed:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified. Supplier contacts are now unlocked.",
    });
  } catch (error) {
    console.error("Verify route error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}