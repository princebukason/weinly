"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type FabricRequest = {
  id: string;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  user_input: string;
  ai_output: unknown;
  status: string | null;
  buyer_requested_contact: boolean | null;
  contact_request_status: string | null;
  contact_access_fee: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  paid_at: string | null;
};

type Quote = {
  id: string;
  request_id: string;
  supplier_name: string;
  price: string | null;
  moq: string | null;
  note: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_wechat: string | null;
  contact_email: string | null;
  supplier_region: string | null;
  lead_time: string | null;
  is_contact_released: boolean | null;
};

function formatAiOutput(aiOutput: unknown) {
  if (!aiOutput) return "—";

  if (typeof aiOutput === "string") return aiOutput;

  if (typeof aiOutput === "object") {
    return Object.entries(aiOutput as Record<string, unknown>)
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value ?? "")}`)
      .join("\n");
  }

  return String(aiOutput);
}

function getRequestStageLabel(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved") return "Supplier contact released";
  if (request.payment_status === "paid") return "Payment received";
  if (quoteCount > 0) return "Quotes available";
  if (request.status === "completed") return "Completed";
  if (request.status === "quoted") return "Quoted";
  return "Submitted";
}

function getStageTone(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved") {
    return {
      background: "#dcfce7",
      color: "#166534",
      label: "Access unlocked",
    };
  }

  if (request.payment_status === "paid") {
    return {
      background: "#ede9fe",
      color: "#6d28d9",
      label: "Paid",
    };
  }

  if (quoteCount > 0) {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      label: "Quotes ready",
    };
  }

  return {
    background: "#fef3c7",
    color: "#92400e",
    label: "In progress",
  };
}

export default function HistoryPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<FabricRequest[]>([]);
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote[]>>({});

  async function searchHistory(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() && !phone.trim()) {
      alert("Enter your email or phone number.");
      return;
    }

    setLoading(true);
    setRequests([]);
    setQuotesMap({});

    try {
      let query = supabase
        .from("fabric_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (email.trim() && phone.trim()) {
        query = query.or(
          `client_email.eq.${email.trim()},client_phone.eq.${phone.trim()}`
        );
      } else if (email.trim()) {
        query = query.eq("client_email", email.trim());
      } else if (phone.trim()) {
        query = query.eq("client_phone", phone.trim());
      }

      const { data, error } = await query;

      if (error) throw error;

      const requestList = (data || []) as FabricRequest[];
      setRequests(requestList);

      const requestIds = requestList.map((item) => item.id);

      if (requestIds.length > 0) {
        const { data: quoteData, error: quoteError } = await supabase
          .from("quotes")
          .select("*")
          .in("request_id", requestIds)
          .order("id", { ascending: false });

        if (quoteError) throw quoteError;

        const grouped: Record<string, Quote[]> = {};

        (quoteData || []).forEach((quote) => {
          const q = quote as Quote;
          if (!grouped[q.request_id]) grouped[q.request_id] = [];
          grouped[q.request_id].push(q);
        });

        setQuotesMap(grouped);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load request history.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={cardStyle}>
          <div style={badgeStyle}>WEINLY HISTORY</div>

          <h1 style={titleStyle}>View your previous requests</h1>
          <p style={subtitleStyle}>
            Enter the same email or phone number you used when submitting your request.
          </p>

          <form onSubmit={searchHistory}>
            <div style={formGridStyle}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                type="email"
                style={inputStyle}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone / WhatsApp"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...darkButtonStyle,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Searching..." : "Search history"}
              </button>

              <a href="/" style={linkButtonStyle}>
                Back to home
              </a>
            </div>
          </form>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitle}>Your requests</h2>

          {requests.length === 0 ? (
            <div style={emptyStateStyle}>
              No request history yet. Search using your email or phone number.
            </div>
          ) : (
            requests.map((request) => {
              const quotes = quotesMap[request.id] || [];
              const stage = getStageTone(request, quotes.length);

              return (
                <div key={request.id} style={requestCardStyle}>
                  <div style={requestHeaderStyle}>
                    <div>
                      <h3 style={{ margin: 0, color: "#0f172a" }}>
                        Request ID: {request.id}
                      </h3>
                      <div style={metaTextStyle}>
                        Created: {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={pillWrapStyle}>
                      <span style={statusPillStyle}>
                        Status: {request.status || "submitted"}
                      </span>
                      <span style={paymentPillStyle}>
                        Payment: {request.payment_status || "unpaid"}
                      </span>
                      <span
                        style={{
                          ...stagePillStyle,
                          background: stage.background,
                          color: stage.color,
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>
                  </div>

                  <div style={timelineBoxStyle}>
                    <strong style={{ color: "#0f172a" }}>Current stage</strong>
                    <div style={timelineTitleStyle}>
                      {getRequestStageLabel(request, quotes.length)}
                    </div>
                    <p style={timelineTextStyle}>
                      {request.contact_request_status === "approved"
                        ? "Your supplier contact access has been approved. You can now view the released contact details below."
                        : request.payment_status === "paid"
                        ? "Your payment has been received. Admin review or contact release may still be pending."
                        : quotes.length > 0
                        ? "Your quote preview is ready. Supplier contacts stay protected until access is approved."
                        : "Your request has been received and is being processed."}
                    </p>
                  </div>

                  <div style={infoGridStyle}>
                    <div style={miniCardStyle}>
                      <strong>Buyer</strong>
                      <div style={smallMuted}>{request.client_name || "Not provided"}</div>
                    </div>
                    <div style={miniCardStyle}>
                      <strong>Email</strong>
                      <div style={smallMuted}>{request.client_email || "—"}</div>
                    </div>
                    <div style={miniCardStyle}>
                      <strong>Phone</strong>
                      <div style={smallMuted}>{request.client_phone || "—"}</div>
                    </div>
                    <div style={miniCardStyle}>
                      <strong>Total quotes</strong>
                      <div style={smallMuted}>{quotes.length}</div>
                    </div>
                  </div>

                  <div style={infoGridStyle}>
                    <div style={miniCardStyle}>
                      <strong>Contact request</strong>
                      <div style={smallMuted}>
                        {request.contact_request_status || "none"}
                      </div>
                    </div>
                    <div style={miniCardStyle}>
                      <strong>Access fee</strong>
                      <div style={smallMuted}>{request.contact_access_fee || "—"}</div>
                    </div>
                    <div style={miniCardStyle}>
                      <strong>Payment reference</strong>
                      <div style={smallMuted}>{request.payment_reference || "—"}</div>
                    </div>
                    <div style={miniCardStyle}>
                      <strong>Paid at</strong>
                      <div style={smallMuted}>
                        {request.paid_at
                          ? new Date(request.paid_at).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div style={contentBoxStyle}>
                    <strong>Fabric request</strong>
                    <p style={preWrapText}>{request.user_input}</p>
                  </div>

                  {request.ai_output != null && (
                    <div style={contentBoxStyle}>
                      <strong>AI sourcing spec</strong>
                      <p style={preWrapText}>{formatAiOutput(request.ai_output)}</p>
                    </div>
                  )}

                  <div style={quotesSectionStyle}>
                    <div style={sectionRowStyle}>
                      <h4 style={quotesTitleStyle}>Supplier quote preview</h4>
                      <span style={quoteCountBadgeStyle}>
                        {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
                      </span>
                    </div>

                    {quotes.length === 0 ? (
                      <div style={emptyStateStyle}>
                        No quote has been added to this request yet.
                      </div>
                    ) : (
                      quotes.map((quote) => (
                        <div key={quote.id} style={quoteCardStyle}>
                          <div style={quoteTopRowStyle}>
                            <div>
                              <strong style={{ color: "#0f172a", fontSize: 16 }}>
                                {quote.supplier_name}
                              </strong>
                              <div style={smallMuted}>
                                {quote.supplier_region || "Region not added"}
                              </div>
                            </div>

                            <span
                              style={{
                                ...releaseBadgeStyle,
                                background: quote.is_contact_released
                                  ? "#dcfce7"
                                  : "#eff6ff",
                                color: quote.is_contact_released
                                  ? "#166534"
                                  : "#1d4ed8",
                              }}
                            >
                              {quote.is_contact_released
                                ? "Contact unlocked"
                                : "Contact protected"}
                            </span>
                          </div>

                          <div style={infoGridStyle}>
                            <div style={miniCardStyle}>
                              <strong>Price</strong>
                              <div style={smallMuted}>{quote.price || "—"}</div>
                            </div>
                            <div style={miniCardStyle}>
                              <strong>MOQ</strong>
                              <div style={smallMuted}>{quote.moq || "—"}</div>
                            </div>
                            <div style={miniCardStyle}>
                              <strong>Lead time</strong>
                              <div style={smallMuted}>{quote.lead_time || "—"}</div>
                            </div>
                            <div style={miniCardStyle}>
                              <strong>Supplier region</strong>
                              <div style={smallMuted}>{quote.supplier_region || "—"}</div>
                            </div>
                          </div>

                          {quote.note && (
                            <div style={contentBoxInnerStyle}>
                              <strong>Supplier note</strong>
                              <p style={preWrapText}>{quote.note}</p>
                            </div>
                          )}

                          {quote.is_contact_released ? (
                            <div style={unlockedBoxStyle}>
                              <strong style={{ color: "#166534" }}>
                                Supplier contact details
                              </strong>

                              <div style={infoGridStyle}>
                                <div style={miniCardStyle}>
                                  <strong>Contact name</strong>
                                  <div style={smallMuted}>
                                    {quote.contact_name || "—"}
                                  </div>
                                </div>
                                <div style={miniCardStyle}>
                                  <strong>Phone</strong>
                                  <div style={smallMuted}>
                                    {quote.contact_phone || "—"}
                                  </div>
                                </div>
                                <div style={miniCardStyle}>
                                  <strong>WeChat</strong>
                                  <div style={smallMuted}>
                                    {quote.contact_wechat || "—"}
                                  </div>
                                </div>
                                <div style={miniCardStyle}>
                                  <strong>Email</strong>
                                  <div style={smallMuted}>
                                    {quote.contact_email || "—"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={lockedBoxStyle}>
                              <strong style={{ color: "#1d4ed8" }}>
                                Supplier contact is protected
                              </strong>
                              <p style={lockedTextStyle}>
                                You can preview pricing, MOQ, lead time, and supplier
                                notes here. Direct supplier contact details are only shown
                                after access is approved.
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {quotes.length > 0 && request.contact_request_status !== "approved" && (
                    <div style={unlockBoxStyle}>
                      <div>
                        <h4 style={unlockTitleStyle}>Unlock direct supplier contact</h4>
                        <p style={unlockTextStyle}>
                          Get access to supplier phone number, WeChat, email, and contact
                          person after approval.
                        </p>
                      </div>

                      <div style={unlockMetaWrapStyle}>
                        <div style={unlockMetaCardStyle}>
                          <div style={unlockMetaLabelStyle}>Access fee</div>
                          <div style={unlockMetaValueStyle}>
                            {request.contact_access_fee || "Contact support"}
                          </div>
                        </div>

                        <div style={unlockMetaCardStyle}>
                          <div style={unlockMetaLabelStyle}>Request status</div>
                          <div style={unlockMetaValueStyle}>
                            {request.contact_request_status || "not requested"}
                          </div>
                        </div>
                      </div>

                      <div style={unlockActionRowStyle}>
                        <a href={`/?requestId=${request.id}`} style={darkButtonStyle}>
                          Open this request
                        </a>

                        <a
                          href="https://wa.me/2348130630046"
                          target="_blank"
                          rel="noreferrer"
                          style={whatsAppButtonStyle}
                        >
                          Chat on WhatsApp
                        </a>
                      </div>
                    </div>
                  )}

                  <div style={footerRowStyle}>
                    <div style={smallMuted}>
                      Need help with this request? Contact Weinly support on WhatsApp.
                    </div>
                    <a href={`/?requestId=${request.id}`} style={trackLinkStyle}>
                      Track this request
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "40px 16px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  marginBottom: 24,
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 14,
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: 34,
  lineHeight: 1.1,
  color: "#0f172a",
};

const subtitleStyle: React.CSSProperties = {
  margin: "0 0 18px 0",
  color: "#475569",
  lineHeight: 1.7,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0f172a",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

const darkButtonStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const linkButtonStyle: React.CSSProperties = {
  background: "#e2e8f0",
  color: "#0f172a",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  textDecoration: "none",
};

const whatsAppButtonStyle: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: 24,
  color: "#0f172a",
};

const emptyStateStyle: React.CSSProperties = {
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 18,
  color: "#64748b",
};

const requestCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  background: "#ffffff",
  marginBottom: 14,
};

const requestHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

const pillWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const statusPillStyle: React.CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const paymentPillStyle: React.CSSProperties = {
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const stagePillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const metaTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
  marginTop: 6,
};

const timelineBoxStyle: React.CSSProperties = {
  marginTop: 14,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 16,
};

const timelineTitleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};

const timelineTextStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "#475569",
  lineHeight: 1.7,
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginTop: 12,
};

const miniCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 14,
  padding: 12,
  color: "#0f172a",
};

const smallMuted: React.CSSProperties = {
  color: "#64748b",
  marginTop: 6,
  fontSize: 14,
  lineHeight: 1.6,
  wordBreak: "break-word",
};

const contentBoxStyle: React.CSSProperties = {
  marginTop: 14,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 14,
};

const contentBoxInnerStyle: React.CSSProperties = {
  marginTop: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 14,
  padding: 12,
};

const preWrapText: React.CSSProperties = {
  margin: "6px 0 0 0",
  color: "#334155",
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
};

const quotesSectionStyle: React.CSSProperties = {
  marginTop: 18,
};

const sectionRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const quotesTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: 18,
};

const quoteCountBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "8px 12px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 700,
};

const quoteCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 14,
  background: "white",
  marginBottom: 12,
};

const quoteTopRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const releaseBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const lockedBoxStyle: React.CSSProperties = {
  marginTop: 12,
  border: "1px dashed #93c5fd",
  background: "#eff6ff",
  borderRadius: 14,
  padding: 14,
};

const unlockedBoxStyle: React.CSSProperties = {
  marginTop: 12,
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  borderRadius: 14,
  padding: 14,
};

const lockedTextStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "#475569",
  lineHeight: 1.7,
};

const unlockBoxStyle: React.CSSProperties = {
  marginTop: 18,
  border: "1px solid #dbeafe",
  background: "#f8fbff",
  borderRadius: 18,
  padding: 16,
};

const unlockTitleStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  color: "#0f172a",
  fontSize: 18,
};

const unlockTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.7,
};

const unlockMetaWrapStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginTop: 14,
};

const unlockMetaCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  background: "white",
  borderRadius: 14,
  padding: 12,
};

const unlockMetaLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.3,
};

const unlockMetaValueStyle: React.CSSProperties = {
  marginTop: 6,
  color: "#0f172a",
  fontWeight: 700,
};

const unlockActionRowStyle: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const footerRowStyle: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const trackLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  fontWeight: 700,
  textDecoration: "none",
};