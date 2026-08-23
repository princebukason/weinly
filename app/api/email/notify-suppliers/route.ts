import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { newRequestSupplierEmail } from "@/lib/emails/templates";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY." }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { requestId } = await req.json();
    if (!requestId) return NextResponse.json({ error: "Missing requestId." }, { status: 400 });

    // Fetch the request to get category + description
    const { data: request } = await supabase
      .from("fabric_requests")
      .select("category, user_input, ai_output")
      .eq("id", requestId)
      .single();

    if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });

    // Fetch active suppliers with an email
    const { data: suppliers } = await supabase
      .from("supplier_profiles")
      .select("company_name, contact_name, email, categories")
      .eq("is_active", true)
      .not("email", "is", null);

    if (!suppliers || suppliers.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    // Only notify suppliers whose categories include this request's category
    const matched = suppliers.filter((s: any) => {
      const cats: string[] = Array.isArray(s.categories) ? s.categories : [];
      // If supplier has no categories set, notify them for all requests
      return cats.length === 0 || cats.includes(request.category);
    });

    if (matched.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No matching suppliers." });
    }

    const results = await Promise.allSettled(
      matched.map(async (supplier: any) => {
        const name = supplier.contact_name || supplier.company_name || "Supplier";
        const template = newRequestSupplierEmail(
          name,
          requestId,
          request.user_input || "",
          request.ai_output || ""
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
    console.error("notify-suppliers error:", error);
    return NextResponse.json({ error: error.message || "Failed to send emails." }, { status: 500 });
  }
}