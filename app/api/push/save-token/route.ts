import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, token, clientEmail } = body as {
      requestId?: string;
      token?: string;
      clientEmail?: string;
    };

    if (!requestId || !token || !clientEmail) {
      return NextResponse.json({ error: "Missing requestId, token or clientEmail." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership — the caller must know the email address on the request
    const { data: row, error: lookupError } = await supabase
      .from("fabric_requests")
      .select("id, client_email")
      .eq("id", requestId)
      .maybeSingle();

    if (lookupError || !row) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (row.client_email?.toLowerCase() !== clientEmail.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
    }

    const { error } = await supabase
      .from("fabric_requests")
      .update({ push_token: token })
      .eq("id", requestId);

    if (error) {
      return NextResponse.json({ error: "Failed to save token." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
