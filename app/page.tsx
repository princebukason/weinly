"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

let PaystackPop: any = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const WHATSAPP_NUMBER = "2348130630046";
const SUPPORT_EMAIL = "support@weinly.com";

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

function buildWhatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function HomePage() {
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [requestId, setRequestId] = useState("");
  const [lookupId, setLookupId] = useState("");

  const [submittedRequest, setSubmittedRequest] = useState<FabricRequest | null>(null);
  const [submittedQuotes, setSubmittedQuotes] = useState<Quote[]>([]);

  const [lookupRequest, setLookupRequest] = useState<FabricRequest | null>(null);
  const [lookupQuotes, setLookupQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 880);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    const request = await fetchRequestById(id);
    const quotes = await fetchQuotesByRequestId(id);

    setLookupRequest(request);
    setLookupQuotes(quotes);

    if (submittedRequest?.id === id) {
      setSubmittedRequest(request);
      setSubmittedQuotes(quotes);
    }
  }

  function getUnlockAmountInKobo(fee?: string | null) {
    if (!fee) return 300000;

    const numeric = Number(String(fee).replace(/[^\d.]/g, ""));
    if (!numeric || Number.isNaN(numeric)) return 300000;

    return Math.round(numeric * 100);
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
      setSubmittedQuotes([]);
      setRequestId(data.id);
      setLookupId(data.id);

      document.getElementById("request-result")?.scrollIntoView({ behavior: "smooth" });
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

      setTimeout(() => {
        document.getElementById("request-tracker")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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
          contact_access_fee: "₦3000",
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

  async function startPaystackCheckout(request: FabricRequest) {
    try {
      if (!request.client_email) {
        alert("Buyer email is required before payment.");
        return;
      }

      if (!PAYSTACK_PUBLIC_KEY) {
        alert("Missing NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.");
        return;
      }

      setPaymentLoading(true);

      const expectedAmount = getUnlockAmountInKobo(request.contact_access_fee);

      const initRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: request.client_email,
          amount: expectedAmount,
          requestId: request.id,
          name: request.client_name,
          phone: request.client_phone,
        }),
      });

      const initData = await initRes.json();

      if (!initRes.ok || !initData?.access_code) {
        alert(initData?.error || "Failed to initialize payment.");
        setPaymentLoading(false);
        return;
      }

      if (typeof window === "undefined") {
        setPaymentLoading(false);
        return;
      }

      if (!PaystackPop) {
        const module = await import("@paystack/inline-js");
        PaystackPop = module.default;
      }

      const popup = new PaystackPop();

      popup.resumeTransaction(initData.access_code, {
        onSuccess: async (transaction: { reference: string }) => {
          try {
            const verifyRes = await fetch("/api/paystack/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: transaction.reference,
                requestId: request.id,
                expectedAmount,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              alert(verifyData?.error || "Payment verification failed.");
              return;
            }

            await syncActiveRequestState(request.id);
            alert("Payment confirmed successfully.");
          } catch (error) {
            console.error(error);
            alert("Payment verification failed.");
          } finally {
            setPaymentLoading(false);
          }
        },
        onCancel: () => {
          setPaymentLoading(false);
          alert("Payment window closed.");
        },
      });
    } catch (error) {
      console.error(error);
      setPaymentLoading(false);
      alert("Failed to launch payment.");
    }
  }

  useEffect(() => {
    if (!requestId) return;

    async function refreshSubmittedData() {
      const request = await fetchRequestById(requestId);
      const quotes = await fetchQuotesByRequestId(requestId);
      setSubmittedRequest(request);
      setSubmittedQuotes(quotes);
    }

    refreshSubmittedData();
  }, [requestId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const requestIdFromUrl = params.get("requestId");

    if (requestIdFromUrl) {
      setLookupId(requestIdFromUrl);
      handleLookup(requestIdFromUrl);
    }
  }, []);

  const activeRequest = useMemo(() => {
    return lookupRequest || submittedRequest;
  }, [lookupRequest, submittedRequest]);

  const activeQuotes = useMemo(() => {
    return lookupRequest ? lookupQuotes : submittedQuotes;
  }, [lookupRequest, lookupQuotes, submittedQuotes]);

  const activeStage = useMemo(() => {
    if (!activeRequest) return null;
    return getStageTone(activeRequest, activeQuotes.length);
  }, [activeRequest, activeQuotes.length]);

  const genericSupportLink = buildWhatsappLink(
    "Hello Weinly, I need help with fabric sourcing."
  );

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
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
                <a href="/" style={navLinkStyle}>
                  Home
                </a>
                <a href="#how-it-works" style={navLinkStyle}>
                  How it works
                </a>
                <a href="/history" style={navLinkStyle}>
                  History
                </a>
                <a href="#pricing" style={navLinkStyle}>
                  Pricing
                </a>
                <a
                  href={genericSupportLink}
                  target="_blank"
                  rel="noreferrer"
                  style={navLinkStyle}
                >
                  WhatsApp Support
                </a>
              </nav>

              <a
                href="#submit-request"
                style={{
                  ...navCtaStyle,
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Submit Request
              </a>
            </div>
          </div>
        </header>

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
                Receive quotes before supplier contact is released.
              </span>
            </div>

            <div style={featureCardStyle}>
              <strong style={featureTitleStyle}>Controlled supplier access</strong>
              <span style={featureTextStyle}>
                Proceed, pay securely, get approved, then reveal supplier contact.
              </span>
            </div>
          </div>

          <div id="how-it-works" style={howItWorksBoxStyle}>
            <strong style={{ color: "#0f172a", display: "block", marginBottom: 10 }}>
              How Weinly works
            </strong>
            <div style={stepsGridStyle}>
              <div style={stepCardStyle}>
                <div style={stepNumberStyle}>1</div>
                <div>
                  <strong style={stepTitleStyle}>Submit your request</strong>
                  <div style={stepTextStyle}>
                    Describe the fabric you want in simple words.
                  </div>
                </div>
              </div>

              <div style={stepCardStyle}>
                <div style={stepNumberStyle}>2</div>
                <div>
                  <strong style={stepTitleStyle}>Get quote previews</strong>
                  <div style={stepTextStyle}>
                    See price, MOQ, lead time, and supplier notes.
                  </div>
                </div>
              </div>

              <div style={stepCardStyle}>
                <div style={stepNumberStyle}>3</div>
                <div>
                  <strong style={stepTitleStyle}>Unlock supplier contact</strong>
                  <div style={stepTextStyle}>
                    Pay securely and access direct supplier details after approval.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form id="submit-request" onSubmit={handleSubmit}>
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

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

              <a
                href={genericSupportLink}
                target="_blank"
                rel="noreferrer"
                style={whatsAppButtonStyle}
              >
                Chat on WhatsApp
              </a>
            </div>
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

            <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="/history" style={historyLinkStyle}>
                View your previous requests
              </a>
              <a
                href={genericSupportLink}
                target="_blank"
                rel="noreferrer"
                style={supportInlineLinkStyle}
              >
                Need help? Chat support
              </a>
            </div>
          </div>
        </section>

        <section id="pricing" style={pricingSectionStyle}>
          <div style={pricingHeaderStyle}>
            <div style={badgeStyle}>PRICING</div>
            <h2 style={pricingTitleStyle}>Simple and clear pricing</h2>
            <p style={pricingSubtitleStyle}>
              Weinly is designed to let buyers start easily, review supplier quotes,
              and only pay when they want direct supplier contact.
            </p>
          </div>

          <div style={pricingGridStyle}>
            <div style={pricingCardStyle}>
              <div style={pricingCardTopStyle}>
                <div style={pricingPlanStyle}>Request Submission</div>
                <div style={pricingAmountStyle}>Free</div>
              </div>
              <p style={pricingTextStyle}>
                Submit your fabric sourcing request and receive a structured sourcing
                flow inside Weinly.
              </p>
              <ul style={pricingListStyle}>
                <li style={pricingListItemStyle}>Fabric request submission</li>
                <li style={pricingListItemStyle}>AI sourcing spec formatting</li>
                <li style={pricingListItemStyle}>Request tracking</li>
              </ul>
            </div>

            <div style={featuredPricingCardStyle}>
              <div style={featuredBadgeStyle}>Most important</div>
              <div style={pricingCardTopStyle}>
                <div style={pricingPlanStyle}>Supplier Contact Unlock</div>
                <div style={pricingAmountStyle}>₦3000</div>
              </div>
              <p style={pricingTextStyle}>
                When quotes are ready, pay to unlock direct supplier contact after
                approval.
              </p>
              <ul style={pricingListStyle}>
                <li style={pricingListItemStyle}>Supplier quote preview first</li>
                <li style={pricingListItemStyle}>Phone, WeChat, email, contact person</li>
                <li style={pricingListItemStyle}>Controlled release process</li>
              </ul>
            </div>

            <div style={pricingCardStyle}>
              <div style={pricingCardTopStyle}>
                <div style={pricingPlanStyle}>Support</div>
                <div style={pricingAmountStyle}>Chat us</div>
              </div>
              <p style={pricingTextStyle}>
                Need help before paying or want managed sourcing support? Reach out on
                WhatsApp.
              </p>
              <ul style={pricingListStyle}>
                <li style={pricingListItemStyle}>Pre-payment guidance</li>
                <li style={pricingListItemStyle}>Request support</li>
                <li style={pricingListItemStyle}>Buyer assistance</li>
              </ul>
            </div>
          </div>
        </section>

        {submittedRequest && (
          <section id="request-result" style={cardStyle}>
            <h2 style={sectionTitle}>Request submitted successfully</h2>
            <p style={mutedText}>
              Save this request ID so you can track supplier quotes later.
            </p>

            <div style={successBoxStyle}>
              <div style={{ marginBottom: 6 }}>
                <strong>Request ID:</strong> {submittedRequest.id}
              </div>
              <div>
                <strong>Status:</strong> {submittedRequest.status || "submitted"}
              </div>
            </div>

            {submittedRequest.ai_output != null && (
              <div style={specBoxStyle}>
                <h3 style={smallTitle}>AI sourcing spec</h3>
                <p style={preWrapText}>{formatAiOutput(submittedRequest.ai_output)}</p>
              </div>
            )}

            <div style={nextStepBoxStyle}>
              <strong style={{ color: "#0f172a" }}>What happens next?</strong>
              <p style={{ ...mutedText, marginTop: 8 }}>
                Weinly will review your request, add supplier quotes, and update your
                tracker. Use your request ID to check progress anytime.
              </p>
            </div>
          </section>
        )}

        {activeRequest && activeStage && (
          <section id="request-tracker" style={cardStyle}>
            <div style={requestHeaderRowStyle}>
              <div>
                <h2 style={sectionTitle}>Request tracker</h2>
                <p style={mutedText}>
                  Follow your request, review quotes, pay for supplier access, and
                  unlock supplier contact after approval.
                </p>
              </div>

              <div
                style={{
                  ...infoPillStyle,
                  background: activeStage.background,
                  color: activeStage.color,
                }}
              >
                {activeStage.label}
              </div>
            </div>

            <div style={timelineBoxStyle}>
              <strong style={{ color: "#0f172a" }}>Current stage</strong>
              <div style={timelineTitleStyle}>
                {getRequestStageLabel(activeRequest, activeQuotes.length)}
              </div>
              <p style={timelineTextStyle}>
                {activeRequest.contact_request_status === "approved"
                  ? "Your supplier contact access has been approved. You can now view the released contact details below."
                  : activeRequest.payment_status === "paid"
                  ? "Your payment has been received. If supplier contact is not yet visible, approval may still be pending."
                  : activeQuotes.length > 0
                  ? "Your quote preview is ready. Supplier contacts stay protected until access is approved."
                  : "Your request has been received and is being processed."}
              </p>
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

            <div style={infoGridStyle}>
              <div style={infoBoxStyle}>
                <strong>Contact request</strong>
                <div style={smallMuted}>
                  {activeRequest.contact_request_status || "none"}
                </div>
              </div>

              <div style={infoBoxStyle}>
                <strong>Access fee</strong>
                <div style={smallMuted}>{activeRequest.contact_access_fee || "—"}</div>
              </div>

              <div style={infoBoxStyle}>
                <strong>Payment reference</strong>
                <div style={smallMuted}>{activeRequest.payment_reference || "—"}</div>
              </div>

              <div style={infoBoxStyle}>
                <strong>Paid at</strong>
                <div style={smallMuted}>
                  {activeRequest.paid_at
                    ? new Date(activeRequest.paid_at).toLocaleString()
                    : "—"}
                </div>
              </div>
            </div>

            <div style={specBoxStyle}>
              <h3 style={smallTitle}>Fabric request</h3>
              <p style={preWrapText}>{activeRequest.user_input}</p>
            </div>

            {activeRequest.ai_output != null && (
              <div style={specBoxStyle}>
                <h3 style={smallTitle}>AI sourcing spec</h3>
                <p style={preWrapText}>{formatAiOutput(activeRequest.ai_output)}</p>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <div style={quotesHeaderRowStyle}>
                <h3 style={smallTitle}>Supplier quotes</h3>
                <span style={quoteCountBadgeStyle}>
                  {activeQuotes.length} {activeQuotes.length === 1 ? "quote" : "quotes"}
                </span>
              </div>

              {activeQuotes.length === 0 ? (
                <div style={emptyStateStyle}>
                  We are currently sourcing suppliers for this request. Quotes will appear
                  here shortly.
                </div>
              ) : (
                activeQuotes.map((quote) => {
                  const isReleased = !!quote.is_contact_released;
                  const contactStatus = activeRequest.contact_request_status || "none";
                  const paymentStatus = activeRequest.payment_status || "unpaid";
                  const requestSupportLink = buildWhatsappLink(
                    `Hello Weinly, I need help with request ID: ${activeRequest.id}`
                  );

                  return (
                    <div key={quote.id} style={quoteCardStyle}>
                      <div style={quoteHeaderStyle}>
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
                        <div style={miniBoxStyle}>
                          <strong>Supplier region</strong>
                          <div style={smallMuted}>
                            {quote.supplier_region || "Not added yet"}
                          </div>
                        </div>
                      </div>

                      {quote.note && (
                        <div style={quoteNoteBoxStyle}>
                          <strong style={{ color: "#0f172a" }}>Supplier note</strong>
                          <p style={{ ...preWrapText, marginTop: 6 }}>{quote.note}</p>
                        </div>
                      )}

                      {!isReleased && contactStatus === "none" && (
                        <div style={protectedBoxStyle}>
                          <p style={{ margin: "0 0 10px 0", color: "#334155" }}>
                            Supplier contact is protected. Click proceed to request access.
                          </p>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button
                              onClick={() => requestSupplierContact(activeRequest.id)}
                              style={darkButtonStyle}
                            >
                              Proceed
                            </button>

                            <a
                              href={requestSupportLink}
                              target="_blank"
                              rel="noreferrer"
                              style={secondaryActionLinkStyle}
                            >
                              Ask support first
                            </a>
                          </div>
                        </div>
                      )}

                      {!isReleased &&
                        contactStatus === "pending" &&
                        paymentStatus === "unpaid" && (
                          <div style={paymentBoxStyle}>
                            <h4 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>
                              Unlock verified supplier contact now
                            </h4>

                            <div style={instructionCardStyle}>
                              <div style={instructionRowStyle}>
                                <span style={instructionLabelStyle}>Access fee</span>
                                <strong>{activeRequest.contact_access_fee || "₦3000"}</strong>
                              </div>
                              <div style={instructionRowStyle}>
                                <span style={instructionLabelStyle}>Payment method</span>
                                <strong>Paystack Checkout</strong>
                              </div>
                              <div style={instructionRowStyle}>
                                <span style={instructionLabelStyle}>Request reference</span>
                                <strong>{activeRequest.id}</strong>
                              </div>
                            </div>

                            <p
                              style={{
                                color: "#475569",
                                lineHeight: 1.7,
                                marginTop: 12,
                                marginBottom: 0,
                              }}
                            >
                              Get direct access to supplier phone, WeChat, and contact
                              person. Avoid middlemen and negotiate better deals instantly.
                            </p>

                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 13,
                                color: "#64748b",
                              }}
                            >
                              Trusted by fabric buyers sourcing from China to Africa.
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                                marginTop: 14,
                              }}
                            >
                              <button
                                onClick={() => startPaystackCheckout(activeRequest)}
                                disabled={paymentLoading}
                                style={{
                                  ...darkButtonStyle,
                                  opacity: paymentLoading ? 0.7 : 1,
                                  cursor: paymentLoading ? "not-allowed" : "pointer",
                                }}
                              >
                                {paymentLoading ? "Processing..." : "Pay & Unlock Contact"}
                              </button>

                              <a
                                href={requestSupportLink}
                                target="_blank"
                                rel="noreferrer"
                                style={whatsAppButtonStyle}
                              >
                                Need help?
                              </a>
                            </div>
                          </div>
                        )}

                      {!isReleased &&
                        contactStatus === "pending" &&
                        paymentStatus === "paid" && (
                          <div style={pendingBoxStyle}>
                            Payment confirmed. Awaiting admin approval for supplier contact
                            release.
                          </div>
                        )}

                      {!isReleased && contactStatus === "rejected" && (
                        <div style={rejectedBoxStyle}>
                          Contact release has not been approved yet. Reach support if you
                          need managed sourcing help.
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

            <div style={supportBoxStyle}>
              <div>
                <strong style={{ color: "#0f172a" }}>Need help with this request?</strong>
                <p style={{ ...mutedText, marginTop: 8 }}>
                  Chat with Weinly support for guidance on your request, payment, or
                  supplier contact release.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a
                  href={buildWhatsappLink(
                    `Hello Weinly, I need help with request ID: ${activeRequest.id}`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  style={whatsAppButtonStyle}
                >
                  Chat on WhatsApp
                </a>
                <a href="/history" style={secondaryActionLinkStyle}>
                  View full history
                </a>
              </div>
            </div>
          </section>
        )}

        <footer style={footerStyle}>
          <div style={footerTopStyle}>
            <div>
              <div style={footerBrandStyle}>Weinly</div>
              <p style={footerTextStyle}>
                Built for fabric buyers sourcing from China.
              </p>
            </div>

            <div style={footerGridStyle}>
              <div>
                <div style={footerHeadingStyle}>Navigation</div>
                <div style={footerLinksWrapStyle}>
                  <a href="/history" style={footerLinkStyle}>
                    History
                  </a>
                  <a href="#pricing" style={footerLinkStyle}>
                    Pricing
                  </a>
                  <a href="#how-it-works" style={footerLinkStyle}>
                    How it works
                  </a>
                </div>
              </div>

              <div>
                <div style={footerHeadingStyle}>Support</div>
                <div style={footerLinksWrapStyle}>
                  <a
                    href={genericSupportLink}
                    target="_blank"
                    rel="noreferrer"
                    style={footerLinkStyle}
                  >
                    WhatsApp
                  </a>
                  <a href={`mailto:${SUPPORT_EMAIL}`} style={footerLinkStyle}>
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "16px 12px 36px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

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
  fontSize: "clamp(2rem, 6vw, 3.4rem)",
  lineHeight: 1.05,
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

const howItWorksBoxStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: 16,
  borderRadius: 16,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const stepsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const stepCardStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
};

const stepNumberStyle: React.CSSProperties = {
  minWidth: 28,
  height: 28,
  borderRadius: 999,
  background: "#0f172a",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 13,
};

const stepTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#0f172a",
  marginBottom: 4,
};

const stepTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
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

const historyLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  fontWeight: 700,
  textDecoration: "none",
};

const supportInlineLinkStyle: React.CSSProperties = {
  color: "#16a34a",
  fontWeight: 700,
  textDecoration: "none",
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

const pricingSectionStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 28,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  marginBottom: 24,
};

const pricingHeaderStyle: React.CSSProperties = {
  marginBottom: 20,
};

const pricingTitleStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
  color: "#0f172a",
};

const pricingSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.7,
  maxWidth: 760,
};

const pricingGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const pricingCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 20,
  padding: 18,
};

const featuredPricingCardStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  borderRadius: 20,
  padding: 18,
  position: "relative",
};

const featuredBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 12,
  padding: "6px 10px",
  borderRadius: 999,
  background: "#1d4ed8",
  color: "white",
  fontSize: 12,
  fontWeight: 700,
};

const pricingCardTopStyle: React.CSSProperties = {
  marginBottom: 12,
};

const pricingPlanStyle: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 18,
};

const pricingAmountStyle: React.CSSProperties = {
  marginTop: 8,
  color: "#0f172a",
  fontSize: 28,
  fontWeight: 800,
};

const pricingTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.7,
};

const pricingListStyle: React.CSSProperties = {
  margin: "14px 0 0 0",
  paddingLeft: 18,
  color: "#334155",
};

const pricingListItemStyle: React.CSSProperties = {
  marginBottom: 8,
  lineHeight: 1.6,
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
  fontSize: "clamp(1.4rem, 3.8vw, 2rem)",
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

const successBoxStyle: React.CSSProperties = {
  marginTop: 16,
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  borderRadius: 16,
  padding: 16,
  color: "#166534",
};

const nextStepBoxStyle: React.CSSProperties = {
  marginTop: 16,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 16,
};

const requestHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 18,
};

const timelineBoxStyle: React.CSSProperties = {
  marginBottom: 16,
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
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  alignSelf: "center",
};

const quotesHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
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
  borderRadius: 18,
  padding: 18,
  background: "#ffffff",
  marginBottom: 14,
};

const quoteHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
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

const quoteNoteBoxStyle: React.CSSProperties = {
  marginTop: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 14,
  padding: 12,
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

const supportBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 16,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "center",
};

const emptyStateStyle: React.CSSProperties = {
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 18,
  color: "#64748b",
};

const footerStyle: React.CSSProperties = {
  marginTop: 8,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
};

const footerTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  flexWrap: "wrap",
};

const footerBrandStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
};

const footerTextStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "#64748b",
  lineHeight: 1.7,
  maxWidth: 320,
};

const footerGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 24,
  minWidth: 320,
};

const footerHeadingStyle: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 700,
  marginBottom: 10,
};

const footerLinksWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const footerLinkStyle: React.CSSProperties = {
  color: "#475569",
  textDecoration: "none",
  fontWeight: 600,
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

const blueButtonStyle: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
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

const secondaryActionLinkStyle: React.CSSProperties = {
  background: "#e2e8f0",
  color: "#0f172a",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};