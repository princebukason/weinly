import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, phone, plan } = body;

    if (!email || !plan) {
      return NextResponse.json({ error: "Missing email or plan." }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY." }, { status: 500 });
    }

    const amounts: Record<string, number> = {
      pro_monthly: 2500000,  // ₦25,000 in kobo
      pro_yearly: 20000000,  // ₦200,000 in kobo
    };

    const amount = amounts[plan];
    if (!amount) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
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
        reference: `weinly_pro_${Date.now()}`,
        metadata: {
          buyer_name: name || "",
          buyer_phone: phone || "",
          plan,
          source: "weinly_pro_subscription",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status || !data?.data?.access_code) {
      return NextResponse.json(
        { error: data?.message || "Failed to initialize subscription payment." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      access_code: data.data.access_code,
      reference: data.data.reference,
      authorization_url: data.data.authorization_url,
    });
  } catch (error: any) {
    console.error("Subscribe route error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}