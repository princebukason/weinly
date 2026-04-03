"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RequestItem = {
  id: string;
  user_input: string | null;
  ai_output: any;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  status: string | null;
  internal_note?: string | null;
  created_at?: string;
};

type QuoteItem = {
  id: string;
  request_id: string;
  supplier_name: string | null;
  price: string | null;
  moq: string | null;
  note: string | null;
};

export default function AdminPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

  async function fetchData() {
    setLoading(true);

    const { data: reqs, error: reqError } = await supabase
      .from("fabric_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: qs, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (reqError) {
      console.error("Error loading requests:", reqError);
    }

    if (quoteError) {
      console.error("Error loading quotes:", quoteError);
    }

    setRequests(reqs || []);
    setQuotes(qs || []);
    setLoading(false);
  }

  function handleAdminLogin() {
    if (passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("Incorrect password");
    }
  }

  function getQuotesForRequest(requestId: string) {
    return quotes.filter((q) => q.request_id === requestId);
  }

  async function handleAddQuote(
    e: React.FormEvent<HTMLFormElement>,
    requestId: string
  ) {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const payload = {
      request_id: requestId,
      supplier_name: String(formData.get("supplier") || ""),
      price: String(formData.get("price") || ""),
      moq: String(formData.get("moq") || ""),
      note: String(formData.get("note") || ""),
    };

    const { error } = await supabase.from("quotes").insert(payload);

    if (error) {
      console.error("Error adding quote:", error);
      alert("Error adding quote");
      return;
    }

    alert("Quote added!");
    form.reset();
    await fetchData();
  }

  const filteredRequests = requests
    .filter((item) => statusFilter === "all" || item.status === statusFilter)
    .filter((item) => {
      const term = searchTerm.toLowerCase();

      return (
        (item.client_name || "").toLowerCase().includes(term) ||
        (item.client_email || "").toLowerCase().includes(term) ||
        (item.client_phone || "").toLowerCase().includes(term) ||
        (item.user_input || "").toLowerCase().includes(term)
      );
    });

  const totalRequests = requests.length;
  const newRequests = requests.filter((item) => item.status === "new").length;
  const inProgressRequests = requests.filter(
    (item) => item.status === "in_progress"
  ).length;
  const quotedRequests = requests.filter((item) => item.status === "quoted")
    .length;
  const completedRequests = requests.filter(
    (item) => item.status === "completed"
  ).length;

  if (!isAuthorized) {
    return (
      <main
        style={{
          padding: 40,
          maxWidth: 400,
          margin: "0 auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Admin Login</h1>
        <p>Enter admin password to continue</p>

        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Enter password"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleAdminLogin}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: 30, fontFamily: "Arial, sans-serif" }}>
        <h1>Admin Dashboard</h1>
        <p>Loading requests...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 30,
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 30, marginBottom: 10 }}>Admin Dashboard</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            backgroundColor: "#fafafa",
          }}
        >
          <strong>Total</strong>
          <p style={{ fontSize: 24, margin: "8px 0 0" }}>{totalRequests}</p>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            backgroundColor: "#f5f5f5",
          }}
        >
          <strong>New</strong>
          <p style={{ fontSize: 24, margin: "8px 0 0" }}>{newRequests}</p>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            backgroundColor: "#e3f2fd",
          }}
        >
          <strong>In Progress</strong>
          <p style={{ fontSize: 24, margin: "8px 0 0" }}>
            {inProgressRequests}
          </p>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            backgroundColor: "#fff8e1",
          }}
        >
          <strong>Quoted</strong>
          <p style={{ fontSize: 24, margin: "8px 0 0" }}>{quotedRequests}</p>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            backgroundColor: "#e8f5e9",
          }}
        >
          <strong>Completed</strong>
          <p style={{ fontSize: 24, margin: "8px 0 0" }}>
            {completedRequests}
          </p>
        </div>
      </div>

      <p style={{ color: "#666", marginBottom: 24 }}>
        Manage buyer requests and add supplier quotes.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10, fontWeight: "bold" }}>
          Filter by status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 6 }}
        >
          <option value="all">all</option>
          <option value="new">new</option>
          <option value="in_progress">in_progress</option>
          <option value="quoted">quoted</option>
          <option value="completed">completed</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by client name, email, phone, or fabric request..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
      </div>

      <p style={{ marginBottom: 16 }}>
        Showing {filteredRequests.length} request(s)
      </p>

      {filteredRequests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        filteredRequests.map((item) => {
          const requestQuotes = getQuotesForRequest(item.id);

          return (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                padding: 16,
                marginBottom: 20,
                borderRadius: 10,
                backgroundColor: "#fff",
              }}
            >
              <p>
                <strong>{item.client_name || "Unknown Buyer"}</strong>
              </p>

              <p>
                <strong>Email:</strong> {item.client_email || "Not provided"}
              </p>

              {item.client_email && (
                <p>
                  <a
                    href={`mailto:${item.client_email}`}
                    style={{ color: "#1a73e8", fontWeight: "bold" }}
                  >
                    Send Email
                  </a>
                </p>
              )}

              <p>
                <strong>Phone:</strong> {item.client_phone || "Not provided"}
              </p>

              {item.client_phone && (
                <p>
                  <a
                    href={`https://wa.me/${item.client_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "green", fontWeight: "bold" }}
                  >
                    Contact on WhatsApp
                  </a>
                </p>
              )}

              <p>
                <strong>Request:</strong> {item.user_input || "No request text"}
              </p>

              <p>
                <strong>Status:</strong> {item.status || "new"}
              </p>

              <p>
                <strong>Request ID:</strong> {item.id}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={async () => {
                    await supabase
                      .from("fabric_requests")
                      .update({ status: "completed" })
                      .eq("id", item.id);

                    fetchData();
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "#2e7d32",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Mark as Completed
                </button>

                <button
                  onClick={async () => {
                    const confirmed = window.confirm(
                      "Are you sure you want to delete this request?"
                    );

                    if (!confirmed) return;

                    await supabase.from("quotes").delete().eq("request_id", item.id);
                    await supabase
                      .from("fabric_requests")
                      .delete()
                      .eq("id", item.id);

                    fetchData();
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "#c62828",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Delete Request
                </button>
              </div>

              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <p>
                  <strong>Internal Note:</strong>
                </p>
                <textarea
                  defaultValue={item.internal_note || ""}
                  placeholder="Add private note for this request..."
                  onBlur={async (e) => {
                    await supabase
                      .from("fabric_requests")
                      .update({ internal_note: e.target.value })
                      .eq("id", item.id);

                    fetchData();
                  }}
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 8,
                  backgroundColor: "#fafafa",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Add Quote</h3>

                <form onSubmit={(e) => handleAddQuote(e, item.id)}>
                  <input
                    name="supplier"
                    placeholder="Supplier name"
                    required
                    style={{
                      width: "100%",
                      padding: 10,
                      marginBottom: 10,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />

                  <input
                    name="price"
                    placeholder="Price"
                    required
                    style={{
                      width: "100%",
                      padding: 10,
                      marginBottom: 10,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />

                  <input
                    name="moq"
                    placeholder="MOQ"
                    style={{
                      width: "100%",
                      padding: 10,
                      marginBottom: 10,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />

                  <input
                    name="note"
                    placeholder="Notes"
                    style={{
                      width: "100%",
                      padding: 10,
                      marginBottom: 10,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      padding: "10px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Add Quote
                  </button>
                </form>
              </div>

              {requestQuotes.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <h3>Existing Quotes</h3>

                  {requestQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      style={{
                        border: "1px solid #ddd",
                        padding: 12,
                        marginTop: 10,
                        borderRadius: 8,
                        backgroundColor: "#fcfcfc",
                      }}
                    >
                      <p>
                        <strong>
                          {quote.supplier_name || "Unknown supplier"}
                        </strong>
                      </p>
                      <p>
                        <strong>Price:</strong> {quote.price || "Not provided"}
                      </p>
                      <p>
                        <strong>MOQ:</strong> {quote.moq || "Not provided"}
                      </p>
                      <p>
                        <strong>Note:</strong> {quote.note || "No note"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </main>
  );
}