import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { requestId, email } = await req.json();
  if (!requestId || !email) {
    return NextResponse.json({ error: "Missing requestId or email." }, { status: 400 });
  }

  // Verify the email matches the request
  const { data: request } = await supabase
    .from("fabric_requests")
    .select("client_email, is_contact_released")
    .eq("id", requestId)
    .single();

  if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (request.client_email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match this request." }, { status: 403 });
  }
  if (request.is_contact_released) {
    return NextResponse.json({ ok: true, message: "Already released." });
  }

  // Verify active Pro subscription for this email
  const now = new Date().toISOString();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, expires_at")
    .eq("email", email.toLowerCase())
    .eq("status", "active")
    .gt("expires_at", now)
    .maybeSingle();

  if (!sub) {
    return NextResponse.json({ error: "No active Pro subscription found for this email." }, { status: 403 });
  }

  // Release the contact
  const { error } = await supabase
    .from("fabric_requests")
    .update({
      contact_request_status: "approved",
      payment_status: "paid",
      contact_access_fee: 0,
      is_contact_released: true,
      buyer_requested_contact: true,
    })
    .eq("id", requestId);

  if (error) return NextResponse.json({ error: "Failed to release contact." }, { status: 500 });

  await supabase.from("quotes").update({ is_contact_released: true }).eq("request_id", requestId);

  return NextResponse.json({ ok: true });
}
