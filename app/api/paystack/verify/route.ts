import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference, requestId, expectedAmount } = body as {
      reference?: string;
      requestId?: string;
      expectedAmount?: number;
    };

    if (!reference || !requestId || !expectedAmount) {
      return NextResponse.json(
        { error: "Missing reference, requestId, or expectedAmount." },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Missing PAYSTACK_SECRET_KEY." },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData?.status || !verifyData?.data) {
      return NextResponse.json(
        { error: verifyData?.message || "Failed to verify transaction." },
        { status: 400 }
      );
    }

    const transaction = verifyData.data;
    const statusOk = transaction.status === "success";
    const amountOk = Number(transaction.amount) === Number(expectedAmount);

    if (!statusOk || !amountOk) {
      return NextResponse.json(
        {
          error: "Transaction not valid for fulfillment.",
          statusOk,
          amountOk,
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("fabric_requests")
      .update({
        payment_status: "paid",
        payment_reference: transaction.reference,
        paid_at: transaction.paid_at || new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json(
        { error: "Payment verified, but failed to update request." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reference: transaction.reference,
      paid_at: transaction.paid_at,
      channel: transaction.channel,
      amount: transaction.amount,
    });
  } catch (error) {
    console.error("Paystack verify error:", error);
    return NextResponse.json(
      { error: "Something went wrong while verifying payment." },
      { status: 500 }
    );
  }
}