"use client";

import { useEffect, useMemo, useState } from "react";
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
  ai_output: string | null;
  status: string | null;
  internal_note: string | null;
  buyer_requested_contact: boolean | null;
  contact_request_status: string | null;
  contact_access_fee: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  payment_proof_url: string | null;
  payment_proof_name: string | null;
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

export default function HomePage() {
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [requestId, setRequestId] = useState("");
  const [lookupId, setLookupId] = useState("");

  const [submittedRequest, setSubmittedRequest] = useState<FabricRequest | null>(null);
  const [submittedQuotes, setSubmittedQuotes] = useState<Quote[]>([]);
  const [lookupRequest, setLookupRequest] = useState<FabricRequest | null>(null);
  const [lookupQuotes, setLookupQuotes] = useState<Quote[]>([]);

  const [paymentReferenceInput, setPaymentReferenceInput] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  async function generateAISpec(userInput: string) {
    try {
      const res = await fetch("/api/spec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: userInput }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data?.output || null;
    } catch (error) {
      console.error("AI spec generation failed:", error);
      return null;
    }
  }

  async function fetchQuotesByRequestId(id: string) {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("request_id", id)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return (data || []) as Quote[];
  }

  async function fetchRequestById(id: string) {
    const { data, error } = await supabase
      .from("fabric_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data as FabricRequest;
  }

  async function syncActiveRequestState(id: string) {
    const refreshed = await fetchRequestById(id);
    const quotes = await fetchQuotesByRequestId(id);

    setLookupRequest(refreshed);
    setLookupQuotes(quotes);

    if (submittedRequest?.id === id) {
      setSubmittedRequest(refreshed);
      setSubmittedQuotes(quotes);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim()) {
      alert("Please describe the fabric you need.");
      return;
    }

    setLoading(true);
    setSubmittedRequest(null);
    setSubmittedQuotes([]);

    try {
      const aiOutput = await generateAISpec(description.trim());

      const { data, error } = await supabase
        .from("fabric_requests")
        .insert([
          {
            client_name: clientName || null,
            client_email: clientEmail || null,
            client_phone: clientPhone || null,
            user_input: description.trim(),
            ai_output: aiOutput,
            status: "submitted",
            buyer_requested_contact: false,
            contact_request_status: "none",
            payment_status: "unpaid",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSubmittedRequest(data as FabricRequest);
      setRequestId(data.id);
      setLookupId(data.id);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while submitting your request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup(id?: string) {
    const cleanId = (id ?? lookupId).trim();

    if (!cleanId) {
      alert("Enter a request ID.");
      return;
    }

    setLookupLoading(true);
    setLookupRequest(null);
    setLookupQuotes([]);

    try {
      const request = await fetchRequestById(cleanId);
      if (!request) {
        alert("Request not found.");
        return;
      }

      const quotes = await fetchQuotesByRequestId(cleanId);
      setLookupRequest(request);
      setLookupQuotes(quotes);

      setPaymentReferenceInput(request.payment_reference || "");
      setPaymentProofFile(null);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch request.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function requestSupplierContact(requestId: string) {
    try {
      const { error } = await supabase
        .from("fabric_requests")
        .update({
          buyer_requested_contact: true,
          contact_request_status: "pending",
          payment_status: "unpaid",
          contact_access_fee: "¥299",
        })
        .eq("id", requestId);

      if (error) throw error;

      await syncActiveRequestState(requestId);
      alert("Contact request submitted. Complete payment to continue.");
    } catch (error) {
      console.error(error);
      alert("Failed to request supplier contact.");
    }
  }

  async function uploadPaymentProof(requestId: string, file: File) {
    const safeName = file.name.replace(/\s+/g, "-");
    const filePath = `${requestId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);

    return {
      publicUrl: data.publicUrl,
      fileName: file.name,
    };
  }

  async function submitPaymentProof(requestId: string) {
    if (!paymentReferenceInput.trim()) {
      alert("Enter your payment reference.");
      return;
    }

    if (!paymentProofFile) {
      alert("Upload your payment proof.");
      return;
    }

    setPaymentSubmitting(true);

    try {
      const uploaded = await uploadPaymentProof(requestId, paymentProofFile);

      const { error } = await supabase
        .from("fabric_requests")
        .update({
          payment_status: "pending",
          payment_reference: paymentReferenceInput.trim(),
          payment_proof_url: uploaded.publicUrl,
          payment_proof_name: uploaded.fileName,
        })
        .eq("id", requestId);

      if (error) throw error;

      await syncActiveRequestState(requestId);
      setPaymentProofFile(null);

      alert("Payment proof submitted for review.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit payment proof.");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  useEffect(() => {
    if (!requestId) return;

    async function refreshSubmittedData() {
      const request = await fetchRequestById(requestId);
      const quotes = await fetchQuotesByRequestId(requestId);
      setSubmittedRequest(request);
      setSubmittedQuotes(quotes);

      if (request?.payment_reference) {
        setPaymentReferenceInput(request.payment_reference);
      }
    }

    refreshSubmittedData();
  }, [requestId]);

  const activeRequest = useMemo(() => {
    return lookupRequest || submittedRequest;
  }, [lookupRequest, submittedRequest]);

  const activeQuotes = useMemo(() => {
    return lookupRequest ? lookupQuotes : submittedQuotes;
  }, [lookupRequest, lookupQuotes, submittedQuotes]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 16px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <section style={heroCardStyle}>
          <div style={{ marginBottom: 22 }}>
            <div style={badgeStyle}>WEINLY</div>

            <h1 style={heroTitleStyle}>
              AI-powered fabric sourcing for serious buyers.
            </h1>

            <p style={heroTextStyle}>
              Describe the fabric you need, get a professional sourcing request,
              receive supplier quotes from trusted partners in China, then unlock
              supplier contact through controlled payment and approval.
            </p>
          </div>

          <div style={featureGridStyle}>
            <div style={featureCardStyle}>
              <strong style={featureTitleStyle}>Professional request formatting</strong>
              <span style={featureTextStyle}>
                Turn rough descriptions into structured sourcing specs.
              </span>
            </div>

            <div style={featureCardStyle}>
              <strong style={featureTitleStyle}>Verified supplier quoting</strong>
              <span style={featureTextStyle}>
                Receive quotes before any supplier contact is released.
              </span>
            </div>

            <div style={featureCardStyle}>
              <strong style={featureTitleStyle}>Monetized access control</strong>
              <span style={featureTextStyle}>
                Proceed, upload proof, get approved, then reveal supplier contact.
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={formTopGridStyle}>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
              <input
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Your email"
                type="email"
                style={inputStyle}
              />
              <input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="WhatsApp / phone"
                style={inputStyle}
              />
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the fabric you need. Example: premium beaded lace for wedding asoebi, navy blue, soft handfeel, 5-yard packs, high-end quality..."
              rows={7}
              style={{
                ...inputStyle,
                resize: "vertical",
                width: "100%",
                marginBottom: 14,
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...darkButtonStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit fabric request"}
            </button>
          </form>

          <div style={trackerCardStyle}>
            <strong style={{ display: "block", marginBottom: 8, color: "#0f172a" }}>
              Already submitted a request?
            </strong>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter your request ID"
                style={{ ...inputStyle, flex: 1, minWidth: 260 }}
              />
              <button
                onClick={() => handleLookup()}
                disabled={lookupLoading}
                style={{
                  ...blueButtonStyle,
                  opacity: lookupLoading ? 0.7 : 1,
                  cursor: lookupLoading ? "not-allowed" : "pointer",
                }}
              >
                {lookupLoading ? "Loading..." : "Track request"}
              </button>
            </div>
          </div>
        </section>

        {submittedRequest && (
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Request submitted successfully</h2>
            <p style={mutedText}>Save this request ID so you can track quotes later.</p>

            <div style={infoBoxStyle}>
              <div style={{ marginBottom: 6 }}>
                <strong>Request ID:</strong> {submittedRequest.id}
              </div>
              <div>
                <strong>Status:</strong> {submittedRequest.status || "submitted"}
              </div>
            </div>

            {submittedRequest.ai_output && (
              <div style={specBoxStyle}>
                <h3 style={smallTitle}>AI sourcing spec</h3>
                <p style={preWrapText}>{submittedRequest.ai_output}</p>
              </div>
            )}
          </section>
        )}

        {activeRequest && (
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <div>
                <h2 style={sectionTitle}>Request tracker</h2>
                <p style={mutedText}>
                  Follow your request, review quotes, upload payment proof, and unlock supplier contact.
                </p>
              </div>

              <div style={infoPillStyle}>
                Contact request: <strong>{activeRequest.contact_request_status || "none"}</strong>
              </div>
            </div>

            <div style={infoGridStyle}>
              <div style={infoBoxStyle}>
                <strong>Request ID</strong>
                <div style={smallMuted}>{activeRequest.id}</div>
              </div>

              <div style={infoBoxStyle}>
                <strong>Buyer</strong>
                <div style={smallMuted}>{activeRequest.client_name || "Not provided"}</div>
              </div>

              <div style={infoBoxStyle}>
                <strong>Status</strong>
                <div style={smallMuted}>{activeRequest.status || "submitted"}</div>
              </div>

              <div style={infoBoxStyle}>
                <strong>Payment</strong>
                <div style={smallMuted}>{activeRequest.payment_status || "unpaid"}</div>
              </div>
            </div>

            <div style={specBoxStyle}>
              <h3 style={smallTitle}>Fabric request</h3>
              <p style={preWrapText}>{activeRequest.user_input}</p>
            </div>

            {activeRequest.ai_output && (
              <div style={specBoxStyle}>
                <h3 style={smallTitle}>AI sourcing spec</h3>
                <p style={preWrapText}>{activeRequest.ai_output}</p>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <h3 style={smallTitle}>Supplier quotes</h3>

              {activeQuotes.length === 0 ? (
                <div style={emptyStateStyle}>
                  No quotes yet. Your request has been received and is waiting for supplier pricing.
                </div>
              ) : (
                activeQuotes.map((quote) => {
                  const isReleased = !!quote.is_contact_released;
                  const contactStatus = activeRequest.contact_request_status || "none";
                  const paymentStatus = activeRequest.payment_status || "unpaid";

                  return (
                    <div key={quote.id} style={quoteCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <h4 style={{ margin: 0, color: "#0f172a", fontSize: 18 }}>
                            {quote.supplier_name || "Verified Supplier"}
                          </h4>
                          <div style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
                            {quote.supplier_region || "China"} · Verified sourcing partner
                          </div>
                        </div>

                        <div
                          style={{
                            alignSelf: "start",
                            background: isReleased ? "#dcfce7" : "#eff6ff",
                            color: isReleased ? "#166534" : "#1d4ed8",
                            borderRadius: 999,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {isReleased ? "Contact released" : "Protected contact"}
                        </div>
                      </div>

                      <div style={quoteGridStyle}>
                        <div style={miniBoxStyle}>
                          <strong>Price</strong>
                          <div style={smallMuted}>{quote.price || "Pending"}</div>
                        </div>
                        <div style={miniBoxStyle}>
                          <strong>MOQ</strong>
                          <div style={smallMuted}>{quote.moq || "Pending"}</div>
                        </div>
                        <div style={miniBoxStyle}>
                          <strong>Lead time</strong>
                          <div style={smallMuted}>{quote.lead_time || "Not added yet"}</div>
                        </div>
                      </div>

                      {quote.note && (
                        <div style={{ marginTop: 12 }}>
                          <strong style={{ color: "#0f172a" }}>Supplier note</strong>
                          <p style={{ ...preWrapText, marginTop: 6 }}>{quote.note}</p>
                        </div>
                      )}

                      {!isReleased && contactStatus === "none" && (
                        <div style={protectedBoxStyle}>
                          <p style={{ margin: "0 0 10px 0", color: "#334155" }}>
                            Supplier contact is protected. Click proceed to request access.
                          </p>
                          <button
                            onClick={() => requestSupplierContact(activeRequest.id)}
                            style={darkButtonStyle}
                          >
                            Proceed
                          </button>
                        </div>
                      )}

                      {!isReleased &&
                        contactStatus === "pending" &&
                        paymentStatus === "unpaid" && (
                          <div style={paymentBoxStyle}>
                            <h4 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>
                              Unlock supplier contact
                            </h4>

                            <div style={instructionCardStyle}>
                              <div style={instructionRowStyle}>
                                <span style={instructionLabelStyle}>Access fee</span>
                                <strong>{activeRequest.contact_access_fee || "¥299"}</strong>
                              </div>
                              <div style={instructionRowStyle}>
                                <span style={instructionLabelStyle}>Payment method</span>
                                <strong>Bank transfer / RMB collection</strong>
                              </div>
                              <div style={instructionRowStyle}>
                                <span style={instructionLabelStyle}>Receiver name</span>
                                <strong>Weinly</strong>
                              </div>
                              <div style={instructionRowStyle}>
                                <span style={instructionLabelStyle}>Reference</span>
                                <strong>{activeRequest.id}</strong>
                              </div>
                            </div>

                            <p style={{ color: "#475569", lineHeight: 1.7, marginTop: 12 }}>
                              Pay the access fee, enter your payment reference, and upload your proof screenshot below for review.
                            </p>

                            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                              <input
                                value={paymentReferenceInput}
                                onChange={(e) => setPaymentReferenceInput(e.target.value)}
                                placeholder="Enter payment reference"
                                style={inputStyle}
                              />

                              <div style={uploadBoxStyle}>
                                <label
                                  htmlFor="payment-proof"
                                  style={{
                                    display: "block",
                                    marginBottom: 8,
                                    fontWeight: 700,
                                    color: "#0f172a",
                                  }}
                                >
                                  Upload payment proof
                                </label>
                                <input
                                  id="payment-proof"
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) =>
                                    setPaymentProofFile(e.target.files?.[0] || null)
                                  }
                                />
                                {paymentProofFile && (
                                  <div style={{ marginTop: 8, color: "#64748b", fontSize: 14 }}>
                                    Selected: {paymentProofFile.name}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => submitPaymentProof(activeRequest.id)}
                                disabled={paymentSubmitting}
                                style={{
                                  ...darkButtonStyle,
                                  opacity: paymentSubmitting ? 0.7 : 1,
                                  cursor: paymentSubmitting ? "not-allowed" : "pointer",
                                }}
                              >
                                {paymentSubmitting ? "Submitting..." : "Submit payment proof"}
                              </button>
                            </div>
                          </div>
                        )}

                      {!isReleased &&
                        contactStatus === "pending" &&
                        paymentStatus === "pending" && (
                          <div style={pendingBoxStyle}>
                            Payment proof submitted for review. Awaiting confirmation.
                            {activeRequest.payment_proof_name && (
                              <div style={{ marginTop: 8, fontWeight: 500 }}>
                                Proof: {activeRequest.payment_proof_name}
                              </div>
                            )}
                          </div>
                        )}

                      {!isReleased &&
                        contactStatus === "pending" &&
                        paymentStatus === "paid" && (
                          <div style={pendingBoxStyle}>
                            Payment confirmed. Awaiting admin approval for supplier contact release.
                          </div>
                        )}

                      {!isReleased && contactStatus === "rejected" && (
                        <div style={rejectedBoxStyle}>
                          Contact release has not been approved yet. Reach support if you need managed sourcing help.
                        </div>
                      )}

                      {isReleased && (
                        <div style={releasedBoxStyle}>
                          <h4 style={{ marginTop: 0, marginBottom: 10, color: "#166534" }}>
                            Supplier contact details
                          </h4>

                          <div style={quoteGridStyle}>
                            <div style={miniBoxStyle}>
                              <strong>Contact name</strong>
                              <div style={smallMuted}>{quote.contact_name || "—"}</div>
                            </div>
                            <div style={miniBoxStyle}>
                              <strong>Phone</strong>
                              <div style={smallMuted}>{quote.contact_phone || "—"}</div>
                            </div>
                            <div style={miniBoxStyle}>
                              <strong>WeChat</strong>
                              <div style={smallMuted}>{quote.contact_wechat || "—"}</div>
                            </div>
                            <div style={miniBoxStyle}>
                              <strong>Email</strong>
                              <div style={smallMuted}>{quote.contact_email || "—"}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const heroCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 28,
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

const heroTitleStyle: React.CSSProperties = {
  fontSize: 40,
  lineHeight: 1.1,
  margin: "0 0 12px 0",
  color: "#0f172a",
};

const heroTextStyle: React.CSSProperties = {
  fontSize: 17,
  color: "#475569",
  lineHeight: 1.7,
  maxWidth: 760,
  margin: 0,
};

const featureGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 20,
};

const featureCardStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
};

const featureTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#0f172a",
  marginBottom: 6,
};

const featureTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 14,
};

const formTopGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const trackerCardStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
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

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  marginBottom: 24,
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: 26,
  color: "#0f172a",
};

const smallTitle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: 18,
  color: "#0f172a",
};

const mutedText: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.7,
};

const preWrapText: React.CSSProperties = {
  margin: 0,
  color: "#334155",
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
};

const specBoxStyle: React.CSSProperties = {
  marginTop: 16,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 16,
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const infoBoxStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 14,
  color: "#0f172a",
};

const smallMuted: React.CSSProperties = {
  color: "#64748b",
  marginTop: 6,
  fontSize: 14,
  lineHeight: 1.6,
  wordBreak: "break-word",
};

const infoPillStyle: React.CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 600,
  alignSelf: "center",
};

const quoteCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  background: "#ffffff",
  marginBottom: 14,
};

const quoteGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginTop: 12,
};

const miniBoxStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 14,
  padding: 12,
  color: "#0f172a",
};

const protectedBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const paymentBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 16,
  borderRadius: 16,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const instructionCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  borderRadius: 14,
  padding: 14,
};

const instructionRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "6px 0",
  flexWrap: "wrap",
};

const instructionLabelStyle: React.CSSProperties = {
  color: "#475569",
};

const uploadBoxStyle: React.CSSProperties = {
  border: "1px dashed #cbd5e1",
  borderRadius: 14,
  padding: 14,
  background: "#ffffff",
};

const pendingBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  background: "#fff7ed",
  border: "1px solid #fdba74",
  color: "#9a3412",
  fontWeight: 600,
};

const rejectedBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  fontWeight: 600,
};

const releasedBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  background: "#ecfdf5",
  border: "1px solid #86efac",
};

const emptyStateStyle: React.CSSProperties = {
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 18,
  color: "#64748b",
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