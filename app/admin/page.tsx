"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

type FabricRequest = {
  id: string;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  user_input: string;
  ai_output: unknown;
  status: string | null;
  internal_note: string | null;
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

type NewQuoteForm = {
  supplier_name: string;
  price: string;
  moq: string;
  note: string;
  contact_name: string;
  contact_phone: string;
  contact_wechat: string;
  contact_email: string;
  supplier_region: string;
  lead_time: string;
};

const emptyQuoteForm: NewQuoteForm = {
  supplier_name: "",
  price: "",
  moq: "",
  note: "",
  contact_name: "",
  contact_phone: "",
  contact_wechat: "",
  contact_email: "",
  supplier_region: "",
  lead_time: "",
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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FabricRequest[]>([]);
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote[]>>({});
  const [search, setSearch] = useState("");
  const [newQuotes, setNewQuotes] = useState<Record<string, NewQuoteForm>>({});

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("weinly_admin_auth")
        : null;

    if (saved === "true") {
      setAuthenticated(true);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchRequests();
    }
  }, [authenticated]);

  async function fetchRequests() {
    try {
      const { data: requestData, error: reqError } = await supabase
        .from("fabric_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;

      const allRequests = (requestData || []) as FabricRequest[];
      setRequests(allRequests);

      const ids = allRequests.map((r) => r.id);

      if (ids.length === 0) {
        setQuotesMap({});
        return;
      }

      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .in("request_id", ids)
        .order("id", { ascending: false });

      if (quoteError) throw quoteError;

      const grouped: Record<string, Quote[]> = {};

      (quoteData || []).forEach((quote) => {
        const q = quote as Quote;
        if (!grouped[q.request_id]) grouped[q.request_id] = [];
        grouped[q.request_id].push(q);
      });

      setQuotesMap(grouped);
    } catch (error) {
      console.error(error);
      alert("Failed to load admin data.");
    }
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem("weinly_admin_auth", "true");
    } else {
      alert("Wrong password.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("weinly_admin_auth");
    setAuthenticated(false);
  }

  function updateNewQuoteField(
    requestId: string,
    field: keyof NewQuoteForm,
    value: string
  ) {
    setNewQuotes((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || { ...emptyQuoteForm }),
        [field]: value,
      },
    }));
  }

  async function addQuote(requestId: string) {
    const form = newQuotes[requestId];

    if (!form?.supplier_name?.trim()) {
      alert("Supplier name is required.");
      return;
    }

    try {
      const { error } = await supabase.from("quotes").insert([
        {
          request_id: requestId,
          supplier_name: form.supplier_name.trim(),
          price: form.price || null,
          moq: form.moq || null,
          note: form.note || null,
          contact_name: form.contact_name || null,
          contact_phone: form.contact_phone || null,
          contact_wechat: form.contact_wechat || null,
          contact_email: form.contact_email || null,
          supplier_region: form.supplier_region || null,
          lead_time: form.lead_time || null,
          is_contact_released: false,
        },
      ]);

      if (error) throw error;

      setNewQuotes((prev) => ({
        ...prev,
        [requestId]: { ...emptyQuoteForm },
      }));

      await fetchRequests();
      alert("Quote added.");
    } catch (error) {
      console.error(error);
      alert("Failed to add quote.");
    }
  }

  async function updateRequestStatus(requestId: string, status: string) {
    try {
      const { error } = await supabase
        .from("fabric_requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;
      await fetchRequests();
    } catch (error) {
      console.error(error);
      alert("Failed to update status.");
    }
  }

  async function saveInternalNote(requestId: string, note: string) {
    try {
      const { error } = await supabase
        .from("fabric_requests")
        .update({ internal_note: note })
        .eq("id", requestId);

      if (error) throw error;
    } catch (error) {
      console.error(error);
      alert("Failed to save internal note.");
    }
  }

  async function approveContactRelease(
    requestId: string,
    paymentStatus?: string | null
  ) {
    if (paymentStatus !== "paid") {
      alert("Payment must be confirmed before releasing supplier contact.");
      return;
    }

    try {
      const { error: reqError } = await supabase
        .from("fabric_requests")
        .update({
          contact_request_status: "approved",
        })
        .eq("id", requestId);

      if (reqError) throw reqError;

      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          is_contact_released: true,
        })
        .eq("request_id", requestId);

      if (quoteError) throw quoteError;

      await fetchRequests();
      alert("Supplier contact approved and released.");
    } catch (error) {
      console.error(error);
      alert("Failed to approve contact release.");
    }
  }

  async function rejectContactRelease(requestId: string) {
    try {
      const { error: reqError } = await supabase
        .from("fabric_requests")
        .update({
          contact_request_status: "rejected",
        })
        .eq("id", requestId);

      if (reqError) throw reqError;

      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          is_contact_released: false,
        })
        .eq("request_id", requestId);

      if (quoteError) throw quoteError;

      await fetchRequests();
      alert("Contact request rejected.");
    } catch (error) {
      console.error(error);
      alert("Failed to reject contact release.");
    }
  }

  async function deleteRequest(requestId: string) {
    const confirmed = window.confirm("Delete this request and all related quotes?");
    if (!confirmed) return;

    try {
      const { error: quoteError } = await supabase
        .from("quotes")
        .delete()
        .eq("request_id", requestId);

      if (quoteError) throw quoteError;

      const { error: reqError } = await supabase
        .from("fabric_requests")
        .delete()
        .eq("id", requestId);

      if (reqError) throw reqError;

      await fetchRequests();
      alert("Request deleted.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete request.");
    }
  }

  if (loading) {
    return <div style={{ padding: 30 }}>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <main style={pageStyle}>
        <div style={loginCardStyle}>
          <h1 style={{ marginTop: 0 }}>Weinly Admin</h1>
          <p style={{ color: "#64748b" }}>Enter admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            style={inputStyle}
          />
          <button onClick={handleLogin} style={darkButtonStyle}>
            Login
          </button>
        </div>
      </main>
    );
  }

  const filteredRequests = requests.filter((request) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    return (
      request.id.toLowerCase().includes(q) ||
      (request.client_name || "").toLowerCase().includes(q) ||
      (request.client_email || "").toLowerCase().includes(q) ||
      (request.client_phone || "").toLowerCase().includes(q) ||
      request.user_input.toLowerCase().includes(q)
    );
  });

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={topBarStyle}>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a" }}>Weinly Admin Dashboard</h1>
            <p style={{ margin: "8px 0 0 0", color: "#64748b" }}>
              Manage buyer requests, quotes, payments, and supplier contact release.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={fetchRequests} style={blueButtonStyle}>
              Refresh
            </button>
            <button onClick={handleLogout} style={dangerButtonStyle}>
              Logout
            </button>
          </div>
        </div>

        <div style={searchCardStyle}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by request ID, name, email, phone, or request text"
            style={inputStyle}
          />
        </div>

        {filteredRequests.length === 0 ? (
          <div style={emptyStateStyle}>No requests found.</div>
        ) : (
          filteredRequests.map((request) => {
            const quotes = quotesMap[request.id] || [];

            return (
              <section key={request.id} style={requestCardStyle}>
                <div style={requestHeaderStyle}>
                  <div>
                    <h2 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>
                      {request.client_name || "Unnamed buyer"}
                    </h2>
                    <div style={metaTextStyle}>Request ID: {request.id}</div>
                    <div style={metaTextStyle}>
                      Created: {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={pillWrapStyle}>
                    <span style={statusPillStyle}>
                      Status: {request.status || "submitted"}
                    </span>
                    <span style={contactPillStyle}>
                      Contact: {request.contact_request_status || "none"}
                    </span>
                  </div>
                </div>

                <div style={infoGridStyle}>
                  <div style={miniCardStyle}>
                    <strong>Email</strong>
                    <div style={smallMuted}>{request.client_email || "—"}</div>
                  </div>
                  <div style={miniCardStyle}>
                    <strong>Phone</strong>
                    <div style={smallMuted}>{request.client_phone || "—"}</div>
                  </div>
                  <div style={miniCardStyle}>
                    <strong>Buyer requested contact</strong>
                    <div style={smallMuted}>
                      {request.buyer_requested_contact ? "Yes" : "No"}
                    </div>
                  </div>
                  <div style={miniCardStyle}>
                    <strong>Total quotes</strong>
                    <div style={smallMuted}>{quotes.length}</div>
                  </div>
                </div>

                <div style={infoGridStyle}>
                  <div style={miniCardStyle}>
                    <strong>Payment status</strong>
                    <div style={smallMuted}>{request.payment_status || "unpaid"}</div>
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
                      {request.paid_at ? new Date(request.paid_at).toLocaleString() : "—"}
                    </div>
                  </div>
                </div>

                <div style={contentBoxStyle}>
                  <strong>Fabric request</strong>
                  <p style={preWrapText}>{request.user_input}</p>
                </div>

                {request.ai_output && (
                  <div style={contentBoxStyle}>
                    <strong>AI sourcing spec</strong>
                    <p style={preWrapText}>{formatAiOutput(request.ai_output)}</p>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <strong style={{ color: "#0f172a" }}>Internal note</strong>
                  <textarea
                    defaultValue={request.internal_note || ""}
                    onBlur={(e) => saveInternalNote(request.id, e.target.value)}
                    placeholder="Add internal notes here..."
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", marginTop: 8 }}
                  />
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => updateRequestStatus(request.id, "submitted")}
                    style={smallButtonStyle}
                  >
                    Mark Submitted
                  </button>
                  <button
                    onClick={() => updateRequestStatus(request.id, "quoted")}
                    style={smallButtonStyle}
                  >
                    Mark Quoted
                  </button>
                  <button
                    onClick={() => updateRequestStatus(request.id, "completed")}
                    style={smallButtonStyle}
                  >
                    Mark Completed
                  </button>

                  {request.contact_request_status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          approveContactRelease(request.id, request.payment_status)
                        }
                        style={approveButtonStyle}
                      >
                        Approve Contact Release
                      </button>
                      <button
                        onClick={() => rejectContactRelease(request.id)}
                        style={dangerButtonStyle}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {request.contact_request_status === "approved" && (
                    <button
                      onClick={() => rejectContactRelease(request.id)}
                      style={dangerButtonStyle}
                    >
                      Revoke Contact Access
                    </button>
                  )}

                  <button
                    onClick={() => deleteRequest(request.id)}
                    style={dangerButtonStyle}
                  >
                    Delete Request
                  </button>
                </div>

                <div style={quotesSectionStyle}>
                  <h3 style={{ marginTop: 0, color: "#0f172a" }}>Existing quotes</h3>

                  {quotes.length === 0 ? (
                    <div style={emptyStateStyle}>No quotes added yet.</div>
                  ) : (
                    quotes.map((quote) => (
                      <div key={quote.id} style={quoteCardStyle}>
                        <div style={quoteHeaderStyle}>
                          <strong style={{ color: "#0f172a" }}>{quote.supplier_name}</strong>
                          <span
                            style={{
                              background: quote.is_contact_released ? "#dcfce7" : "#eff6ff",
                              color: quote.is_contact_released ? "#166534" : "#1d4ed8",
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {quote.is_contact_released ? "Released" : "Protected"}
                          </span>
                        </div>

                        <div style={infoGridStyle}>
                          <div style={miniCardStyle}>
                            <strong>Region</strong>
                            <div style={smallMuted}>{quote.supplier_region || "—"}</div>
                          </div>
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
                        </div>

                        {quote.note && (
                          <div style={{ marginTop: 10 }}>
                            <strong>Note</strong>
                            <p style={preWrapText}>{quote.note}</p>
                          </div>
                        )}

                        <div style={infoGridStyle}>
                          <div style={miniCardStyle}>
                            <strong>Contact name</strong>
                            <div style={smallMuted}>{quote.contact_name || "—"}</div>
                          </div>
                          <div style={miniCardStyle}>
                            <strong>Phone</strong>
                            <div style={smallMuted}>{quote.contact_phone || "—"}</div>
                          </div>
                          <div style={miniCardStyle}>
                            <strong>WeChat</strong>
                            <div style={smallMuted}>{quote.contact_wechat || "—"}</div>
                          </div>
                          <div style={miniCardStyle}>
                            <strong>Email</strong>
                            <div style={smallMuted}>{quote.contact_email || "—"}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={addQuoteCardStyle}>
                  <h3 style={{ marginTop: 0, color: "#0f172a" }}>Add new quote</h3>

                  <div style={formGridStyle}>
                    <input
                      placeholder="Supplier name"
                      value={newQuotes[request.id]?.supplier_name || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "supplier_name", e.target.value)
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="Price"
                      value={newQuotes[request.id]?.price || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "price", e.target.value)
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="MOQ"
                      value={newQuotes[request.id]?.moq || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "moq", e.target.value)
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="Supplier region"
                      value={newQuotes[request.id]?.supplier_region || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "supplier_region", e.target.value)
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="Lead time"
                      value={newQuotes[request.id]?.lead_time || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "lead_time", e.target.value)
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="Contact name"
                      value={newQuotes[request.id]?.contact_name || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "contact_name", e.target.value)
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="Contact phone"
                      value={newQuotes[request.id]?.contact_phone || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "contact_phone", e.target.value)
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="Contact WeChat"
                      value={newQuotes[request.id]?.contact_wechat || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "contact_wechat", e.target.value)
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="Contact email"
                      value={newQuotes[request.id]?.contact_email || ""}
                      onChange={(e) =>
                        updateNewQuoteField(request.id, "contact_email", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </div>

                  <textarea
                    placeholder="Supplier note"
                    value={newQuotes[request.id]?.note || ""}
                    onChange={(e) =>
                      updateNewQuoteField(request.id, "note", e.target.value)
                    }
                    rows={4}
                    style={{ ...inputStyle, marginTop: 12, resize: "vertical" }}
                  />

                  <div style={{ marginTop: 12 }}>
                    <button onClick={() => addQuote(request.id)} style={darkButtonStyle}>
                      Add Quote
                    </button>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 16px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const loginCardStyle: React.CSSProperties = {
  maxWidth: 420,
  margin: "80px auto",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 18,
};

const searchCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
  marginBottom: 18,
};

const requestCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 22,
  marginBottom: 20,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
};

const requestHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  marginBottom: 16,
};

const pillWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignSelf: "start",
};

const statusPillStyle: React.CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const contactPillStyle: React.CSSProperties = {
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const metaTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};

const contentBoxStyle: React.CSSProperties = {
  marginTop: 14,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 14,
};

const quotesSectionStyle: React.CSSProperties = {
  marginTop: 22,
  borderTop: "1px solid #e2e8f0",
  paddingTop: 18,
};

const addQuoteCardStyle: React.CSSProperties = {
  marginTop: 18,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 18,
  padding: 16,
};

const quoteCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 14,
  background: "white",
  marginBottom: 12,
};

const quoteHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
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

const preWrapText: React.CSSProperties = {
  margin: "6px 0 0 0",
  color: "#334155",
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
};

const emptyStateStyle: React.CSSProperties = {
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 16,
  color: "#64748b",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0f172a",
  fontSize: 14,
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
};

const blueButtonStyle: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const approveButtonStyle: React.CSSProperties = {
  background: "#065f46",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  background: "#991b1b",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const smallButtonStyle: React.CSSProperties = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};