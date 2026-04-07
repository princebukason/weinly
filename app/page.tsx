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
  successBg: "#ECFDF5",
  successBorder: "#A7F3D0",
  warningBg: "#FFFBEB",
  infoBg: "#EFF6FF",
  completedBg: "#ECFDF5",
  quotedBg: "#FFFBEB",
  progressBg: "#EFF6FF",
  newBg: "#F3F4F6",
  shadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
  shadowSoft: "0 4px 14px rgba(17, 24, 39, 0.06)",
};

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [buyerQuotes, setBuyerQuotes] = useState<any[]>([]);
  const [lookupId, setLookupId] = useState("");
  const [loadedRequest, setLoadedRequest] = useState<any>(null);

  function formatStatus(status: string) {
    if (status === "in_progress") return "In Progress";
    if (status === "quoted") return "Quoted";
    if (status === "completed") return "Completed";
    return "New";
  }

  function getStatusBackground(status: string) {
    if (status === "completed") return COLORS.completedBg;
    if (status === "quoted") return COLORS.quotedBg;
    if (status === "in_progress") return COLORS.progressBg;
    return COLORS.newBg;
  }

  async function fetchQuotesForRequest(id: string) {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("request_id", id);

    if (!error) {
      setBuyerQuotes(data || []);
    }
  }

  async function submitRequest() {
    if (!name || !email || !phone || !input) {
      alert("Please fill in your name, email, phone number, and fabric request.");
      return;
    }

    setLoading(true);
    setBuyerQuotes([]);
    setLoadedRequest(null);
    setRequestId(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();
      setResult(data.result);

      const { data: insertedRequest, error } = await supabase
        .from("fabric_requests")
        .insert({
          user_input: input,
          ai_output: data.result,
          client_name: name,
          client_email: email,
          client_phone: phone,
        })
        .select()
        .single();

      if (error) {
        alert("Failed to save request");
        setLoading(false);
        return;
      }

      setRequestId(insertedRequest.id);
      setLoadedRequest(insertedRequest);
      await fetchQuotesForRequest(insertedRequest.id);
    } catch (error) {
      alert("Something went wrong while submitting your request.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRequestById() {
    if (!lookupId) {
      alert("Please enter your request ID");
      return;
    }

    const { data: request, error } = await supabase
      .from("fabric_requests")
      .select("*")
      .eq("id", lookupId)
      .single();

    if (error || !request) {
      alert("Request not found");
      return;
    }

    setLoadedRequest(request);
    setResult(request.ai_output);
    setRequestId(request.id);

    const { data: quotesData } = await supabase
      .from("quotes")
      .select("*")
      .eq("request_id", request.id);

    setBuyerQuotes(quotesData || []);
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
          marginBottom: 12,
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

  function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
      <textarea
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
          resize: "vertical",
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
          width: "100%",
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
              color: COLORS.text,
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
              color: COLORS.primary,
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
            Built for serious buyers sourcing from China to Africa
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
            AI-powered fabric sourcing platform.
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
            Describe your fabric → get a professional specification → receive
            quotes from verified suppliers in China.
          </p>

          <p
            style={{
              marginTop: 16,
              fontWeight: 700,
              color: COLORS.primary,
              fontSize: 15,
            }}
          >
            Trusted by fabric buyers and sourcing clients across Africa.
          </p>

          <p
            style={{
              marginTop: 12,
              color: "#374151",
              lineHeight: 1.75,
              maxWidth: 720,
            }}
          >
            Weinly combines AI technology with real sourcing expertise on the
            ground in China to ensure accuracy, reliability, and quality.
          </p>

          <p
            style={{
              marginTop: 14,
              color: COLORS.accent,
              fontWeight: 700,
            }}
          >
            We are currently onboarding a limited number of buyers to ensure
            quality service.
          </p>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "stretch",
            }}
          >
            <a
              href="#request-form"
              style={{
                backgroundColor: COLORS.primary,
                color: "#fff",
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: 12,
                fontWeight: 700,
                boxShadow: "0 6px 18px rgba(15, 118, 110, 0.22)",
                flex: "1 1 220px",
                textAlign: "center",
              }}
            >
              Start a Request
            </a>

            <a
              href="/history"
              style={{
                backgroundColor: "#fff",
                color: COLORS.text,
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: 12,
                fontWeight: 700,
                border: `1px solid ${COLORS.border}`,
                flex: "1 1 220px",
                textAlign: "center",
              }}
            >
              View Previous Requests
            </a>
          </div>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Clear specifications
          </div>
          <div style={{ color: COLORS.subtext, lineHeight: 1.7, fontSize: 14 }}>
            Turn vague ideas into supplier-ready fabric requests.
          </div>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Verified suppliers
          </div>
          <div style={{ color: COLORS.subtext, lineHeight: 1.7, fontSize: 14 }}>
            Receive quotes from trusted suppliers, not random guesses.
          </div>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Track everything</div>
          <div style={{ color: COLORS.subtext, lineHeight: 1.7, fontSize: 14 }}>
            Keep request IDs, statuses, and quotes in one place.
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <p
          style={{
            margin: 0,
            fontStyle: "italic",
            color: "#374151",
            lineHeight: 1.8,
            fontSize: 16,
          }}
        >
          “Weinly helped me clearly describe the exact fabric I needed.
          Normally I struggle explaining to suppliers, but this made it easier
          and more direct.”
        </p>

        <p style={{ marginTop: 14, fontWeight: 800, color: COLORS.text }}>— Ada</p>
      </Card>

      <Card style={{ marginBottom: 20, backgroundColor: COLORS.softBg }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>How Weinly Works</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
          }}
        >
          {[
            "Submit your fabric request",
            "Weinly generates a supplier-ready specification",
            "Our sourcing team reviews your request",
            "Verified suppliers submit quotes",
            "You receive the best options",
          ].map((step, index) => (
            <div
              key={step}
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  backgroundColor: COLORS.primary,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {index + 1}
              </div>
              <div
                style={{ color: COLORS.text, lineHeight: 1.7, fontSize: 14 }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <Card>
          <div id="request-form" />
          <h2 style={{ marginTop: 0 }}>Start a Fabric Request</h2>
          <p style={{ color: COLORS.subtext, lineHeight: 1.7 }}>
            Tell us what fabric you need and Weinly will turn it into a
            professional sourcing specification.
          </p>

          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Your WhatsApp or phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div
            style={{
              marginBottom: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: COLORS.softBg,
              color: COLORS.subtext,
              lineHeight: 1.7,
              fontSize: 14,
            }}
          >
            Tip: Include fabric type, use, color, quality, and budget if
            possible.
          </div>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={7}
            placeholder="Describe the fabric you need. Example: Lace for wedding gowns, premium quality, white, lightweight, for hot weather."
            style={{ marginBottom: 12 }}
          />

          <div
            style={{
              marginBottom: 18,
              backgroundColor: "#F8FAFC",
              border: `1px dashed ${COLORS.border}`,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <p style={{ fontWeight: 700, marginTop: 0, marginBottom: 10 }}>
              Example requests
            </p>

            <p
              style={{
                cursor: "pointer",
                color: COLORS.primary,
                margin: "8px 0",
                lineHeight: 1.7,
              }}
              onClick={() =>
                setInput(
                  "Lace fabric for wedding gowns, premium quality, white, lightweight"
                )
              }
            >
              Lace for wedding gowns (premium, white, lightweight)
            </p>

            <p
              style={{
                cursor: "pointer",
                color: COLORS.primary,
                margin: "8px 0 0",
                lineHeight: 1.7,
              }}
              onClick={() =>
                setInput(
                  "Cotton fabric for men’s shirts, breathable, affordable, for hot weather"
                )
              }
            >
              Cotton for shirts (breathable, budget-friendly)
            </p>
          </div>

          <PrimaryButton onClick={submitRequest} disabled={loading}>
            {loading ? "Analyzing..." : "Submit Request"}
          </PrimaryButton>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ backgroundColor: COLORS.softBg }}>
            <h3 style={{ marginTop: 0 }}>Check Existing Request</h3>
            <p
              style={{
                color: COLORS.subtext,
                marginBottom: 12,
                lineHeight: 1.7,
              }}
            >
              Enter your saved request ID to view your request, status, and
              supplier quotes.
            </p>

            <Input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Enter your request ID"
              style={{ marginBottom: 12 }}
            />

            <PrimaryButton onClick={loadRequestById}>Load Request</PrimaryButton>
          </Card>

          <Card>
            <h3 style={{ marginTop: 0 }}>Why trust Weinly?</h3>
            <ul
              style={{
                paddingLeft: 20,
                color: COLORS.subtext,
                lineHeight: 1.9,
                marginBottom: 0,
              }}
            >
              <li>Reduce costly sourcing mistakes</li>
              <li>Work with verified suppliers</li>
              <li>Clear communication before ordering</li>
              <li>Real sourcing support from China</li>
            </ul>
          </Card>

          <Card>
            <h3 style={{ marginTop: 0 }}>Need direct sourcing support?</h3>
            <p style={{ color: COLORS.subtext, lineHeight: 1.7 }}>
              Our team can assist you with supplier selection, negotiation, and
              order handling.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong>Email:</strong> support@weinly.com
            </p>
            <a
              href="https://wa.me/2348130630046"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "12px 16px",
                borderRadius: 12,
                backgroundColor: COLORS.primary,
                color: "white",
                textDecoration: "none",
                fontWeight: 700,
                textAlign: "center",
                width: "100%",
              }}
            >
              Chat with us on WhatsApp
            </a>
          </Card>
        </div>
      </div>

      {(result || requestId || buyerQuotes.length > 0 || loadedRequest) && (
        <div style={{ marginTop: 28, marginBottom: 16 }}>
          <h2 style={{ marginBottom: 0 }}>Your Request Result</h2>
        </div>
      )}

      {result && (
        <Card
          style={{
            marginBottom: 20,
            backgroundColor: COLORS.successBg,
            border: `1px solid ${COLORS.successBorder}`,
          }}
        >
          <p style={{ color: COLORS.primary, fontWeight: 800, marginTop: 0 }}>
            ✔ Fabric identified successfully
          </p>

          <h3>Fabric Specification</h3>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 14,
              border: `1px solid ${COLORS.border}`,
              lineHeight: 1.7,
              overflowX: "auto",
            }}
          >
            {typeof result === "string"
              ? result
              : JSON.stringify(result, null, 2)}
          </pre>

          <p style={{ marginTop: 14, fontStyle: "italic", color: "#374151" }}>
            This specification is ready to be shared with verified suppliers.
          </p>

          <p style={{ color: COLORS.primary, fontWeight: 800, marginBottom: 0 }}>
            Confidence Level: High
          </p>
        </Card>
      )}

      {requestId && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ marginTop: 0 }}>
            <strong>Your Request ID:</strong> {requestId}
          </p>
          <p style={{ fontSize: 14, color: COLORS.subtext, lineHeight: 1.7 }}>
            Save this ID so you can check your request and quotes later.
          </p>

          <PrimaryButton
            onClick={() => {
              navigator.clipboard.writeText(requestId);
              alert("Request ID copied!");
            }}
            style={{ marginTop: 6, maxWidth: 220 }}
          >
            Copy Request ID
          </PrimaryButton>
        </Card>
      )}

      {requestId && (
        <Card style={{ marginBottom: 20, backgroundColor: COLORS.infoBg }}>
          <p style={{ margin: 0, lineHeight: 1.7, fontWeight: 700 }}>
            Your request has been received.
          </p>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: COLORS.subtext,
              lineHeight: 1.8,
            }}
          >
            Our sourcing team is reviewing your request and matching you with
            verified suppliers. You will start receiving quotes shortly.
          </p>
        </Card>
      )}

      {loadedRequest?.status && (
        <Card
          style={{
            marginBottom: 20,
            backgroundColor: getStatusBackground(loadedRequest.status),
          }}
        >
          <p style={{ marginTop: 0 }}>
            <strong>Request Status:</strong>{" "}
            {formatStatus(loadedRequest.status)}
          </p>

          <div
            style={{ marginTop: 10, color: COLORS.subtext, lineHeight: 1.8 }}
          >
            <p style={{ margin: "4px 0", fontWeight: 700 }}>Status Guide</p>
            <p style={{ margin: "4px 0" }}>New → Request received</p>
            <p style={{ margin: "4px 0" }}>
              In Progress → Being reviewed by sourcing team
            </p>
            <p style={{ margin: "4px 0" }}>
              Quoted → Supplier quotes available
            </p>
            <p style={{ margin: "4px 0" }}>Completed → Order finalized</p>
          </div>
        </Card>
      )}

      {buyerQuotes.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>Quotes from Verified Suppliers</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginTop: 12,
            }}
          >
            {buyerQuotes.map((quote) => (
              <Card key={quote.id} style={{ padding: 20 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: 17,
                    color: COLORS.text,
                  }}
                >
                  {quote.supplier_name}
                </p>
                <div
                  style={{
                    marginTop: 14,
                    color: COLORS.subtext,
                    lineHeight: 1.8,
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
              </Card>
            ))}
          </div>
        </div>
      )}

      {requestId && buyerQuotes.length === 0 && (
        <Card style={{ marginTop: 20 }}>
          <p style={{ margin: 0, color: COLORS.subtext }}>
            No supplier quotes yet. Please check back later or contact support.
          </p>
        </Card>
      )}

      <div
        style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        <Card style={{ backgroundColor: COLORS.softBg }}>
          <h3 style={{ marginTop: 0 }}>Why buyers use Weinly</h3>
          <ul
            style={{
              paddingLeft: 20,
              color: COLORS.subtext,
              lineHeight: 1.9,
            }}
          >
            <li>Get clear fabric specifications before contacting suppliers</li>
            <li>Track requests, quotes, and status in one place</li>
            <li>Reduce sourcing mistakes and communicate more professionally</li>
          </ul>
        </Card>

        <Card
          style={{
            backgroundColor: COLORS.text,
            color: "#fff",
            border: "none",
            boxShadow: COLORS.shadow,
          }}
        >
          <h3 style={{ marginTop: 0, color: "#fff" }}>
            Ready to source fabrics the right way?
          </h3>

          <p style={{ color: "#D1D5DB", lineHeight: 1.8 }}>
            Start your request now and get a clear specification in seconds.
          </p>

          <a
            href="#request-form"
            style={{
              display: "inline-block",
              marginTop: 8,
              backgroundColor: COLORS.accent,
              color: "#fff",
              textDecoration: "none",
              padding: "12px 16px",
              borderRadius: 12,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Start Now
          </a>
        </Card>
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
        © {new Date().getFullYear()} Weinly. AI-powered fabric sourcing.
      </footer>
    </main>
  );
}