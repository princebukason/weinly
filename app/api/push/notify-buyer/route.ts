import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isAuthorized(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const adminToken = req.headers.get("X-Admin-Password");
  const secretToken = req.headers.get("x-internal-secret");
  return (!!adminPassword && adminToken === adminPassword) ||
         (!!internalSecret && secretToken === internalSecret);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase config." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const body = await req.json();
    const { requestId, title, message } = body as {
      requestId?: string;
      title?: string;
      message?: string;
    };

    if (!requestId || !title || !message) {
      return NextResponse.json({ error: "Missing requestId, title, or message." }, { status: 400 });
    }

    const { data: request } = await supabase
      .from("fabric_requests")
      .select("push_token")
      .eq("id", requestId)
      .single();

    if (!request?.push_token) {
      return NextResponse.json({ success: true, message: "No push token for this request." });
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: request.push_token,
        sound: "default",
        title,
        body: message,
        data: { requestId },
      }),
    });

    const result = await response.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Push notification error:", error);
    return NextResponse.json({ error: error.message || "Failed to send push." }, { status: 500 });
  }
}
