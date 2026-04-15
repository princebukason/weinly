import { buildWhatsappLink, SUPPORT_EMAIL } from "@/lib/config";

export default function SiteFooter() {
  const genericSupportLink = buildWhatsappLink(
    "Hello Weinly, I need help with fabric sourcing."
  );

  return (
    <footer style={footerStyle}>
      <div style={footerTopStyle}>
        <div>
          <div style={footerBrandStyle}>Weinly</div>
          <p style={footerTextStyle}>
            Built for fabric buyers sourcing from China.
          </p>
        </div>

        <div style={footerGridStyle}>
          <div>
            <div style={footerHeadingStyle}>Navigation</div>
            <div style={footerLinksWrapStyle}>
              <a href="/history" style={footerLinkStyle}>History</a>
              <a href="/#pricing" style={footerLinkStyle}>Pricing</a>
              <a href="/#how-it-works" style={footerLinkStyle}>How it works</a>
            </div>
          </div>

          <div>
            <div style={footerHeadingStyle}>Support</div>
            <div style={footerLinksWrapStyle}>
              
                href={genericSupportLink}
                target="_blank"
                rel="noreferrer"
                style={footerLinkStyle}
              >
                WhatsApp
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} style={footerLinkStyle}>
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

const footerStyle: React.CSSProperties = {
  marginTop: 8,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
};

const footerTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  flexWrap: "wrap",
};

const footerBrandStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
};

const footerTextStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "#64748b",
  lineHeight: 1.7,
  maxWidth: 320,
};

const footerGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 24,
  minWidth: 320,
};

const footerHeadingStyle: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 700,
  marginBottom: 10,
};

const footerLinksWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const footerLinkStyle: React.CSSProperties = {
  color: "#475569",
  textDecoration: "none",
  fontWeight: 600,
};