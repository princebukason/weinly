import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: NextRequest) {
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

    // FIXED: contact_request_status stays "pending" — admin must approve
    // contact release manually in Supabase or via the admin dashboard we will build
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

    // FIXED: removed auto-release of supplier contacts
    // Contacts are only released when admin sets is_contact_released = true
    // This will be done via the admin dashboard (Sprint 3)

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