import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: NextRequest) {
  const sessionToken = req.cookies.get("weinly_admin_session")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!sessionToken || !adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify session
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(adminPassword), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode("weinly-admin-v1"));
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  let diff = 0;
  if (sessionToken.length !== expected.length) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  for (let i = 0; i < sessionToken.length; i++) diff |= sessionToken.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("quotes").delete().eq("request_id", requestId);
  const { error } = await supabase.from("fabric_requests").delete().eq("id", requestId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
