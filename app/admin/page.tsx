"use client";

import { useEffect, useState } from "react";
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

export default function Admin() {
  const [requests, setRequests] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
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
    const { data: reqs } = await supabase
      .from("fabric_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: qs } = await supabase.from("quotes").select("*");

    setRequests(reqs || []);
    setQuotes(qs || []);
  }

  async function handleAddQuote(e: any, requestId: string) {
    e.preventDefault();

    const formData = new FormData(e.target);

    await supabase.from("quotes").insert({
      request_id: requestId,
      supplier_name: formData.get("supplier"),
      price: formData.get("price"),
      moq: formData.get("moq"),
      note: formData.get("note"),
    });

    await supabase
      .from("fabric_requests")
      .update({ status: "quoted" })
      .eq("id", requestId);

    e.target.reset();
    alert("Quote added and status updated to quoted!");
    fetchData();
  }

  function handleAdminLogin() {
    if (passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("Incorrect password");
    }
  }

  function getStatusBackground(status: string) {
    if (status === "completed") return COLORS.completedBg;
    if (status === "quoted") return COLORS.quotedBg;
    if (status === "in_progress") return COLORS.progressBg;
    return COLORS.newBg;
  }

  function formatStatus(status: string) {
    if (status === "in_progress") return "In Progress";
    if (status === "quoted") return "Quoted";
    if (status === "completed") return "Completed";
    return "New";
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
  const quotedRequests = requests.filter((item) => item.status === "quoted").length;
  const completedRequests = requests.filter(
    (item) => item.status === "completed"
  ).length;

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
          padding: 20,
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
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          outline: "none",
          fontSize: 14,
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
          padding: "10px 14px",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "0 6px 18px rgba(15, 118, 110, 0.22)",
          ...props.style,
        }}
      >
        {children}
      </button>
    );
  }

  if (!isAuthorized) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          backgroundColor: COLORS.softBg,
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <Card
          style={{
            maxWidth: 420,
            width: "100%",
            boxShadow: COLORS.shadow,
            border: "none",
            background: COLORS.heroBg,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            W
          </div>

          <h1 style={{ marginTop: 0, marginBottom: 10, color: COLORS.text }}>
            Admin Login
          </h1>
          <p style={{ color: COLORS.subtext, lineHeight: 1.7, marginBottom: 16 }}>
            Enter your admin password to access the Weinly dashboard.
          </p>

          <Input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter password"
            style={{ marginBottom: 12 }}
          />

          <PrimaryButton onClick={handleAdminLogin} style={{ width: "100%" }}>
            Login
          </PrimaryButton>
        </Card>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 20,
        maxWidth: 1200,
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
            <div style={{ fontWeight: 800, fontSize: 18 }}>Weinly Admin</div>
            <div style={{ fontSize: 12, color: COLORS.subtext }}>
              Internal sourcing workspace
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
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>Manage buyer requests</h1>
        <p style={{ color: COLORS.subtext, lineHeight: 1.8, margin: 0 }}>
          Review requests, add quotes, update statuses, leave internal notes,
          and follow up with buyers from one dashboard.
        </p>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <Card style={{ padding: 16 }}>
          <strong>Total</strong>
          <p style={{ fontSize: 26, margin: "10px 0 0" }}>{totalRequests}</p>
        </Card>

        <Card style={{ padding: 16, backgroundColor: COLORS.newBg }}>
          <strong>New</strong>
          <p style={{ fontSize: 26, margin: "10px 0 0" }}>{newRequests}</p>
        </Card>

        <Card style={{ padding: 16, backgroundColor: COLORS.progressBg }}>
          <strong>In Progress</strong>
          <p style={{ fontSize: 26, margin: "10px 0 0" }}>{inProgressRequests}</p>
        </Card>

        <Card style={{ padding: 16, backgroundColor: COLORS.quotedBg }}>
          <strong>Quoted</strong>
          <p style={{ fontSize: 26, margin: "10px 0 0" }}>{quotedRequests}</p>
        </Card>

        <Card style={{ padding: 16, backgroundColor: COLORS.completedBg }}>
          <strong>Completed</strong>
          <p style={{ fontSize: 26, margin: "10px 0 0" }}>{completedRequests}</p>
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Filter by status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                fontSize: 14,
                backgroundColor: "#fff",
              }}
            >
              <option value="all">all</option>
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="quoted">quoted</option>
              <option value="completed">completed</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Search requests
            </label>
            <Input
              type="text"
              placeholder="Search by client name, email, phone, or request..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <p style={{ marginTop: 16, marginBottom: 0, color: COLORS.subtext }}>
          Showing {filteredRequests.length} request(s)
        </p>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {filteredRequests.map((item) => (
          <Card
            key={item.id}
            style={{
              backgroundColor: getStatusBackground(item.status),
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>
                  {item.client_name || "Unnamed client"}
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: COLORS.subtext,
                    wordBreak: "break-word",
                  }}
                >
                  Request ID: {item.id}
                </p>
              </div>

              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: 999,
                    backgroundColor: "#fff",
                    border: `1px solid ${COLORS.border}`,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {formatStatus(item.status)}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <p style={{ margin: "0 0 8px" }}>
                  <strong>Email:</strong> {item.client_email || "Not provided"}
                </p>

                {item.client_email && (
                  <p style={{ margin: "0 0 8px" }}>
                    <a
                      href={`mailto:${item.client_email}`}
                      style={{
                        color: COLORS.primary,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Send Email
                    </a>
                  </p>
                )}

                <p style={{ margin: "0 0 8px" }}>
                  <strong>Phone:</strong> {item.client_phone || "Not provided"}
                </p>

                {item.client_phone && (
                  <p style={{ margin: 0 }}>
                    <a
                      href={`https://wa.me/${item.client_phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: COLORS.primary,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Contact on WhatsApp
                    </a>
                  </p>
                )}
              </div>

              <div>
                <p style={{ margin: "0 0 8px" }}>
                  <strong>Created:</strong>{" "}
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "Unknown"}
                </p>

                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Update status
                </label>
                <select
                  defaultValue={item.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;

                    await supabase
                      .from("fabric_requests")
                      .update({ status: newStatus })
                      .eq("id", item.id);

                    fetchData();
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: 14,
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="new">new</option>
                  <option value="in_progress">in_progress</option>
                  <option value="quoted">quoted</option>
                  <option value="completed">completed</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 10 }}>Fabric Request</h3>
              <div
                style={{
                  backgroundColor: "#fff",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14,
                  padding: 16,
                  lineHeight: 1.8,
                  wordBreak: "break-word",
                }}
              >
                {item.user_input}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
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
                }}
              >
                {typeof item.ai_output === "string"
                  ? item.ai_output
                  : JSON.stringify(item.ai_output, null, 2)}
              </pre>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 10 }}>Internal Note</h3>
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
                  minHeight: 90,
                  padding: 14,
                  borderRadius: 14,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14,
                  lineHeight: 1.7,
                  resize: "vertical",
                  backgroundColor: "#fff",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <PrimaryButton
                onClick={async () => {
                  await supabase
                    .from("fabric_requests")
                    .update({ status: "completed" })
                    .eq("id", item.id);

                  fetchData();
                }}
                style={{ width: "auto" }}
              >
                Mark as Completed
              </PrimaryButton>

              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Are you sure you want to delete this request?"
                  );

                  if (!confirmed) return;

                  await supabase.from("quotes").delete().eq("request_id", item.id);
                  await supabase.from("fabric_requests").delete().eq("id", item.id);

                  fetchData();
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  backgroundColor: "#B91C1C",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Delete Request
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 12 }}>Add Quote</h3>

              <form
                onSubmit={(e) => handleAddQuote(e, item.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                <Input name="supplier" placeholder="Supplier name" />
                <Input name="price" placeholder="Price" />
                <Input name="moq" placeholder="MOQ" />
                <Input name="note" placeholder="Notes" />

                <div style={{ display: "flex", alignItems: "center" }}>
                  <PrimaryButton type="submit" style={{ width: "100%" }}>
                    Add Quote
                  </PrimaryButton>
                </div>
              </form>
            </div>

            <div>
              <h3 style={{ marginBottom: 12 }}>Quotes</h3>

              {quotes.filter((q) => q.request_id === item.id).length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 14,
                  }}
                >
                  {quotes
                    .filter((q) => q.request_id === item.id)
                    .map((q) => (
                      <div
                        key={q.id}
                        style={{
                          border: `1px solid ${COLORS.border}`,
                          padding: 18,
                          borderRadius: 14,
                          backgroundColor: "#fff",
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 800 }}>{q.supplier_name}</p>
                        <p style={{ margin: "10px 0 6px", color: COLORS.subtext }}>
                          <strong style={{ color: COLORS.text }}>Price:</strong> {q.price}
                        </p>
                        <p style={{ margin: "6px 0", color: COLORS.subtext }}>
                          <strong style={{ color: COLORS.text }}>MOQ:</strong> {q.moq}
                        </p>
                        <p style={{ margin: "6px 0 0", color: COLORS.subtext }}>
                          <strong style={{ color: COLORS.text }}>Note:</strong> {q.note}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: "#fff",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    padding: 16,
                    color: COLORS.subtext,
                  }}
                >
                  No quotes added yet.
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

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
        © {new Date().getFullYear()} Weinly Admin. Internal sourcing workspace.
      </footer>
    </main>
  );
}