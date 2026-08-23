import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { quotesReadyEmail } from "@/lib/emails/templates";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionToken = req.cookies.get("weinly_admin_session")?.value;
  if (!adminPassword || !sessionToken) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(adminPassword), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode("weinly-admin-v1"));
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (sessionToken.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sessionToken.length; i++) diff |= sessionToken.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, quoteCount } = await req.json();
  if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: request } = await supabase
    .from("fabric_requests")
    .select("client_email, client_name")
    .eq("id", requestId)
    .single();

  if (!request?.client_email) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const template = quotesReadyEmail(request.client_name || "", requestId, quoteCount || 1);

  const { error } = await resend.emails.send({
    from: "Weinly <hello@weinlyhq.com>",
    to: request.client_email,
    subject: template.subject,
    html: template.html,
  });

  if (error) return NextResponse.json({ error: "Email failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
