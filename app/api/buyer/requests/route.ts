import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("fabric_requests")
    .select("id, created_at, status, category, contact_request_status, payment_status, user_input")
    .eq("client_email", email.toLowerCase().trim())
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: "Failed to fetch requests." }, { status: 500 });

  return NextResponse.json({ requests: data || [] });
}
