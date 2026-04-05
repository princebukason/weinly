"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HistoryPage() {
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<any[]>([]);

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

  async function loadHistory() {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    setLoading(true);
    setSelectedRequest(null);
    setSelectedQuotes([]);

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
    setLoading(false);
  }

  function formatStatus(status: string) {
    if (status === "in_progress") return "In Progress";
    if (status === "quoted") return "Quoted";
    if (status === "completed") return "Completed";
    return "New";
  }

  function getStatusColor(status: string) {
    if (status === "completed") return "#e8f5e9";
    if (status === "quoted") return "#fff8e1";
    if (status === "in_progress") return "#e3f2fd";
    return "#f5f5f5";
  }

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
          paddingBottom: 12,
          borderBottom: "1px solid #eee",
        }}
      >
        <h2 style={{ margin: 0 }}>Weinly</h2>

        <div style={{ display: "flex", gap: 16 }}>
          <a
            href="/"
            style={{
              textDecoration: "none",
              color: "#1a73e8",
              fontWeight: "bold",
            }}
          >
            Home
          </a>
          <a
            href="/history"
            style={{
              textDecoration: "none",
              color: "#111",
              fontWeight: "bold",
            }}
          >
            History
          </a>
        </div>
      </nav>

      <h1>Request History</h1>
      <p>Enter your email to view your previous fabric requests.</p>

      <div style={{ marginBottom: 20 }}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 10,
          }}
        />

        <button
          onClick={loadHistory}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Load My Requests"}
        </button>
      </div>

      {requests.length > 0 && (
        <div>
          <h3>Your Requests</h3>

          {requests.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                backgroundColor: getStatusColor(item.status),
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
                Request ID: {item.id}
              </p>
              <p style={{ margin: "0 0 8px" }}>
                <strong>Status:</strong> {formatStatus(item.status)}
              </p>
              <p style={{ margin: "0 0 8px" }}>
                <strong>Fabric Request:</strong> {item.user_input}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Created:</strong>{" "}
                {new Date(item.created_at).toLocaleString()}
              </p>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(item.id);
                  alert("Request ID copied!");
                }}
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#111",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Copy Request ID
              </button>

              <button
                onClick={() => viewRequestDetails(item)}
                style={{
                  marginTop: 10,
                  marginLeft: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#111",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 10,
            backgroundColor: "#fafafa",
          }}
        >
          <h3>Request Details</h3>

          <p>
            <strong>Request ID:</strong> {selectedRequest.id}
          </p>
          <p>
            <strong>Status:</strong> {formatStatus(selectedRequest.status)}
          </p>
          <p>
            <strong>Fabric Request:</strong> {selectedRequest.user_input}
          </p>

          <div style={{ marginTop: 20 }}>
            <h4>AI Fabric Specification</h4>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                backgroundColor: "#fff",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #eee",
              }}
            >
              {typeof selectedRequest.ai_output === "string"
                ? selectedRequest.ai_output
                : JSON.stringify(selectedRequest.ai_output, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>Supplier Quotes</h4>

            {selectedQuotes.length > 0 ? (
              selectedQuotes.map((quote) => (
                <div
                  key={quote.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: 14,
                    marginTop: 10,
                    borderRadius: 8,
                    backgroundColor: "#fff",
                  }}
                >
                  <p>
                    <strong>{quote.supplier_name}</strong>
                  </p>
                  <p>
                    <strong>Price:</strong> {quote.price}
                  </p>
                  <p>
                    <strong>MOQ:</strong> {quote.moq}
                  </p>
                  <p>
                    <strong>Note:</strong> {quote.note}
                  </p>
                </div>
              ))
            ) : (
              <p>No quotes available yet for this request.</p>
            )}
          </div>
        </div>
      )}

      {!loading && requests.length === 0 && (
        <p style={{ color: "#666" }}>No requests loaded yet.</p>
      )}

      <footer
        style={{
          marginTop: 40,
          paddingTop: 20,
          paddingBottom: 20,
          borderTop: "1px solid #eee",
          textAlign: "center",
          color: "#777",
          fontSize: 14,
        }}
      >
        © {new Date().getFullYear()} Weinly. AI-powered fabric sourcing.
      </footer>
    </main>
  );
}