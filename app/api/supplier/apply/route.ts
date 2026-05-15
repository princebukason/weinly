import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, contact_name, email, phone, wechat, region, categories, years_in_business, website } = body;

    if (!company_name || !contact_name || !email || !phone || !region) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Check for duplicate application
    const { data: existing } = await supabase
      .from("supplier_applications")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .in("status", ["pending", "approved"])
      .single();

    if (existing) {
      return NextResponse.json({ error: "An application with this email already exists." }, { status: 409 });
    }

    const { error } = await supabase.from("supplier_applications").insert([{
      company_name,
      contact_name,
      email: email.trim().toLowerCase(),
      phone,
      wechat: wechat || null,
      region,
      categories: categories || [],
      years_in_business: years_in_business || null,
      website: website || null,
      status: "pending",
    }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Supplier apply error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit application." }, { status: 500 });
  }
}
