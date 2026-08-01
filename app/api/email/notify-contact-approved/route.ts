import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { contactApprovedEmail } from "@/lib/emails/templates";

export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || req.headers.get("x-internal-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY." }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId." }, { status: 400 });
    }

    // Always send to the email stored in the DB — never trust the caller
    const { data: request } = await supabase
      .from("fabric_requests")
      .select("client_email, client_name")
      .eq("id", requestId)
      .single();

    if (!request?.client_email) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const template = contactApprovedEmail(request.client_name || "", requestId);

    const { error } = await resend.emails.send({
      from: "Weinly <hello@weinlyhq.com>",
      to: request.client_email,
      subject: template.subject,
      html: template.html,
      headers: {
        "List-Unsubscribe": "<mailto:hello@weinlyhq.com?subject=Unsubscribe>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json({ error: error.message || "Failed to send email." }, { status: 500 });
  }
}
