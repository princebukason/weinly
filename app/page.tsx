"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";

let PaystackPop: any = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

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
  if (request.payment_status === "paid") return "Payment received — pending approval";
  if (quoteCount > 0) return "Quotes available";
  if (request.status === "completed") return "Completed";
  if (request.status === "quoted") return "Quoted";
  return "Submitted — being processed";
}

function getStageTone(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved") {
    return { background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", color: "#065f46", label: "Access unlocked" };
  }
  if (request.payment_status === "paid") {
    return { background: "linear-gradient(135deg,#ede9fe,#ddd6fe)", color: "#5b21b6", label: "Paid — awaiting approval" };
  }
  if (quoteCount > 0) {
    return { background: "linear-gradient(135deg,#dbeafe,#bfdbfe)", color: "#1e40af", label: "Quotes ready" };
  }
  return { background: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e", label: "In progress" };
}

export default function HomePage() {
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [requestId, setRequestId] = useState("");
  const [lookupId, setLookupId] = useState("");

  const [submittedRequest, setSubmittedRequest] = useState<FabricRequest | null>(null);
  const [submittedQuotes, setSubmittedQuotes] = useState<Quote[]>([]);
  const [lookupRequest, setLookupRequest] = useState<FabricRequest | null>(null);
  const [lookupQuotes, setLookupQuotes] = useState<Quote[]>([]);

  async function generateAISpec(userInput: string) {
    try {
      const res = await fetch("/api/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    if (error) { console.error(error); return []; }
    return (data || []) as Quote[];
  }

  async function fetchRequestById(id: string) {
    const { data, error } = await supabase
      .from("fabric_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (error) { console.error(error); return null; }
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
    if (!description.trim()) { alert("Please describe the fabric you need."); return; }
    setLoading(true);
    setSubmittedRequest(null);
    setSubmittedQuotes([]);
    try {
      const aiOutput = await generateAISpec(description.trim());
      const { data, error } = await supabase
        .from("fabric_requests")
        .insert([{
          client_name: clientName || null,
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          user_input: description.trim(),
          ai_output: aiOutput,
          status: "submitted",
          buyer_requested_contact: false,
          contact_request_status: "none",
          payment_status: "unpaid",
        }])
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
    if (!cleanId) { alert("Enter a request ID."); return; }
    setLookupLoading(true);
    setLookupRequest(null);
    setLookupQuotes([]);
    try {
      const request = await fetchRequestById(cleanId);
      if (!request) { alert("Request not found."); return; }
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
      if (!request.client_email) { alert("Buyer email is required before payment."); return; }
      if (!PAYSTACK_PUBLIC_KEY) { alert("Missing NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY."); return; }
      setPaymentLoading(true);
      const expectedAmount = getUnlockAmountInKobo(request.contact_access_fee);
      const initRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (typeof window === "undefined") { setPaymentLoading(false); return; }
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
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reference: transaction.reference,
                requestId: request.id,
                expectedAmount,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) { alert(verifyData?.error || "Payment verification failed."); return; }
            await syncActiveRequestState(request.id);
            alert("Payment confirmed. Awaiting admin approval to release supplier contact.");
          } catch (error) {
            console.error(error);
            alert("Payment verification failed.");
          } finally {
            setPaymentLoading(false);
          }
        },
        onCancel: () => { setPaymentLoading(false); alert("Payment window closed."); },
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
    if (!requestIdFromUrl) return;
    setLookupId(requestIdFromUrl);
    async function loadFromUrl() {
      const request = await fetchRequestById(requestIdFromUrl!);
      if (!request) return;
      const quotes = await fetchQuotesByRequestId(requestIdFromUrl!);
      setLookupRequest(request);
      setLookupQuotes(quotes);
    }
    loadFromUrl();
  }, []);

  const activeRequest = useMemo(() => lookupRequest || submittedRequest, [lookupRequest, submittedRequest]);
  const activeQuotes = useMemo(() => lookupRequest ? lookupQuotes : submittedQuotes, [lookupRequest, lookupQuotes, submittedQuotes]);
  const activeStage = useMemo(() => {
    if (!activeRequest) return null;
    return getStageTone(activeRequest, activeQuotes.length);
  }, [activeRequest, activeQuotes.length]);

  const genericSupportLink = buildWhatsappLink("Hello Weinly, I need help with fabric sourcing.");

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <SiteHeader />

        {/* ── HERO ── */}
        <section style={heroSectionStyle}>
          <div style={heroInnerStyle}>
            <div style={heroBadgeStyle}>
              <span style={heroBadgeDotStyle} />
              Trusted fabric sourcing platform
            </div>

            <h1 style={heroTitleStyle}>
              Connect directly with{" "}
              <span style={heroAccentStyle}>verified fabric</span>{" "}
              suppliers in China
            </h1>

            <p style={heroSubtitleStyle}>
              Describe the fabric you need, receive structured supplier quotes,
              then unlock direct supplier contact. No middlemen, no guesswork.
            </p>

            <div style={heroStatsRowStyle}>
              {[
                { value: "500+", label: "Verified suppliers" },
                { value: "24hr", label: "Avg. quote time" },
                { value: "₦3,000", label: "Contact unlock fee" },
              ].map((stat) => (
                <div key={stat.label} style={heroStatItemStyle}>
                  <div style={heroStatValueStyle}>{stat.value}</div>
                  <div style={heroStatLabelStyle}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={heroActionsStyle}>
              <a href="#submit-request" style={heroPrimaryBtnStyle}>
                Start sourcing now
              </a>
              <a href={genericSupportLink} target="_blank" rel="noreferrer" style={heroSecondaryBtnStyle}>
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div style={heroFeaturesColStyle}>
            {[
              { icon: "✦", title: "AI spec formatting", text: "Your rough description becomes a manufacturer-ready sourcing spec instantly." },
              { icon: "◈", title: "Verified quotes first", text: "See price, MOQ and lead time before paying anything to unlock contact." },
              { icon: "⬡", title: "Controlled access", text: "Pay securely, get approved, then receive direct supplier contact details." },
            ].map((f) => (
              <div key={f.title} style={heroFeatureCardStyle}>
                <div style={heroFeatureIconStyle}>{f.icon}</div>
                <div>
                  <div style={heroFeatureTitleStyle}>{f.title}</div>
                  <div style={heroFeatureTextStyle}>{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={howItWorksSectionStyle}>
          <div style={sectionLabelStyle}>How it works</div>
          <h2 style={sectionTitleStyle}>Three steps to your supplier</h2>
          <div style={stepsRowStyle}>
            {[
              { n: "01", title: "Submit your request", text: "Describe what fabric you need. Our AI converts it into a professional sourcing spec." },
              { n: "02", title: "Review supplier quotes", text: "We match your request to verified Chinese suppliers. See price, MOQ and lead time first." },
              { n: "03", title: "Unlock & connect", text: "Pay ₦3,000 to unlock direct supplier contact — phone, WeChat, email and contact name." },
            ].map((step) => (
              <div key={step.n} style={stepCardStyle}>
                <div style={stepNumberStyle}>{step.n}</div>
                <h3 style={stepTitleStyle}>{step.title}</h3>
                <p style={stepTextStyle}>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── REQUEST FORM ── */}
        <section id="submit-request" style={formSectionStyle}>
          <div style={formHeaderStyle}>
            <div style={sectionLabelStyle}>Submit a request</div>
            <h2 style={sectionTitleStyle}>Tell us what you need</h2>
            <p style={formSubtitleStyle}>
              Be as detailed as possible — fabric type, color, quantity, quality level. The more detail, the better your quotes.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={formBodyStyle}>
            <div style={formGridStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Your name</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Amaka Obi"
                  style={inputStyle}
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Email address</label>
                <input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  style={inputStyle}
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>WhatsApp / phone</label>
                <input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Fabric description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: premium beaded lace for wedding asoebi, navy blue, soft handfeel, 5-yard packs, high-end quality, need at least 50 packs..."
                rows={6}
                style={{ ...inputStyle, resize: "vertical", width: "100%" }}
              />
              <p style={fieldHintStyle}>Tip: include fabric type, color, quantity, quality level and intended use for better quotes.</p>
            </div>

            <div style={formActionsStyle}>
              <button
                type="submit"
                disabled={loading}
                style={{ ...primaryBtnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Processing your request..." : "Submit fabric request →"}
              </button>
              <a href={genericSupportLink} target="_blank" rel="noreferrer" style={whatsappBtnStyle}>
                Need help first?
              </a>
            </div>
          </form>

          {/* Lookup */}
          <div style={lookupBoxStyle}>
            <div style={lookupHeaderStyle}>
              <div style={lookupTitleStyle}>Already submitted a request?</div>
              <a href="/history" style={lookupHistoryLinkStyle}>View all history →</a>
            </div>
            <div style={lookupRowStyle}>
              <input
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Paste your request ID here"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => handleLookup()}
                disabled={lookupLoading}
                style={{ ...secondaryBtnStyle, opacity: lookupLoading ? 0.7 : 1, cursor: lookupLoading ? "not-allowed" : "pointer" }}
              >
                {lookupLoading ? "Loading..." : "Track request"}
              </button>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={pricingSectionStyle}>
          <div style={sectionLabelStyle}>Pricing</div>
          <h2 style={sectionTitleStyle}>Simple, transparent pricing</h2>
          <p style={pricingSubtitleStyle}>
            Start for free. Only pay when you want direct access to a supplier.
          </p>

          <div style={pricingGridStyle}>
            <div style={pricingCardStyle}>
              <div style={pricingPlanLabelStyle}>Free</div>
              <div style={pricingAmountStyle}>₦0</div>
              <p style={pricingDescStyle}>Submit requests and receive supplier quote previews at no cost.</p>
              <div style={pricingDividerStyle} />
              {["Submit fabric requests", "AI sourcing spec", "Quote preview (price, MOQ, lead time)", "Request tracking"].map((item) => (
                <div key={item} style={pricingItemStyle}>
                  <span style={pricingCheckStyle}>✓</span> {item}
                </div>
              ))}
            </div>

            <div style={pricingFeaturedCardStyle}>
              <div style={pricingFeaturedBadgeStyle}>Most popular</div>
              <div style={pricingPlanLabelStyle}>Supplier Contact Unlock</div>
              <div style={{ ...pricingAmountStyle, color: "#fff" }}>₦3,000</div>
              <p style={{ ...pricingDescStyle, color: "#c7d2fe" }}>Get direct access to your matched supplier after approval.</p>
              <div style={{ ...pricingDividerStyle, background: "rgba(255,255,255,0.15)" }} />
              {["Everything in Free", "Direct phone number", "WeChat ID", "Email address", "Contact person name", "Controlled release process"].map((item) => (
                <div key={item} style={{ ...pricingItemStyle, color: "#e0e7ff" }}>
                  <span style={{ ...pricingCheckStyle, color: "#a5f3fc" }}>✓</span> {item}
                </div>
              ))}
            </div>

            <div style={pricingCardStyle}>
              <div style={pricingPlanLabelStyle}>Support</div>
              <div style={pricingAmountStyle}>Free</div>
              <p style={pricingDescStyle}>Talk to our team on WhatsApp before, during or after your request.</p>
              <div style={pricingDividerStyle} />
              {["Pre-payment guidance", "Request assistance", "Quote clarification", "Managed sourcing help"].map((item) => (
                <div key={item} style={pricingItemStyle}>
                  <span style={pricingCheckStyle}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST ── */}
        <section style={trustSectionStyle}>
          <div style={sectionLabelStyle}>Why Weinly</div>
          <h2 style={sectionTitleStyle}>Built for serious fabric buyers</h2>

          <div style={trustGridStyle}>
            {[
              { title: "See quotes before paying", text: "Review supplier price, MOQ and lead time before spending anything. You only pay to unlock direct contact." },
              { title: "Protected supplier details", text: "Supplier contact stays protected until the approval process is complete. No random leaks." },
              { title: "China sourcing expertise", text: "Weinly is designed specifically for buyers sourcing fabrics from Chinese manufacturers for the African market." },
              { title: "WhatsApp support", text: "Real human support on WhatsApp throughout your entire sourcing journey — not just a chatbot." },
            ].map((t) => (
              <div key={t.title} style={trustCardStyle}>
                <div style={trustCardAccentStyle} />
                <h3 style={trustCardTitleStyle}>{t.title}</h3>
                <p style={trustCardTextStyle}>{t.text}</p>
              </div>
            ))}
          </div>

          <div style={faqGridStyle}>
            {[
              { q: "Do I pay before seeing quotes?", a: "No. You submit your request first, then see quote previews. Payment is only required to unlock direct supplier contact." },
              { q: "What does the unlock fee cover?", a: "Direct supplier phone number, WeChat ID, email address and contact person name when available." },
              { q: "Why are contacts protected?", a: "It keeps the process serious and controlled, ensuring quality interactions between buyers and suppliers." },
              { q: "Can I get help before paying?", a: "Yes, always. Chat with us on WhatsApp at any point during your sourcing journey." },
            ].map((faq) => (
              <div key={faq.q} style={faqCardStyle}>
                <h3 style={faqQuestionStyle}>{faq.q}</h3>
                <p style={faqAnswerStyle}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── REQUEST SUBMITTED ── */}
        {submittedRequest && (
          <section id="request-result" style={resultSectionStyle}>
            <div style={resultHeaderStyle}>
              <div style={successIconStyle}>✓</div>
              <div>
                <h2 style={resultTitleStyle}>Request submitted successfully</h2>
                <p style={resultSubtitleStyle}>Save your request ID — you'll need it to track quotes.</p>
              </div>
            </div>

            <div style={idBoxStyle}>
              <div style={idLabelStyle}>Your request ID</div>
              <div style={idValueStyle}>{submittedRequest.id}</div>
            </div>

            {submittedRequest.ai_output != null && (
              <div style={specBoxStyle}>
                <div style={specLabelStyle}>AI sourcing spec generated</div>
                <p style={preWrapStyle}>{formatAiOutput(submittedRequest.ai_output)}</p>
              </div>
            )}

            <div style={nextStepBoxStyle}>
              <strong style={{ color: "#0f172a" }}>What happens next?</strong>
              <p style={{ margin: "6px 0 0", color: "#475569", lineHeight: 1.7 }}>
                We're matching your request to verified suppliers. Quote previews will appear in your tracker within 24 hours. Use your request ID above to check progress anytime.
              </p>
            </div>
          </section>
        )}

        {/* ── REQUEST TRACKER ── */}
        {activeRequest && activeStage && (
          <section id="request-tracker" style={trackerSectionStyle}>
            <div style={trackerHeaderStyle}>
              <div>
                <h2 style={trackerTitleStyle}>Request tracker</h2>
                <p style={trackerSubtitleStyle}>Follow your request, review quotes and unlock supplier contact.</p>
              </div>
              <div style={{ ...stagePillStyle, background: activeStage.background, color: activeStage.color }}>
                {activeStage.label}
              </div>
            </div>

            <div style={stageBoxStyle}>
              <div style={stageTitleStyle}>{getRequestStageLabel(activeRequest, activeQuotes.length)}</div>
              <p style={stageTextStyle}>
                {activeRequest.contact_request_status === "approved"
                  ? "Your supplier contact access has been approved. Direct contact details are visible below."
                  : activeRequest.payment_status === "paid"
                  ? "Payment received. Admin is reviewing your request — supplier contact will be released shortly."
                  : activeQuotes.length > 0
                  ? "Your quote preview is ready. Review it below, then proceed to unlock direct supplier contact."
                  : "Your request has been received and is being matched to verified suppliers."}
              </p>
            </div>

            <div style={infoGridStyle}>
              {[
                { label: "Request ID", value: activeRequest.id },
                { label: "Buyer", value: activeRequest.client_name || "Not provided" },
                { label: "Status", value: activeRequest.status || "submitted" },
                { label: "Payment", value: activeRequest.payment_status || "unpaid" },
                { label: "Contact request", value: activeRequest.contact_request_status || "none" },
                { label: "Access fee", value: activeRequest.contact_access_fee || "—" },
                { label: "Reference", value: activeRequest.payment_reference || "—" },
                { label: "Paid at", value: activeRequest.paid_at ? new Date(activeRequest.paid_at).toLocaleString() : "—" },
              ].map((info) => (
                <div key={info.label} style={infoBoxStyle}>
                  <div style={infoLabelStyle}>{info.label}</div>
                  <div style={infoValueStyle}>{info.value}</div>
                </div>
              ))}
            </div>

            <div style={specBoxStyle}>
              <div style={specLabelStyle}>Fabric request</div>
              <p style={preWrapStyle}>{activeRequest.user_input}</p>
            </div>

            {activeRequest.ai_output != null && (
              <div style={specBoxStyle}>
                <div style={specLabelStyle}>AI sourcing spec</div>
                <p style={preWrapStyle}>{formatAiOutput(activeRequest.ai_output)}</p>
              </div>
            )}

            {/* Quotes */}
            <div style={quotesWrapStyle}>
              <div style={quotesHeaderStyle}>
                <h3 style={quotesTitleStyle}>Supplier quotes</h3>
                <div style={quotesBadgeStyle}>{activeQuotes.length} {activeQuotes.length === 1 ? "quote" : "quotes"}</div>
              </div>

              {activeQuotes.length === 0 ? (
                <div style={emptyQuoteStyle}>
                  <div style={emptyIconStyle}>◎</div>
                  <div style={emptyTitleStyle}>Sourcing in progress</div>
                  <p style={emptyTextStyle}>We are matching your request to verified suppliers. Quotes will appear here shortly.</p>
                </div>
              ) : (
                activeQuotes.map((quote) => {
                  const isReleased = !!quote.is_contact_released;
                  const contactStatus = activeRequest.contact_request_status || "none";
                  const paymentStatus = activeRequest.payment_status || "unpaid";
                  const requestSupportLink = buildWhatsappLink(`Hello Weinly, I need help with request ID: ${activeRequest.id}`);

                  return (
                    <div key={quote.id} style={quoteCardStyle}>
                      <div style={quoteCardHeaderStyle}>
                        <div>
                          <div style={quoteSupplierNameStyle}>{quote.supplier_name || "Verified Supplier"}</div>
                          <div style={quoteSupplierRegionStyle}>{quote.supplier_region || "China"} · Verified sourcing partner</div>
                        </div>
                        <div style={{ ...quoteStatusPillStyle, background: isReleased ? "#d1fae5" : "#eff6ff", color: isReleased ? "#065f46" : "#1e40af" }}>
                          {isReleased ? "Contact released" : "Contact protected"}
                        </div>
                      </div>

                      <div style={quoteStatsGridStyle}>
                        {[
                          { label: "Price", value: quote.price || "Pending" },
                          { label: "MOQ", value: quote.moq || "Pending" },
                          { label: "Lead time", value: quote.lead_time || "—" },
                          { label: "Region", value: quote.supplier_region || "—" },
                        ].map((s) => (
                          <div key={s.label} style={quoteStatBoxStyle}>
                            <div style={quoteStatLabelStyle}>{s.label}</div>
                            <div style={quoteStatValueStyle}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {quote.note && (
                        <div style={quoteNoteStyle}>
                          <div style={specLabelStyle}>Supplier note</div>
                          <p style={{ ...preWrapStyle, marginTop: 6 }}>{quote.note}</p>
                        </div>
                      )}

                      {!isReleased && contactStatus === "none" && (
                        <div style={actionBoxStyle}>
                          <p style={{ margin: "0 0 12px", color: "#334155" }}>
                            Supplier contact is protected. Click proceed to request access and unlock direct contact details.
                          </p>
                          <div style={actionRowStyle}>
                            <button onClick={() => requestSupplierContact(activeRequest.id)} style={primaryBtnStyle}>
                              Proceed to unlock
                            </button>
                            <a href={requestSupportLink} target="_blank" rel="noreferrer" style={ghostBtnStyle}>
                              Ask support first
                            </a>
                          </div>
                        </div>
                      )}

                      {!isReleased && contactStatus === "pending" && paymentStatus === "unpaid" && (
                        <div style={paymentBoxStyle}>
                          <h4 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 18 }}>Unlock supplier contact</h4>
                          <div style={paymentDetailsStyle}>
                            {[
                              { label: "Access fee", value: activeRequest.contact_access_fee || "₦3,000" },
                              { label: "Payment method", value: "Paystack Checkout" },
                              { label: "Request ID", value: activeRequest.id },
                            ].map((row) => (
                              <div key={row.label} style={paymentRowStyle}>
                                <span style={{ color: "#64748b" }}>{row.label}</span>
                                <strong style={{ color: "#0f172a" }}>{row.value}</strong>
                              </div>
                            ))}
                          </div>
                          <p style={{ margin: "14px 0 0", color: "#475569", lineHeight: 1.7, fontSize: 14 }}>
                            Get direct access to supplier phone, WeChat and contact person. Avoid middlemen and negotiate better deals.
                          </p>
                          <div style={{ ...actionRowStyle, marginTop: 16 }}>
                            <button
                              onClick={() => startPaystackCheckout(activeRequest)}
                              disabled={paymentLoading}
                              style={{ ...primaryBtnStyle, opacity: paymentLoading ? 0.7 : 1, cursor: paymentLoading ? "not-allowed" : "pointer" }}
                            >
                              {paymentLoading ? "Processing..." : "Pay ₦3,000 & unlock contact"}
                            </button>
                            <a href={requestSupportLink} target="_blank" rel="noreferrer" style={whatsappBtnStyle}>
                              Need help?
                            </a>
                          </div>
                        </div>
                      )}

                      {!isReleased && contactStatus === "pending" && paymentStatus === "paid" && (
                        <div style={pendingApprovalBoxStyle}>
                          <strong>Payment confirmed.</strong> Your request is awaiting admin approval. Supplier contact will be released shortly.
                        </div>
                      )}

                      {!isReleased && contactStatus === "rejected" && (
                        <div style={rejectedBoxStyle}>
                          Contact release was not approved. Please reach out to support on WhatsApp for assistance.
                        </div>
                      )}

                      {isReleased && (
                        <div style={releasedBoxStyle}>
                          <div style={releasedHeaderStyle}>
                            <span style={releasedIconStyle}>✓</span>
                            <h4 style={{ margin: 0, color: "#065f46", fontSize: 17 }}>Supplier contact details</h4>
                          </div>
                          <div style={quoteStatsGridStyle}>
                            {[
                              { label: "Contact name", value: quote.contact_name || "—" },
                              { label: "Phone", value: quote.contact_phone || "—" },
                              { label: "WeChat", value: quote.contact_wechat || "—" },
                              { label: "Email", value: quote.contact_email || "—" },
                            ].map((c) => (
                              <div key={c.label} style={quoteStatBoxStyle}>
                                <div style={quoteStatLabelStyle}>{c.label}</div>
                                <div style={quoteStatValueStyle}>{c.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={supportBannerStyle}>
              <div>
                <strong style={{ color: "#0f172a", display: "block", marginBottom: 4 }}>Need help with this request?</strong>
                <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                  Our team is on WhatsApp to help with quotes, payment or supplier contact release.
                </p>
              </div>
              <div style={actionRowStyle}>
                <a href={buildWhatsappLink(`Hello Weinly, I need help with request ID: ${activeRequest.id}`)} target="_blank" rel="noreferrer" style={whatsappBtnStyle}>
                  Chat on WhatsApp
                </a>
                <a href="/history" style={ghostBtnStyle}>View full history</a>
              </div>
            </div>
          </section>
        )}

        <SiteFooter />
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif';
const RADIUS_LG = 20;
const RADIUS_MD = 14;
const RADIUS_SM = 10;
const SHADOW = "0 4px 24px rgba(0,0,0,0.06)";
const BORDER = "1px solid #e2e8f0";

/* ─────────────────────────────────────────
   LAYOUT
───────────────────────────────────────── */
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f1f5f9",
  padding: "16px 12px 48px",
  fontFamily: FONT,
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

/* ─────────────────────────────────────────
   HERO
───────────────────────────────────────── */
const heroSectionStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2744 100%)",
  borderRadius: RADIUS_LG,
  padding: "52px 40px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 48,
  alignItems: "center",
  boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
};

const heroInnerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const heroBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 999,
  padding: "6px 14px",
  color: "#94a3b8",
  fontSize: 13,
  fontWeight: 600,
  width: "fit-content",
};

const heroBadgeDotStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#4ade80",
  boxShadow: "0 0 6px #4ade80",
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(2rem, 4vw, 3rem)",
  fontWeight: 800,
  lineHeight: 1.1,
  color: "#f8fafc",
  letterSpacing: "-0.02em",
};

const heroAccentStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #818cf8, #38bdf8)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const heroSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 16,
  lineHeight: 1.75,
  maxWidth: 460,
};

const heroStatsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 28,
  flexWrap: "wrap",
};

const heroStatItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const heroStatValueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#f8fafc",
};

const heroStatLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 500,
};

const heroActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const heroPrimaryBtnStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
  color: "white",
  textDecoration: "none",
  borderRadius: RADIUS_SM,
  padding: "13px 22px",
  fontWeight: 700,
  fontSize: 15,
  display: "inline-flex",
  alignItems: "center",
  boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
};

const heroSecondaryBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#e2e8f0",
  textDecoration: "none",
  borderRadius: RADIUS_SM,
  padding: "13px 22px",
  fontWeight: 600,
  fontSize: 15,
  display: "inline-flex",
  alignItems: "center",
};

const heroFeaturesColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const heroFeatureCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: RADIUS_MD,
  padding: "18px 20px",
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
};

const heroFeatureIconStyle: React.CSSProperties = {
  fontSize: 20,
  color: "#818cf8",
  minWidth: 28,
  marginTop: 2,
};

const heroFeatureTitleStyle: React.CSSProperties = {
  color: "#f1f5f9",
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 4,
};

const heroFeatureTextStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 13,
  lineHeight: 1.65,
};

/* ─────────────────────────────────────────
   SECTION SHARED
───────────────────────────────────────── */
const sectionBase: React.CSSProperties = {
  background: "white",
  border: BORDER,
  borderRadius: RADIUS_LG,
  padding: "40px 36px",
  boxShadow: SHADOW,
};

const sectionLabelStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 12px",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#3b82f6",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

/* ─────────────────────────────────────────
   HOW IT WORKS
───────────────────────────────────────── */
const howItWorksSectionStyle: React.CSSProperties = { ...sectionBase };

const stepsRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
  marginTop: 24,
};

const stepCardStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_MD,
  padding: "24px 22px",
};

const stepNumberStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#3b82f6",
  letterSpacing: "0.06em",
  marginBottom: 10,
};

const stepTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 17,
  fontWeight: 700,
  color: "#0f172a",
};

const stepTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.7,
};

/* ─────────────────────────────────────────
   FORM SECTION
───────────────────────────────────────── */
const formSectionStyle: React.CSSProperties = { ...sectionBase };

const formHeaderStyle: React.CSSProperties = {
  marginBottom: 28,
};

const formSubtitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#64748b",
  lineHeight: 1.7,
  maxWidth: 680,
};

const formBodyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const fieldGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: RADIUS_SM,
  border: "1.5px solid #e2e8f0",
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const fieldHintStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#94a3b8",
  lineHeight: 1.5,
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 4,
};

const lookupBoxStyle: React.CSSProperties = {
  marginTop: 28,
  padding: "22px 24px",
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_MD,
};

const lookupHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
  flexWrap: "wrap",
  gap: 8,
};

const lookupTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "#0f172a",
  fontSize: 15,
};

const lookupHistoryLinkStyle: React.CSSProperties = {
  color: "#3b82f6",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: 13,
};

const lookupRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

/* ─────────────────────────────────────────
   PRICING
───────────────────────────────────────── */
const pricingSectionStyle: React.CSSProperties = { ...sectionBase };

const pricingSubtitleStyle: React.CSSProperties = {
  margin: "8px 0 28px",
  color: "#64748b",
  lineHeight: 1.7,
};

const pricingGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const pricingCardStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_MD,
  padding: "24px 22px",
};

const pricingFeaturedCardStyle: React.CSSProperties = {
  background: "linear-gradient(145deg, #1e1b4b, #312e81)",
  border: "1px solid #4338ca",
  borderRadius: RADIUS_MD,
  padding: "24px 22px",
  position: "relative",
};

const pricingFeaturedBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(255,255,255,0.15)",
  color: "#c7d2fe",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 700,
  marginBottom: 14,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const pricingPlanLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
};

const pricingAmountStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  marginBottom: 10,
};

const pricingDescStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.65,
};

const pricingDividerStyle: React.CSSProperties = {
  height: 1,
  background: "#e2e8f0",
  margin: "18px 0",
};

const pricingItemStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#374151",
  marginBottom: 10,
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
  lineHeight: 1.5,
};

const pricingCheckStyle: React.CSSProperties = {
  color: "#10b981",
  fontWeight: 700,
  flexShrink: 0,
};

/* ─────────────────────────────────────────
   TRUST / FAQ
───────────────────────────────────────── */
const trustSectionStyle: React.CSSProperties = { ...sectionBase };

const trustGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginTop: 24,
  marginBottom: 24,
};

const trustCardStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_MD,
  padding: "20px 18px",
  position: "relative",
  overflow: "hidden",
};

const trustCardAccentStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: 3,
  background: "linear-gradient(90deg, #6366f1, #38bdf8)",
};

const trustCardTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  fontWeight: 700,
  color: "#0f172a",
};

const trustCardTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.7,
};

const faqGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
};

const faqCardStyle: React.CSSProperties = {
  background: "white",
  border: BORDER,
  borderRadius: RADIUS_MD,
  padding: "18px",
};

const faqQuestionStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 15,
  fontWeight: 700,
  color: "#0f172a",
};

const faqAnswerStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.7,
};

/* ─────────────────────────────────────────
   RESULT / TRACKER SHARED
───────────────────────────────────────── */
const resultSectionStyle: React.CSSProperties = { ...sectionBase };
const trackerSectionStyle: React.CSSProperties = { ...sectionBase };

const resultHeaderStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
  marginBottom: 22,
};

const successIconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#d1fae5",
  color: "#065f46",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 18,
  flexShrink: 0,
};

const resultTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
};

const resultSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: 14,
};

const idBoxStyle: React.CSSProperties = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: RADIUS_MD,
  padding: "16px 18px",
  marginBottom: 16,
};

const idLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#15803d",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const idValueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#065f46",
  wordBreak: "break-all",
};

const specBoxStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_MD,
  padding: "16px 18px",
  marginBottom: 14,
};

const specLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 8,
};

const preWrapStyle: React.CSSProperties = {
  margin: 0,
  color: "#334155",
  whiteSpace: "pre-wrap",
  lineHeight: 1.75,
  fontSize: 14,
};

const nextStepBoxStyle: React.CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: RADIUS_MD,
  padding: "16px 18px",
};

/* ─────────────────────────────────────────
   TRACKER
───────────────────────────────────────── */
const trackerHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 22,
  alignItems: "flex-start",
};

const trackerTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
};

const trackerSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: 14,
};

const stagePillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 700,
};

const stageBoxStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_MD,
  padding: "18px",
  marginBottom: 18,
};

const stageTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 17,
  color: "#0f172a",
  marginBottom: 6,
};

const stageTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.7,
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginBottom: 16,
};

const infoBoxStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_SM,
  padding: "12px 14px",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#334155",
  wordBreak: "break-word",
  lineHeight: 1.5,
};

/* ─────────────────────────────────────────
   QUOTES
───────────────────────────────────────── */
const quotesWrapStyle: React.CSSProperties = { marginTop: 6 };

const quotesHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
};

const quotesTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
};

const quotesBadgeStyle: React.CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: 999,
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const emptyQuoteStyle: React.CSSProperties = {
  border: "1.5px dashed #cbd5e1",
  background: "#f8fafc",
  borderRadius: RADIUS_MD,
  padding: "36px 24px",
  textAlign: "center",
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: 28,
  color: "#94a3b8",
  marginBottom: 10,
};

const emptyTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  color: "#475569",
  marginBottom: 6,
};

const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.65,
};

const quoteCardStyle: React.CSSProperties = {
  background: "white",
  border: BORDER,
  borderRadius: RADIUS_MD,
  padding: "22px",
  marginBottom: 14,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const quoteCardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
  alignItems: "flex-start",
};

const quoteSupplierNameStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 4,
};

const quoteSupplierRegionStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b",
};

const quoteStatusPillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const quoteStatsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
  marginTop: 12,
};

const quoteStatBoxStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_SM,
  padding: "12px 14px",
};

const quoteStatLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const quoteStatValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
};

const quoteNoteStyle: React.CSSProperties = {
  marginTop: 14,
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_SM,
  padding: "14px",
};

const actionBoxStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "18px",
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_MD,
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const paymentBoxStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "20px",
  background: "#fafafa",
  border: "1.5px solid #e2e8f0",
  borderRadius: RADIUS_MD,
};

const paymentDetailsStyle: React.CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: RADIUS_SM,
  padding: "14px",
};

const paymentRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "5px 0",
  flexWrap: "wrap",
  fontSize: 14,
};

const pendingApprovalBoxStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "14px 16px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: RADIUS_SM,
  color: "#9a3412",
  fontSize: 14,
  lineHeight: 1.6,
};

const rejectedBoxStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "14px 16px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: RADIUS_SM,
  color: "#991b1b",
  fontSize: 14,
  lineHeight: 1.6,
};

const releasedBoxStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "18px",
  background: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: RADIUS_MD,
};

const releasedHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 14,
};

const releasedIconStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#d1fae5",
  color: "#065f46",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
};

const supportBannerStyle: React.CSSProperties = {
  marginTop: 22,
  padding: "20px 22px",
  background: "#f8fafc",
  border: BORDER,
  borderRadius: RADIUS_MD,
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
  alignItems: "center",
};

/* ─────────────────────────────────────────
   BUTTONS (shared)
───────────────────────────────────────── */
const primaryBtnStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: RADIUS_SM,
  padding: "12px 20px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  borderRadius: RADIUS_SM,
  padding: "12px 20px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const whatsappBtnStyle: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: RADIUS_SM,
  padding: "12px 20px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const ghostBtnStyle: React.CSSProperties = {
  background: "#f1f5f9",
  color: "#475569",
  border: "1px solid #e2e8f0",
  borderRadius: RADIUS_SM,
  padding: "12px 20px",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};