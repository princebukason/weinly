export function quotesReadyEmail(buyerName: string, requestId: string, quoteCount: number) {
  return {
    subject: `Your Weinly quotes are ready`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:16px;">W</div>
        <span style="color:#f1f5f9;font-weight:900;font-size:22px;letter-spacing:-0.02em;">Weinly</span>
      </div>
    </div>

    <div style="background:#111827;border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:32px;margin-bottom:16px;">
      <div style="display:inline-block;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);border-radius:999px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Quotes ready</span>
      </div>

      <h1 style="margin:0 0 12px;color:#f1f5f9;font-size:24px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">
        Your fabric quotes are ready
      </h1>

      <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
        Hi ${buyerName || "there"}, <strong style="color:#f1f5f9;">${quoteCount} verified supplier${quoteCount === 1 ? " has" : "s have"}</strong> responded to your fabric sourcing request with quotes including price, MOQ and lead time.
      </p>

      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;padding:16px;margin-bottom:24px;">
        <div style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Request ID</div>
        <div style="color:#a5b4fc;font-size:13px;font-weight:600;word-break:break-all;">${requestId}</div>
      </div>

      <a href="https://weinlyhq.com/?requestId=${requestId}" style="display:block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;text-decoration:none;border-radius:12px;padding:14px 24px;font-weight:700;font-size:15px;text-align:center;margin-bottom:16px;">
        View your quotes
      </a>

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;text-align:center;">
        Review supplier quotes first. Only pay when you are ready to unlock direct supplier contact.
      </p>
    </div>

    <div style="background:#111827;border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:24px;margin-bottom:16px;">
      <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:16px;font-weight:700;">What happens next</h2>
      ${[
        "Review supplier quotes — see price, MOQ and lead time",
        "Choose a supplier you want to work with",
        "Pay to unlock their direct contact details",
        "Contact the supplier directly and negotiate your deal",
      ].map((step, i) => `
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
        <div style="width:24px;height:24px;border-radius:50%;background:rgba(99,102,241,0.15);color:#818cf8;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i + 1}</div>
        <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">${step}</p>
      </div>`).join("")}
    </div>

    <div style="text-align:center;padding:16px;">
      <p style="margin:0 0 8px;color:#475569;font-size:12px;">Need help? Chat with us on WhatsApp</p>
      <a href="https://wa.me/2348130630046?text=Hello%20Weinly%2C%20I%20need%20help%20with%20request%20ID%3A%20${requestId}" style="color:#34d399;font-size:12px;font-weight:600;text-decoration:none;">WhatsApp Support</a>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;color:#334155;font-size:11px;line-height:1.6;">
          You received this email because you have an account on Weinly.<br/>
          <a href="https://weinlyhq.com" style="color:#6366f1;text-decoration:none;">Weinly</a> ·
          <a href="mailto:hello@weinlyhq.com?subject=Unsubscribe" style="color:#475569;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    </div>

  </div>
</body>
</html>
    `,
  };
}

export function contactApprovedEmail(buyerName: string, requestId: string) {
  return {
    subject: `Your supplier contact details are ready on Weinly`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:16px;">W</div>
        <span style="color:#f1f5f9;font-weight:900;font-size:22px;letter-spacing:-0.02em;">Weinly</span>
      </div>
    </div>

    <div style="background:#111827;border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:32px;margin-bottom:16px;">
      <div style="display:inline-block;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);border-radius:999px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Contact approved</span>
      </div>

      <h1 style="margin:0 0 12px;color:#f1f5f9;font-size:24px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">
        Your supplier contact is ready
      </h1>

      <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
        Hi ${buyerName || "there"}, your payment has been verified and your supplier contact access has been <strong style="color:#34d399;">approved</strong>. You can now view the direct supplier contact details including phone number, WeChat ID and email.
      </p>

      <div style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.2);border-radius:14px;padding:16px;margin-bottom:24px;">
        <div style="color:#6ee7b7;font-size:13px;line-height:1.6;">
          Log in to your Weinly account to view the supplier phone, WeChat and email — now visible on your request tracker.
        </div>
      </div>

      <a href="https://weinlyhq.com/?requestId=${requestId}" style="display:block;background:linear-gradient(135deg,#059669,#34d399);color:white;text-decoration:none;border-radius:12px;padding:14px 24px;font-weight:700;font-size:15px;text-align:center;margin-bottom:16px;">
        View supplier contact
      </a>

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;text-align:center;">
        Contact your supplier directly and start negotiating the best deal for your fabric order.
      </p>
    </div>

    <div style="text-align:center;padding:16px;">
      <p style="margin:0 0 8px;color:#475569;font-size:12px;">Need help? Chat with us on WhatsApp</p>
      <a href="https://wa.me/2348130630046?text=Hello%20Weinly%2C%20I%20need%20help%20with%20request%20ID%3A%20${requestId}" style="color:#34d399;font-size:12px;font-weight:600;text-decoration:none;">WhatsApp Support</a>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;color:#334155;font-size:11px;line-height:1.6;">
          You received this email because you have an account on Weinly.<br/>
          <a href="https://weinlyhq.com" style="color:#6366f1;text-decoration:none;">Weinly</a> ·
          <a href="mailto:hello@weinlyhq.com?subject=Unsubscribe" style="color:#475569;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    </div>

  </div>
</body>
</html>
    `,
  };
}

export function newRequestSupplierEmail(
  supplierName: string,
  requestId: string,
  fabricDescription: string,
  aiSpec: string
) {
  return {
    subject: `New sourcing request on Weinly`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:16px;">W</div>
        <span style="color:#f1f5f9;font-weight:900;font-size:22px;letter-spacing:-0.02em;">Weinly</span>
      </div>
    </div>

    <div style="background:#111827;border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:32px;margin-bottom:16px;">
      <div style="display:inline-block;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:999px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#fbbf24;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">New buyer request</span>
      </div>

      <h1 style="margin:0 0 12px;color:#f1f5f9;font-size:24px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">
        A buyer needs your quote
      </h1>

      <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
        Hi ${supplierName}, a new fabric sourcing request has been submitted on Weinly. Log in to your supplier dashboard to review the details and submit your quote.
      </p>

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;margin-bottom:16px;">
        <div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Buyer request</div>
        <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.7;">${fabricDescription.slice(0, 300)}${fabricDescription.length > 300 ? "..." : ""}</p>
      </div>

      ${aiSpec ? `
      <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:14px;padding:16px;margin-bottom:24px;">
        <div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">AI sourcing spec</div>
        <p style="margin:0;color:#a5b4fc;font-size:13px;line-height:1.7;white-space:pre-wrap;">${aiSpec.slice(0, 400)}${aiSpec.length > 400 ? "..." : ""}</p>
      </div>
      ` : ""}

      <a href="https://weinlyhq.com/supplier/dashboard" style="display:block;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;text-decoration:none;border-radius:12px;padding:14px 24px;font-weight:700;font-size:15px;text-align:center;margin-bottom:16px;">
        Submit your quote
      </a>

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;text-align:center;">
        Log in to your supplier dashboard to see the full request and submit a competitive quote.
      </p>
    </div>

    <div style="text-align:center;padding:16px;">
      <p style="margin:0 0 8px;color:#475569;font-size:12px;">Questions? Contact Weinly support</p>
      <a href="https://wa.me/2348130630046" style="color:#fbbf24;font-size:12px;font-weight:600;text-decoration:none;">WhatsApp Support</a>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;color:#334155;font-size:11px;line-height:1.6;">
          You received this email because you are a verified supplier on Weinly.<br/>
          <a href="https://weinlyhq.com" style="color:#f59e0b;text-decoration:none;">Weinly</a> ·
          <a href="mailto:hello@weinlyhq.com?subject=Unsubscribe" style="color:#475569;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    </div>

  </div>
</body>
</html>
    `,
  };
}