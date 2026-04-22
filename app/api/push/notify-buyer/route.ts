import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase config." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const body = await req.json();
    const { buyerEmail, title, message, requestId } = body;

    if (!buyerEmail || !title || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Get buyer's user ID from auth
    const { data: users } = await supabase.auth.admin.listUsers();
    const buyer = users?.users?.find((u) => u.email === buyerEmail);

    if (!buyer) {
      return NextResponse.json({ success: true, message: "Buyer not found in auth." });
    }

    // Get buyer's push token
    const { data: tokenData } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", buyer.id)
      .single();

    if (!tokenData?.token) {
      return NextResponse.json({ success: true, message: "No push token for buyer." });
    }

    // Send push notification via Expo
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: tokenData.token,
        sound: "default",
        title,
        body: message,
        data: { requestId: requestId || "" },
      }),
    });

    const result = await response.json();

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Push notification error:", error);
    return NextResponse.json({ error: error.message || "Failed to send push." }, { status: 500 });
  }
}