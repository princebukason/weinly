import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, token } = body as { requestId?: string; token?: string };

    if (!requestId || !token) {
      return NextResponse.json({ error: "Missing requestId or token." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
