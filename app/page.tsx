"use client";

import { useMemo, useState } from "react";
import { suppliers } from "@/lib/suppliers";
import { supabase } from "@/lib/supabase";

type FabricSpec = {
  fabric_type: string;
  intended_use: string;
  quality_level: string;
  color_or_pattern: string;
  weight_or_thickness: string;
  quantity: string;
  budget: string;
};

function show(v: any): string {
  if (v === null || v === undefined) return "Not specified";
  const s = String(v).trim();
  return s.length ? s : "Not specified";
}

function normalizeSpec(raw: any): FabricSpec {
  const r = raw ?? {};

  return {
    fabric_type: show(
      r.fabric_type ?? r.fabricType ?? r.fabric ?? r.type ?? r.material
    ),
    intended_use: show(
      r.intended_use ?? r.intendedUse ?? r.use ?? r.application ?? r.purpose
    ),
    quality_level: show(
      r.quality_level ?? r.qualityLevel ?? r.quality ?? r.grade
    ),
    color_or_pattern: show(
      r.color_or_pattern ??
        r.colorOrPattern ??
        r.color ??
        r.pattern ??
        r.design
    ),
    weight_or_thickness: show(
      r.weight_or_thickness ??
        r.weightOrThickness ??
        r.weight ??
        r.thickness ??
        r.gsm
    ),
    quantity: show(r.quantity ?? r.qty ?? r.amount),
    budget: show(r.budget ?? r.price ?? r.target_budget ?? r.targetBudget),
  };
}

function formatStatus(status: string) {
  if (status === "in_progress") return "In Progress";
  if (status === "quoted") return "Quoted";
  if (status === "completed") return "Completed";
  return "New";
}

export default function Home() {
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultRaw, setResultRaw] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [buyerQuotes, setBuyerQuotes] = useState<any[]>([]);
  const [lookupId, setLookupId] = useState("");
  const [loadedRequest, setLoadedRequest] = useState<any>(null);

  const spec: FabricSpec | null = useMemo(() => {
    if (!resultRaw) return null;
    if (typeof resultRaw === "string") return normalizeSpec({});
    return normalizeSpec(resultRaw);
  }, [resultRaw]);

  function matchSupplier(fabricType: string) {
    const ft = (fabricType || "").toLowerCase();
    return suppliers.filter((s) =>
      ft.includes(String(s.specialization).toLowerCase())
    );
  }

  const matchedSuppliers = useMemo(() => {
    if (!spec) return [];
    return matchSupplier(spec.fabric_type);
  }, [spec]);

  async function fetchQuotesForRequest(id: string) {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("request_id", id);

    if (error) {
      console.warn("Failed to fetch quotes:", error);
      return;
    }

    setBuyerQuotes(data || []);
  }

  async function loadRequestById() {
    if (!lookupId.trim()) {
      alert("Please enter your request ID");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: request, error } = await supabase
      .from("fabric_requests")
      .select("*")
      .eq("id", lookupId.trim())
      .single();

    if (error || !request) {
      setLoading(false);
      alert("Request not found");
      return;
    }

    setLoadedRequest(request);
    setResultRaw(request.ai_output);
    setRequestId(request.id);
    setSubmittedName(request.client_name || "");
    setEmail(request.client_email || "");
    setPhone(request.client_phone || "");

    const { data: quotesData, error: quotesError } = await supabase
      .from("quotes")
      .select("*")
      .eq("request_id", request.id);

    if (quotesError) {
      console.warn("Failed to load quotes:", quotesError);
      setBuyerQuotes([]);
    } else {
      setBuyerQuotes(quotesData || []);
    }

    setLoading(false);
  }

  async function submitRequest() {
    if (!input.trim() || !name.trim()) {
      alert("Please enter your name and fabric request");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Analyze API failed");
      }

      const aiResult = data?.result ?? data;

      setResultRaw(aiResult);
      setSubmittedName(name.trim());
      setLoadedRequest(null);
      setBuyerQuotes([]);

      const payload = {
        user_input: input.trim(),
        ai_output: aiResult,
        client_name: name.trim(),
        client_email: email.trim(),
        client_phone: phone.trim(),
        status: "new",
      };

      const { data: insertedRequest, error: insertError } = await supabase
        .from("fabric_requests")
        .insert(payload)
        .select()
        .single();

      if (insertError || !insertedRequest) {
        alert("Failed to save request");
        return;
      }

      setRequestId(insertedRequest.id);
      setLoadedRequest(insertedRequest);
      await fetchQuotesForRequest(insertedRequest.id);

      setInput("");
      setName("");
      setEmail("");
      setPhone("");
      setLookupId("");
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function saveSpecificationPlaceholder() {
    alert("Saved for later (placeholder)");
  }

  function downloadPDFPlaceholder() {
    alert("Download PDF (placeholder). We'll connect real PDF next.");
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
              color: "#111",
              fontWeight: "bold",
            }}
          >
            Home
          </a>
          <a
            href="/history"
            style={{
              textDecoration: "none",
              color: "#1a73e8",
              fontWeight: "bold",
            }}
          >
            History
          </a>
        </div>
      </nav>

      <div
        style={{
          marginBottom: 30,
          padding: 24,
          border: "1px solid #eee",
          borderRadius: 12,
          backgroundColor: "#fafafa",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>
          AI-powered fabric sourcing for serious buyers.
        </h1>

        <p style={{ margin: 0, color: "#555", lineHeight: 1.6 }}>
          Describe what you need → get a professional fabric specification →
          connect with trusted suppliers in China.
        </p>

        <p style={{ marginTop: 10, fontWeight: "bold", color: "#111" }}>
          Used by fabric buyers sourcing from China to Africa.
        </p>
      </div>

      <div
        style={{
          marginBottom: 30,
          padding: 20,
          border: "1px solid #eee",
          borderRadius: 12,
          backgroundColor: "#ffffff",
        }}
      >
        <p style={{ margin: 0, fontStyle: "italic", color: "#333" }}>
          “Weinly helped me clearly describe the exact fabric I needed. Normally
          I struggle explaining to suppliers, but this made it easier and more
          direct.”
        </p>

        <p style={{ marginTop: 10, fontWeight: "bold" }}>— Ada</p>
      </div>

      <div
        style={{
          marginBottom: 30,
          padding: 20,
          border: "1px solid #eee",
          borderRadius: 12,
          backgroundColor: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0 }}>How Weinly works</h2>

        <ul style={{ paddingLeft: 20, color: "#555", lineHeight: 1.8 }}>
          <li>Describe the fabric you need</li>
          <li>Weinly generates a clear, supplier-ready specification</li>
          <li>Receive quotes and connect with verified suppliers</li>
        </ul>
      </div>

      <div
        style={{
          marginBottom: 30,
          padding: 20,
          border: "1px solid #eee",
          borderRadius: 12,
          backgroundColor: "#ffffff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Start a Fabric Request</h2>
        <p style={{ color: "#555" }}>
          Tell us what fabric you need and Weinly will turn it into a
          professional sourcing specification.
        </p>

        <p style={{ marginBottom: 10, color: "#555" }}>
          Tip: Include fabric type, use, color, quality, and budget if possible.
        </p>

        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 14,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 12,
          }}
        />

        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <input
          type="text"
          placeholder="Your WhatsApp or phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder={`Describe the fabric you need.
Example: Lace for wedding gowns, premium quality, white, lightweight, for hot weather.`}
          style={{
            width: "100%",
            padding: 14,
            fontSize: 14,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <div style={{ marginTop: 10 }}>
          <p style={{ fontWeight: "bold", marginBottom: 8 }}>Examples:</p>

          <p
            style={{ cursor: "pointer", color: "#4CAF50", margin: "6px 0" }}
            onClick={() =>
              setInput(
                "Lace fabric for wedding gowns, premium quality, white, lightweight"
              )
            }
          >
            Lace for wedding gowns (premium, white, lightweight)
          </p>

          <p
            style={{ cursor: "pointer", color: "#4CAF50", margin: "6px 0" }}
            onClick={() =>
              setInput(
                "Cotton fabric for men’s shirts, breathable, affordable, for hot weather"
              )
            }
          >
            Cotton for shirts (breathable, budget-friendly)
          </p>
        </div>

        <button
          onClick={submitRequest}
          disabled={loading}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "12px 25px",
            marginTop: 14,
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          {loading ? "Analyzing..." : "Analyze Fabric"}
        </button>
      </div>

      <div
        style={{
          marginBottom: 30,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          backgroundColor: "#fafafa",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Check Existing Request</h3>
        <p style={{ color: "#555", marginBottom: 10 }}>
          Enter your saved request ID to view your request, status, and supplier
          quotes.
        </p>

        <input
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
          placeholder="Enter your request ID"
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={loadRequestById}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Load Request
        </button>
      </div>

      {error && <p style={{ marginTop: 10, color: "crimson" }}>{error}</p>}

      {(resultRaw || requestId || buyerQuotes.length > 0 || loadedRequest) && (
        <div style={{ marginTop: 30 }}>
          <h2>Your Request Result</h2>
        </div>
      )}

      {spec && (
        <div
          style={{
            marginTop: 20,
            padding: 22,
            border: "2px solid #4CAF50",
            borderRadius: 10,
            backgroundColor: "#f9fff9",
          }}
        >
          <p style={{ color: "green", fontWeight: "bold", marginBottom: 8 }}>
            ✔ Fabric identified successfully
          </p>

          <p style={{ marginBottom: 10 }}>
            Request by: <strong>{submittedName || "Anonymous"}</strong>
          </p>

          {loadedRequest && (
            <p style={{ marginBottom: 10, color: "#555", fontSize: 14 }}>
              Loaded from existing request
            </p>
          )}

          <h3 style={{ marginTop: 0 }}>Fabric Specification</h3>

          <div style={{ lineHeight: 1.9 }}>
            <div>
              <strong>Fabric Type:</strong> {spec.fabric_type}
            </div>
            <div>
              <strong>Intended Use:</strong> {spec.intended_use}
            </div>
            <div>
              <strong>Quality Level:</strong> {spec.quality_level}
            </div>
            <div>
              <strong>Color / Pattern:</strong> {spec.color_or_pattern}
            </div>
            <div>
              <strong>Weight / Thickness:</strong> {spec.weight_or_thickness}
            </div>
            <div>
              <strong>Quantity:</strong> {spec.quantity}
            </div>
            <div>
              <strong>Budget:</strong> {spec.budget}
            </div>
          </div>

          <p style={{ marginTop: 10, fontStyle: "italic" }}>
            This specification is ready to be shared with verified suppliers.
          </p>

          <p style={{ color: "#4CAF50", fontWeight: "bold", marginTop: 8 }}>
            Confidence Level: High
          </p>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={saveSpecificationPlaceholder}
              style={{
                backgroundColor: "#2196F3",
                color: "white",
                padding: "8px 14px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save Specification
            </button>

            <button
              onClick={downloadPDFPlaceholder}
              style={{
                backgroundColor: "#555",
                color: "white",
                padding: "8px 14px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Download PDF
            </button>
          </div>

          <h3 style={{ marginTop: 24 }}>Matched Suppliers</h3>

          {matchedSuppliers.length === 0 ? (
            <p style={{ color: "#666" }}>No verified suppliers matched yet.</p>
          ) : (
            matchedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  marginTop: 12,
                  padding: 14,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "white",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{s.name}</div>
                <div style={{ color: "#555", marginTop: 4 }}>
                  {s.specialization} • {s.location} • ⭐ {s.trust_score}
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() =>
                      alert(
                        `We can help you connect with ${s.name} and handle your order from China. Message us to proceed.`
                      )
                    }
                    style={{
                      backgroundColor: "#FF9800",
                      color: "white",
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Contact Supplier
                  </button>
                </div>
              </div>
            ))
          )}

          <p style={{ marginTop: 20, fontWeight: "bold", color: "#4CAF50" }}>
            ✔ Your fabric specification is ready and matched with trusted
            suppliers! You can now request samples or save this specification
            for later.
          </p>

          {buyerQuotes.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <h3>Supplier Quotes</h3>

              {buyerQuotes.map((quote) => (
                <div
                  key={quote.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: 16,
                    marginTop: 12,
                    borderRadius: 10,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: "bold", fontSize: 16 }}>
                    {quote.supplier_name}
                  </p>
                  <p style={{ margin: "8px 0" }}>
                    <strong>Price:</strong> {quote.price}
                  </p>
                  <p style={{ margin: "8px 0" }}>
                    <strong>MOQ:</strong> {quote.moq}
                  </p>
                  <p style={{ margin: "8px 0" }}>
                    <strong>Note:</strong> {quote.note}
                  </p>
                </div>
              ))}
            </div>
          )}

          {requestId && buyerQuotes.length === 0 && (
            <div
              style={{
                marginTop: 20,
                padding: 14,
                border: "1px solid #eee",
                borderRadius: 8,
                backgroundColor: "#fff",
              }}
            >
              <p style={{ margin: 0, color: "#666" }}>
                No supplier quotes yet. Please check back later or contact
                support.
              </p>
            </div>
          )}

          {requestId && (
            <div
              style={{
                marginTop: 20,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 8,
                backgroundColor: "#fafafa",
              }}
            >
              <p>
                <strong>Your Request ID:</strong> {requestId}
              </p>
              <p style={{ fontSize: 14, color: "#555" }}>
                Save this ID so you can check your request and quotes later.
              </p>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(requestId);
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
            </div>
          )}

          {loadedRequest?.status && (
            <div
              style={{
                marginTop: 20,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 8,
                backgroundColor:
                  loadedRequest.status === "completed"
                    ? "#e8f5e9"
                    : loadedRequest.status === "quoted"
                    ? "#fff8e1"
                    : loadedRequest.status === "in_progress"
                    ? "#e3f2fd"
                    : "#f5f5f5",
              }}
            >
              <p>
                <strong>Request Status:</strong>{" "}
                {formatStatus(loadedRequest.status)}
              </p>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 40,
          padding: 20,
          border: "1px solid #eee",
          borderRadius: 12,
          backgroundColor: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Why Weinly</h2>

        <ul style={{ paddingLeft: 20, color: "#555", lineHeight: 1.8 }}>
          <li>Eliminate confusion when describing fabrics</li>
          <li>Avoid costly sourcing mistakes</li>
          <li>Communicate professionally with suppliers</li>
          <li>Track requests, quotes, and progress in one place</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 20,
          border: "1px solid #eee",
          borderRadius: 12,
          backgroundColor: "#ffffff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Need help with sourcing?</h3>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          If you want support with supplier selection, quote review, or direct
          sourcing assistance, contact the Weinly team.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Email:</strong> support@weinly.com
        </p>
      </div>

      <div
        style={{
          marginTop: 30,
          padding: 20,
          borderRadius: 12,
          backgroundColor: "#111",
          color: "white",
          textAlign: "center",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Ready to source fabrics the right way?</h3>

        <p style={{ marginBottom: 10 }}>
          Start your request now and get a clear specification in seconds.
        </p>
      </div>

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