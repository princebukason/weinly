"use client";

import { useEffect, useState } from "react";
import { buildWhatsappLink } from "@/lib/config";

type SiteHeaderProps = {
  showSubmitButton?: boolean;
};

export default function SiteHeader({
  showSubmitButton = true,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 880);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const genericSupportLink = buildWhatsappLink(
    "Hello Weinly, I need help with fabric sourcing."
  );

  return (
    <header style={navWrapperStyle}>
      <div style={navBarStyle}>
        <div style={navTopRowStyle}>
          <a href="/" style={brandStyle}>
            <span style={brandBadgeStyle}>W</span>
            <span>Weinly</span>
          </a>

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              style={menuButtonStyle}
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          )}
        </div>

        <div
          style={{
            ...navContentWrapStyle,
            display: isMobile ? (mobileMenuOpen ? "flex" : "none") : "flex",
          }}
        >
          <nav
            style={{
              ...navLinksStyle,
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <a href="/" style={navLinkStyle}>Home</a>
            <a href="/#how-it-works" style={navLinkStyle}>How it works</a>
            <a href="/history" style={navLinkStyle}>History</a>
            <a href="/#pricing" style={navLinkStyle}>Pricing</a>
            
              href={genericSupportLink}
              target="_blank"
              rel="noreferrer"
              style={navLinkStyle}
            >
              WhatsApp Support
            </a>
          </nav>

          {showSubmitButton && (
            
              href="/#submit-request"
              style={{
                ...navCtaStyle,
                width: isMobile ? "100%" : "auto",
              }}
            >
              Submit Request
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

const navWrapperStyle: React.CSSProperties = {
  marginBottom: 18,
};

const navBarStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: "14px 18px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
};

const navTopRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const navContentWrapStyle: React.CSSProperties = {
  marginTop: 14,
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const brandStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 800,
  fontSize: 20,
};

const brandBadgeStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  background: "#0f172a",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 800,
};

const navLinksStyle: React.CSSProperties = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
};

const navLinkStyle: React.CSSProperties = {
  color: "#475569",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 14,
};

const navCtaStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  textDecoration: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const menuButtonStyle: React.CSSProperties = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};