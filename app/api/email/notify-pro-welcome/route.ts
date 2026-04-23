import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY." }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    const { email, plan } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email." }, { status: 400 });
    }

    const planLabel = plan === "pro_yearly" ? "Pro Yearly" : "Pro Monthly";
    const planBenefit = plan === "pro_yearly" ? "12 months" : "1 month";

    const { error } = await resend.emails.send({
      from: "Weinly <hello@weinlyhq.com>",
      to: email,
      subject: "Welcome to Weinly Pro ✨",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:16px;">W</div>
        <span style="color:#f1f5f9;font-weight:900;font-size:22px;">Weinly</span>
      </div>
    </div>

    <div style="background:#111827;border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:32px;margin-bottom:16px;">
      <div style="display:inline-block;background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2));border:1px solid rgba(99,102,241,0.3);border-radius:999px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#a5b4fc;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">✨ Weinly Pro Active</span>
      </div>

      <h1 style="margin:0 0 12px;color:#f1f5f9;font-size:24px;font-weight:900;line-height:1.2;">
        Welcome to Weinly Pro!
      </h1>

      <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
        Your <strong style="color:#f1f5f9;">${planLabel}</strong> subscription is now active for ${planBenefit}. You now have access to all Pro features.
      </p>

      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;padding:16px;margin-bottom:24px;">
        <div style="color:#f1f5f9;font-size:14px;font-weight:700;margin-bottom:12px;">What you get with Pro:</div>
        ${[
          "3 supplier contact unlocks per month included",
          "Priority matching to verified suppliers",
          "Dedicated WhatsApp support",
          "Reorder button on past requests",
          "Price intelligence on all quotes",
          "Pro badge on your profile",
        ].map(benefit => `
        <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;">
          <span style="color:#34d399;font-weight:700;flex-shrink:0;">✓</span>
          <span style="color:#94a3b8;font-size:14px;">${benefit}</span>
        </div>`).join("")}
      </div>

      <a href="https://weinlyhq.com/dashboard" style="display:block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;text-decoration:none;border-radius:12px;padding:14px 24px;font-weight:700;font-size:15px;text-align:center;">
        Go to your dashboard →
      </a>
    </div>

    <div style="text-align:center;padding:16px;">
      <p style="margin:0 0 8px;color:#475569;font-size:12px;">Need help? Chat with us on WhatsApp</p>
      <a href="https://wa.me/2348130630046" style="color:#34d399;font-size:12px;font-weight:600;text-decoration:none;">WhatsApp Support</a>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;color:#334155;font-size:11px;line-height:1.6;">
          © 2025 Weinly · Built for fabric buyers sourcing from China<br/>
          <a href="mailto:hello@weinlyhq.com?subject=Unsubscribe" style="color:#475569;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    </div>

  </div>
</body>
</html>
      `,
      headers: {
        "List-Unsubscribe": "<mailto:hello@weinlyhq.com?subject=Unsubscribe>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Pro welcome email error:", error);
    return NextResponse.json({ error: error.message || "Failed to send email." }, { status: 500 });
  }
}