import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, requestId, name, phone } = body as {
      email?: string;
      requestId?: string;
      name?: string;
      phone?: string;
    };

    if (!email || !requestId) {
      return NextResponse.json(
        { error: "Missing email or requestId." },
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

    // Fetch the fee from the database — never trust client-provided amount
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: request, error: fetchError } = await supabase
      .from("fabric_requests")
      .select("contact_access_fee, payment_status, client_email")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (request.client_email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Email does not match this request." }, { status: 403 });
    }

    if (request.payment_status === "paid") {
      return NextResponse.json({ error: "This request has already been paid for." }, { status: 409 });
    }

    const feeNaira = Number(request.contact_access_fee || 0);
    if (!feeNaira) {
      return NextResponse.json({ error: "No access fee set for this request." }, { status: 400 });
    }

    const amountKobo = Math.round(feeNaira * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "NGN",
        channels: ["card"],
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
