function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND = {
  bg: "#f5ecdc",
  green: "#24483f",
  greenLight: "#2f7d57",
  rust: "#a75635",
  rustDark: "#7b3525",
  accent: "#c9935b",
  text: "#1f2933",
  muted: "#6b7280",
  cardBg: "#ffffff",
  cardBorder: "#e7e5e4",
  site: "https://weinlyhq.com",
  wa: "https://wa.me/2348130630046",
};

function emailShell(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${BRAND.site}" style="text-decoration:none;display:inline-flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;border-radius:9px;background:${BRAND.green};display:inline-flex;align-items:center;justify-content:center;">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="3,5 7,20 13,9 19,20 23,5" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <circle cx="13" cy="9" r="2.4" fill="#c9935b"/>
          </svg>
        </div>
        <span style="color:${BRAND.text};font-weight:900;font-size:22px;letter-spacing:-0.03em;">weinly</span>
      </a>
    </div>

    ${content}

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0 8px;">
      <p style="margin:0 0 6px;color:${BRAND.muted};font-size:12px;">Need help? Chat with us on WhatsApp</p>
      <a href="${BRAND.wa}" style="color:${BRAND.greenLight};font-size:12px;font-weight:600;text-decoration:none;">WhatsApp Support</a>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid ${BRAND.cardBorder};">
        <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.7;">
          <a href="${BRAND.site}" style="color:${BRAND.rust};text-decoration:none;font-weight:600;">Weinly</a> — Fabric sourcing from China to the world.<br/>
          <a href="mailto:hello@weinlyhq.com?subject=Unsubscribe" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    </div>

  </div>
</body>
</html>`;
}

function card(content: string) {
  return `<div style="background:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:16px;padding:28px;margin-bottom:12px;">${content}</div>`;
}

function badge(text: string, color = BRAND.greenLight) {
  return `<div style="display:inline-block;background:${color}18;border:1px solid ${color}33;border-radius:999px;padding:5px 14px;margin-bottom:18px;">
    <span style="color:${color};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">${text}</span>
  </div>`;
}

function ctaButton(text: string, href: string, bg = BRAND.rust) {
  return `<a href="${href}" style="display:block;background:${bg};color:white;text-decoration:none;border-radius:10px;padding:14px 24px;font-weight:700;font-size:15px;text-align:center;margin:20px 0 12px;">${text}</a>`;
}

function infoBox(label: string, value: string, borderColor = BRAND.accent) {
  return `<div style="background:${borderColor}10;border:1px solid ${borderColor}33;border-radius:10px;padding:14px 16px;margin-bottom:14px;">
    <div style="color:${BRAND.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;">${label}</div>
    <div style="color:${BRAND.text};font-size:14px;font-weight:700;word-break:break-all;font-family:monospace;">${value}</div>
  </div>`;
}

function steps(items: string[], accentColor = BRAND.green) {
  return card(`
    <h2 style="margin:0 0 14px;color:${BRAND.text};font-size:15px;font-weight:700;">What happens next</h2>
    ${items.map((step, i) => `
    <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;">
      <div style="width:22px;height:22px;border-radius:50%;background:${accentColor}18;color:${accentColor};font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">${i + 1}</div>
      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">${step}</p>
    </div>`).join("")}
  `);
}

// ── Emails ────────────────────────────────────────────────────────────────────

export function requestSubmittedEmail(buyerName: string, requestId: string, fabricDescription: string) {
  const trackUrl = `${BRAND.site}/?requestId=${requestId}`;
  const waUrl = `${BRAND.wa}?text=${encodeURIComponent(`Hello Weinly, I need help with request ID: ${requestId}`)}`;

  return {
    subject: `Your Weinly request is confirmed — save your ID`,
    html: emailShell(`
      ${card(`
        ${badge("Request confirmed", BRAND.greenLight)}
        <h1 style="margin:0 0 10px;color:${BRAND.text};font-size:22px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">Your request is being matched</h1>
        <p style="margin:0 0 18px;color:${BRAND.muted};font-size:14px;line-height:1.7;">
          Hi ${esc(buyerName) || "there"}, your fabric sourcing request has been submitted. We are matching it to verified suppliers now. Quotes typically arrive within 24 hours.
        </p>
        ${infoBox("⚠ Save this — your Request ID", requestId, BRAND.accent)}
        <div style="background:#f9fafb;border:1px solid ${BRAND.cardBorder};border-radius:10px;padding:14px;margin-bottom:18px;">
          <div style="color:${BRAND.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Your request</div>
          <p style="margin:0;color:${BRAND.text};font-size:13px;line-height:1.7;">${esc(fabricDescription).slice(0, 250)}${fabricDescription.length > 250 ? "..." : ""}</p>
        </div>
        ${ctaButton("Track your request →", trackUrl, BRAND.green)}
        <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;text-align:center;">You will receive another email as soon as supplier quotes are ready.</p>
      `)}
      ${steps([
        "We match your request to verified Chinese suppliers",
        "Suppliers submit quotes with price, MOQ and lead time",
        "You review quotes — no payment needed yet",
        "Pay once to unlock the supplier's direct contact",
      ])}
    `),
  };
}

export function quotesReadyEmail(buyerName: string, requestId: string, quoteCount: number) {
  return {
    subject: `Your Weinly quotes are ready`,
    html: emailShell(`
      ${card(`
        ${badge("Quotes ready", BRAND.greenLight)}
        <h1 style="margin:0 0 10px;color:${BRAND.text};font-size:22px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">Your fabric quotes are ready</h1>
        <p style="margin:0 0 18px;color:${BRAND.muted};font-size:14px;line-height:1.7;">
          Hi ${esc(buyerName) || "there"}, <strong style="color:${BRAND.text};">${quoteCount} verified supplier${quoteCount === 1 ? " has" : "s have"}</strong> responded to your fabric sourcing request with quotes including price, MOQ and lead time.
        </p>
        ${infoBox("Request ID", requestId, BRAND.green)}
        ${ctaButton("View your quotes →", `${BRAND.site}/?requestId=${requestId}`, BRAND.green)}
        <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;text-align:center;">Review quotes first. Only pay when you're ready to unlock direct supplier contact.</p>
      `)}
      ${steps([
        "Review supplier quotes — see price, MOQ and lead time",
        "Choose a supplier you want to work with",
        "Pay to unlock their direct contact details",
        "Contact the supplier directly and negotiate your deal",
      ])}
    `),
  };
}

export function contactApprovedEmail(buyerName: string, requestId: string) {
  return {
    subject: `Your supplier contact details are ready on Weinly`,
    html: emailShell(`
      ${card(`
        ${badge("Contact approved", BRAND.greenLight)}
        <h1 style="margin:0 0 10px;color:${BRAND.text};font-size:22px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">Your supplier contact is ready</h1>
        <p style="margin:0 0 18px;color:${BRAND.muted};font-size:14px;line-height:1.7;">
          Hi ${esc(buyerName) || "there"}, your payment has been verified and your supplier contact access has been <strong style="color:${BRAND.greenLight};">approved</strong>. You can now view the supplier's phone number, WeChat ID and email directly.
        </p>
        <div style="background:${BRAND.greenLight}0d;border:1px solid ${BRAND.greenLight}33;border-radius:10px;padding:14px;margin-bottom:18px;">
          <div style="color:${BRAND.greenLight};font-size:13px;line-height:1.6;">
            Log in to your Weinly account — the supplier's phone, WeChat and email are now visible on your request tracker.
          </div>
        </div>
        ${ctaButton("View supplier contact →", `${BRAND.site}/?requestId=${requestId}`, BRAND.green)}
        <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;text-align:center;">Contact your supplier directly and start negotiating the best deal.</p>
      `)}
    `),
  };
}

export function supplierApprovedEmail(contactName: string, inviteCode: string, companyName: string) {
  return {
    subject: `Your Weinly supplier application is approved — here's your invite code`,
    html: emailShell(`
      ${card(`
        ${badge("Application approved", BRAND.greenLight)}
        <h1 style="margin:0 0 10px;color:${BRAND.text};font-size:22px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">Welcome to Weinly, ${esc(companyName)}</h1>
        <p style="margin:0 0 18px;color:${BRAND.muted};font-size:14px;line-height:1.7;">
          Hi ${esc(contactName)}, your supplier application has been reviewed and <strong style="color:${BRAND.greenLight};">approved</strong>. Use the invite code below to create your account and start receiving buyer quote requests.
        </p>
        <div style="background:${BRAND.accent}12;border:2px dashed ${BRAND.accent}55;border-radius:12px;padding:20px;margin-bottom:18px;text-align:center;">
          <div style="color:${BRAND.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Your invite code</div>
          <div style="color:${BRAND.text};font-size:24px;font-weight:900;letter-spacing:0.08em;font-family:monospace;">${inviteCode}</div>
          <div style="color:${BRAND.muted};font-size:12px;margin-top:8px;">Use this when creating your account — single use only.</div>
        </div>
        ${ctaButton("Create your supplier account →", `${BRAND.site}/supplier/auth`, BRAND.green)}
        <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;text-align:center;">Go to supplier sign up, select "Register", and enter your invite code.</p>
      `)}
      ${steps([
        `Create your account at weinlyhq.com/supplier/auth using your invite code`,
        "Complete your supplier profile — company info, categories, contact details",
        "Receive buyer quote requests matching your fabric categories",
        "Submit quotes — buyers see your price, MOQ and lead time",
        "When a buyer pays to unlock your contact, you get a direct lead",
      ], BRAND.green)}
    `),
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
    html: emailShell(`
      ${card(`
        ${badge("New buyer request", BRAND.rust)}
        <h1 style="margin:0 0 10px;color:${BRAND.text};font-size:22px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">A buyer needs your quote</h1>
        <p style="margin:0 0 18px;color:${BRAND.muted};font-size:14px;line-height:1.7;">
          Hi ${esc(supplierName)}, a new fabric sourcing request has been submitted on Weinly. Log in to your supplier dashboard to review the details and submit your quote.
        </p>
        <div style="background:#f9fafb;border:1px solid ${BRAND.cardBorder};border-radius:10px;padding:14px;margin-bottom:${aiSpec ? "12px" : "18px"};">
          <div style="color:${BRAND.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Buyer request</div>
          <p style="margin:0;color:${BRAND.text};font-size:13px;line-height:1.7;">${esc(fabricDescription).slice(0, 300)}${fabricDescription.length > 300 ? "..." : ""}</p>
        </div>
        ${aiSpec ? `
        <div style="background:${BRAND.green}0a;border:1px solid ${BRAND.green}22;border-radius:10px;padding:14px;margin-bottom:18px;">
          <div style="color:${BRAND.muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">AI sourcing spec</div>
          <p style="margin:0;color:${BRAND.text};font-size:13px;line-height:1.7;white-space:pre-wrap;">${esc(aiSpec).slice(0, 400)}${aiSpec.length > 400 ? "..." : ""}</p>
        </div>
        ` : ""}
        ${ctaButton("Submit your quote →", `${BRAND.site}/supplier/dashboard`, BRAND.green)}
        <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;text-align:center;">Fast response rates improve your chances of winning the deal.</p>
      `)}
    `),
  };
}
