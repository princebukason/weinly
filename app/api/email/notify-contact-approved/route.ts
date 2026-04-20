import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactApprovedEmail } from "@/lib/emails/templates";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY." }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    const { buyerEmail, buyerName, requestId } = body;

    if (!buyerEmail || !requestId) {
      return NextResponse.json({ error: "Missing buyerEmail or requestId." }, { status: 400 });
    }

    const template = contactApprovedEmail(buyerName || "", requestId);

    const { error } = await resend.emails.send({
      from: "Weinly <hello@weinlyhq.com>",
      to: buyerEmail,
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