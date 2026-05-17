import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { supplierApprovedEmail } from "@/lib/emails/templates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const token = req.headers.get("X-Admin-Password");
  if (!adminPassword || token !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { applicationId, action } = await req.json();
    if (!applicationId || !action) {
      return NextResponse.json({ error: "Missing applicationId or action." }, { status: 400 });
    }

    if (action === "reject") {
      await supabase.from("supplier_applications").update({ status: "rejected" }).eq("id", applicationId);
      return NextResponse.json({ success: true });
    }

    if (action !== "approve") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    // Fetch the application
    const { data: app, error: appError } = await supabase
      .from("supplier_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // Generate unique invite code
    const code = `WEINLY-SUP-${Date.now().toString(36).toUpperCase()}`;

    // Save invite code
    const { error: inviteError } = await supabase.from("supplier_invites").insert([{
      code,
      email: app.email,
      used: false,
    }]);
    if (inviteError) throw inviteError;

    // Mark application as approved
    await supabase.from("supplier_applications").update({ status: "approved" }).eq("id", applicationId);

    // Send email with invite code
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const template = supplierApprovedEmail(app.contact_name, code, app.company_name);
      await resend.emails.send({
        from: "Weinly <hello@weinlyhq.com>",
        to: app.email,
        subject: template.subject,
        html: template.html,
      });
    }

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error("Supplier approve error:", error);
    return NextResponse.json({ error: error.message || "Failed to process application." }, { status: 500 });
  }
}
