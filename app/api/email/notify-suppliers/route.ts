import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { newRequestSupplierEmail } from "@/lib/emails/templates";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY." }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase configuration." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const body = await req.json();
    const { requestId, fabricDescription, aiSpec } = body;

    if (!requestId || !fabricDescription) {
      return NextResponse.json({ error: "Missing requestId or fabricDescription." }, { status: 400 });
    }

    const { data: suppliers, error: suppliersError } = await supabase
      .from("supplier_profiles")
      .select("company_name, email")
      .eq("is_active", true)
      .not("email", "is", null);

    if (suppliersError) throw suppliersError;

    if (!suppliers || suppliers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No active suppliers to notify." });
    }

    const results = await Promise.allSettled(
      suppliers.map(async (supplier) => {
        const template = newRequestSupplierEmail(
          supplier.company_name,
          requestId,
          fabricDescription,
          aiSpec || ""
        );

        return resend.emails.send({
          from: "Weinly <hello@weinlyhq.com>",
          to: supplier.email,
          subject: template.subject,
          html: template.html,
          headers: {
            "List-Unsubscribe": "<mailto:hello@weinlyhq.com?subject=Unsubscribe>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ success: true, sent, failed });
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json({ error: error.message || "Failed to send emails." }, { status: 500 });
  }
}