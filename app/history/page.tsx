"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = {
  primary: "#0F766E",
  primaryDark: "#0B5E58",
  accent: "#D97706",
  text: "#111827",
  subtext: "#6B7280",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  softBg: "#F9FAFB",
  heroBg: "linear-gradient(135deg, #F9FAFB, #ECFDF5)",
  completedBg: "#ECFDF5",
  quotedBg: "#FFFBEB",
  progressBg: "#EFF6FF",
  newBg: "#F3F4F6",
  shadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
  shadowSoft: "0 4px 14px rgba(17, 24, 39, 0.06)",
};

export default function HistoryPage() {
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<any[]>([]);

  async function loadHistory() {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("fabric_requests")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Failed to load request history");
      setLoading(false);
      return;
    }

    setRequests(data || []);
    setSelectedRequest(null);
    setSelectedQuotes([]);
    setLoading(false);
  }

  async function viewRequestDetails(request: any) {
    setSelectedRequest(request);

    const { data: quotesData, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("request_id", request.id);

    if (error) {
      alert("Failed to load quotes");
      return;
    }

    setSelectedQuotes(quotesData || []);
  }

  function formatStatus(status: string) {
    if (status === "in_progress") return "In Progress";
    if (status === "quoted") return "Quoted";
    if (status === "completed") return "Completed";
    return "New";
  }

  function getStatusColor(status: string) {
    if (status === "completed") return COLORS.completedBg;
    if (status === "quoted") return COLORS.quotedBg;
    if (status === "in_progress") return COLORS.progressBg;
    return COLORS.newBg;
  }

  function Card({
    children,
    style = {},
  }: {
    children: React.ReactNode;
    style?: React.CSSProperties;
  }) {
    return (
      <div
        style={{
          backgroundColor: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 18,
          padding: 24,
          boxShadow: COLORS.shadowSoft,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <input
        {...props}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          outline: "none",
          fontSize: 15,
          color: COLORS.text,
          backgroundColor: "#fff",
          ...props.style,
        }}
      />
    );
  }

  function PrimaryButton({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
      <button
        {...props}
        style={{
          backgroundColor: COLORS.primary,
          color: "#fff",
          padding: "12px 18px",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
          boxShadow: "0 6px 18px rgba(15, 118, 110, 0.22)",
          ...props.style,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <main
      style={{
        padding: 20,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: COLORS.text,
        backgroundColor: COLORS.softBg,
        minHeight: "100vh",
      }}
    >
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 24,
          padding: "12px 0",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            W
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Weinly</div>
            <div style={{ fontSize: 12, color: COLORS.subtext }}>
              AI-powered sourcing
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a
            href="/"
            style={{
              textDecoration: "none",
              color: COLORS.primary,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Home
          </a>
          <a
            href="/history"
            style={{
              textDecoration: "none",
              color: COLORS.text,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            History
          </a>
        </div>
      </nav>

      <Card
        style={{
          marginBottom: 20,
          background: COLORS.heroBg,
          boxShadow: COLORS.shadow,
          border: "none",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "#D1FAE5",
              color: COLORS.primary,
              fontWeight: 700,
              fontSize: 13,
              padding: "8px 12px",
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            Buyer workspace
          </div>

          <h1
            style={{
              marginTop: 0,
              marginBottom: 14,
              fontSize: 34,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            View your previous fabric requests.
          </h1>

          <p
            style={{
              margin: 0,
              color: COLORS.subtext,
              lineHeight: 1.75,
              fontSize: 16,
              maxWidth: 720,
            }}
          >
            Enter your email to access your request history, review AI-generated
            fabric specifications, and check quotes from verified suppliers.
          </p>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Load your request history</h2>
        <p style={{ color: COLORS.subtext, lineHeight: 1.7, marginBottom: 14 }}>
          Use the same email you submitted with your fabric requests.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "stretch",
          }}
        >
          <div style={{ flex: "1 1 260px" }}>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <PrimaryButton
            onClick={loadHistory}
            style={{ width: "auto", minWidth: 180 }}
          >
            {loading ? "Loading..." : "Load My Requests"}
          </PrimaryButton>
        </div>
      </Card>

      {!loading && requests.length === 0 && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, color: COLORS.subtext }}>
            No requests loaded yet.
          </p>
        </Card>
      )}

      {requests.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Your Requests</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {requests.map((item) => (
              <Card
                key={item.id}
                style={{
                  backgroundColor: getStatusColor(item.status),
                }}
              >
                <p style={{ margin: "0 0 8px", fontWeight: 800 }}>
                  Request ID: {item.id}
                </p>

                <p style={{ margin: "0 0 8px" }}>
                  <strong>Status:</strong> {formatStatus(item.status)}
                </p>

                <p style={{ margin: "0 0 8px", color: COLORS.text, lineHeight: 1.7 }}>
                  <strong>Fabric Request:</strong> {item.user_input}
                </p>

                <p style={{ margin: "0 0 12px", color: COLORS.subtext }}>
                  <strong>Created:</strong>{" "}
                  {new Date(item.created_at).toLocaleString()}
                </p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <PrimaryButton
                    onClick={() => viewRequestDetails(item)}
                    style={{ width: "auto" }}
                  >
                    View Details
                  </PrimaryButton>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.id);
                      alert("Request ID copied!");
                    }}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: "#fff",
                      color: COLORS.text,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Copy Request ID
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedRequest && (
        <Card
          style={{
            marginTop: 12,
            backgroundColor: "#fff",
            boxShadow: COLORS.shadow,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Request Details</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                backgroundColor: COLORS.softBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 800 }}>Request ID</p>
              <p style={{ margin: 0, color: COLORS.subtext, wordBreak: "break-word" }}>
                {selectedRequest.id}
              </p>
            </div>

            <div
              style={{
                backgroundColor: getStatusColor(selectedRequest.status),
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 800 }}>Status</p>
              <p style={{ margin: 0, color: COLORS.text }}>
                {formatStatus(selectedRequest.status)}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 10 }}>Original Fabric Request</h3>
            <div
              style={{
                backgroundColor: COLORS.softBg,
                padding: 16,
                borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                lineHeight: 1.8,
                color: COLORS.text,
              }}
            >
              {selectedRequest.user_input}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 10 }}>AI Fabric Specification</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                lineHeight: 1.75,
                overflowX: "auto",
                boxShadow: COLORS.shadowSoft,
              }}
            >
              {typeof selectedRequest.ai_output === "string"
                ? selectedRequest.ai_output
                : JSON.stringify(selectedRequest.ai_output, null, 2)}
            </pre>
          </div>

          <div>
            <h3 style={{ marginBottom: 10 }}>Quotes from Verified Suppliers</h3>

            {selectedQuotes.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {selectedQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: 18,
                      borderRadius: 14,
                      backgroundColor: "#fff",
                      boxShadow: COLORS.shadowSoft,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        fontSize: 16,
                        color: COLORS.text,
                      }}
                    >
                      {quote.supplier_name}
                    </p>

                    <div
                      style={{
                        marginTop: 12,
                        lineHeight: 1.8,
                        color: COLORS.subtext,
                      }}
                    >
                      <p style={{ margin: "6px 0" }}>
                        <strong style={{ color: COLORS.text }}>Price:</strong>{" "}
                        {quote.price}
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        <strong style={{ color: COLORS.text }}>MOQ:</strong>{" "}
                        {quote.moq}
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        <strong style={{ color: COLORS.text }}>Note:</strong>{" "}
                        {quote.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card style={{ padding: 18, backgroundColor: COLORS.softBg }}>
                <p style={{ margin: 0, color: COLORS.subtext }}>
                  No quotes available yet for this request.
                </p>
              </Card>
            )}
          </div>
        </Card>
      )}

      <footer
        style={{
          marginTop: 40,
          paddingTop: 24,
          paddingBottom: 24,
          borderTop: `1px solid ${COLORS.border}`,
          textAlign: "center",
          color: COLORS.subtext,
          fontSize: 14,
        }}
      >
        © {new Date().getFullYear()} Weinly. AI-powered fabric sourcing.
      </footer>
    </main>
  );
}