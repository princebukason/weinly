import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { newRequestSupplierEmail } from "@/lib/emails/templates";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, fabricDescription, aiSpec } = body;

    if (!requestId || !fabricDescription) {
      return NextResponse.json({ error: "Missing requestId or fabricDescription." }, { status: 400 });
    }

    // Get all active suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from("supplier_profiles")
      .select("company_name, email")
      .eq("is_active", true)
      .not("email", "is", null);

    if (suppliersError) throw suppliersError;

    if (!suppliers || suppliers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No active suppliers to notify." });
    }

    // Send to all active suppliers
    const results = await Promise.allSettled(
      suppliers.map(async (supplier) => {
        const template = newRequestSupplierEmail(
          supplier.company_name,
          requestId,
          fabricDescription,
          aiSpec || ""
        );

        return resend.emails.send({
          from: "Weinly <onboarding@resend.dev>",
          to: supplier.email,
          subject: template.subject,
          html: template.html,
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