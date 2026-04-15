import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type PaystackWebhookData = {
  event?: string;
  data?: {
    reference?: string;
    amount?: number;
    metadata?: {
      requestId?: string;
      [key: string]: unknown;
    };
    customer?: {
      email?: string;
    };
    status?: string;
    paid_at?: string;
    [key: string]: unknown;
  };
};

function timingSafeEqualHex(a: string, b: string) {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");

  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing PAYSTACK_SECRET_KEY" },
        { status: 500 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Missing Supabase server environment variables" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    const computedSignature = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (!signature || !timingSafeEqualHex(signature, computedSignature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PaystackWebhookData;

    if (payload.event !== "charge.success") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const payment = payload.data;
    const reference = String(payment?.reference || "").trim();
    const amount = Number(payment?.amount || 0);
    const requestId = String(payment?.metadata?.requestId || "").trim();
    const paidAt = payment?.paid_at
      ? new Date(payment.paid_at).toISOString()
      : new Date().toISOString();

    if (!reference || !amount || !requestId) {
      return NextResponse.json(
        { error: "Missing reference, amount, or requestId in webhook payload" },
        { status: 400 }
      );
    }

    const { data: existingRequest, error: fetchError } = await supabase
      .from("fabric_requests")
      .select("id, payment_status, contact_access_fee")
      .eq("id", requestId)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const expectedAmount = Math.round(
      Number(String(existingRequest.contact_access_fee || "3000").replace(/[^\d.]/g, "")) * 100
    );

    if (amount !== expectedAmount) {
      return NextResponse.json(
        { error: "Webhook amount does not match expected amount" },
        { status: 400 }
      );
    }

    if (existingRequest.payment_status === "paid") {
      return NextResponse.json({ received: true, already_paid: true }, { status: 200 });
    }

    const { error: requestUpdateError } = await supabase
      .from("fabric_requests")
      .update({
        payment_status: "paid",
        payment_reference: reference,
        paid_at: paidAt,
        contact_request_status: "approved",
      })
      .eq("id", requestId);

    if (requestUpdateError) {
      return NextResponse.json(
        { error: "Failed to update request" },
        { status: 500 }
      );
    }

    const { error: quoteUpdateError } = await supabase
      .from("quotes")
      .update({
        is_contact_released: true,
      })
      .eq("request_id", requestId);

    if (quoteUpdateError) {
      return NextResponse.json(
        { error: "Failed to release supplier contacts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true, released: true }, { status: 200 });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}