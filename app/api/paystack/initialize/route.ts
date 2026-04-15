import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amount, requestId, name, phone } = body as {
      email?: string;
      amount?: number;
      requestId?: string;
      name?: string;
      phone?: string;
    };

    if (!email || !amount || !requestId) {
      return NextResponse.json(
        { error: "Missing email, amount, or requestId." },
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

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency: "NGN",
        reference: `weinly_${requestId}_${Date.now()}`,
        metadata: {
          request_id: requestId,
          buyer_name: name || "",
          buyer_phone: phone || "",
          source: "weinly_contact_unlock",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status || !data?.data?.access_code) {
      return NextResponse.json(
        { error: data?.message || "Failed to initialize Paystack transaction." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      access_code: data.data.access_code,
      reference: data.data.reference,
      authorization_url: data.data.authorization_url,
    });
  } catch (error) {
    console.error("Paystack initialize error:", error);
    return NextResponse.json(
      { error: "Something went wrong while initializing payment." },
      { status: 500 }
    );
  }
}