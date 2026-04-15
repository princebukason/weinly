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
const ACCESS_FEE = "₦10,000";
const ACCESS_FEE_KOBO = 1000000;

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

function getStageLabel(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved") return "Supplier contact released";
  if (request.payment_status === "paid") return "Payment received — pending approval";
  if (quoteCount > 0) return "Quotes available";
  if (request.status === "completed") return "Completed";
  return "Submitted — being processed";
}

function getStagePill(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved") return { bg: "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30", label: "Access unlocked" };
  if (request.payment_status === "paid") return { bg: "bg-violet-900/60 text-violet-300 border border-violet-500/30", label: "Paid — awaiting approval" };
  if (quoteCount > 0) return { bg: "bg-blue-900/60 text-blue-300 border border-blue-500/30", label: "Quotes ready" };
  return { bg: "bg-amber-900/60 text-amber-300 border border-amber-500/30", label: "In progress" };
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
  const [activeTab, setActiveTab] = useState<"submit" | "track">("submit");

  async function generateAISpec(userInput: string) {
    try {
      const res = await fetch("/api/spec", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: userInput }) });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.output || null;
    } catch { return null; }
  }

  async function fetchQuotes(id: string) {
    const { data, error } = await supabase.from("quotes").select("*").eq("request_id", id).order("id", { ascending: false });
    if (error) return [];
    return (data || []) as Quote[];
  }

  async function fetchRequest(id: string) {
    const { data, error } = await supabase.from("fabric_requests").select("*").eq("id", id).single();
    if (error) return null;
    return data as FabricRequest;
  }

  async function syncState(id: string) {
    const request = await fetchRequest(id);
    const quotes = await fetchQuotes(id);
    setLookupRequest(request);
    setLookupQuotes(quotes);
    if (submittedRequest?.id === id) { setSubmittedRequest(request); setSubmittedQuotes(quotes); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { alert("Please describe the fabric you need."); return; }
    setLoading(true);
    try {
      const aiOutput = await generateAISpec(description.trim());
      const { data, error } = await supabase.from("fabric_requests").insert([{
        client_name: clientName || null, client_email: clientEmail || null, client_phone: clientPhone || null,
        user_input: description.trim(), ai_output: aiOutput, status: "submitted",
        buyer_requested_contact: false, contact_request_status: "none", payment_status: "unpaid",
      }]).select().single();
      if (error) throw error;
      setSubmittedRequest(data as FabricRequest);
      setSubmittedQuotes([]);
      setRequestId(data.id);
      setLookupId(data.id);
      setActiveTab("track");
      setTimeout(() => document.getElementById("request-result")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { alert("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleLookup(id?: string) {
    const cleanId = (id ?? lookupId).trim();
    if (!cleanId) { alert("Enter a request ID."); return; }
    setLookupLoading(true);
    setLookupRequest(null);
    setLookupQuotes([]);
    try {
      const request = await fetchRequest(cleanId);
      if (!request) { alert("Request not found."); return; }
      const quotes = await fetchQuotes(cleanId);
      setLookupRequest(request);
      setLookupQuotes(quotes);
      setTimeout(() => document.getElementById("request-tracker")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { alert("Failed to fetch request."); }
    finally { setLookupLoading(false); }
  }

  async function requestContact(reqId: string) {
    try {
      const { error } = await supabase.from("fabric_requests").update({
        buyer_requested_contact: true, contact_request_status: "pending",
        payment_status: "unpaid", contact_access_fee: ACCESS_FEE,
      }).eq("id", reqId);
      if (error) throw error;
      await syncState(reqId);
    } catch { alert("Failed to request supplier contact."); }
  }

  async function startPayment(request: FabricRequest) {
    if (!request.client_email) { alert("Your email is required to proceed with payment."); return; }
    if (!PAYSTACK_PUBLIC_KEY) { alert("Payment configuration missing."); return; }
    setPaymentLoading(true);
    try {
      const initRes = await fetch("/api/paystack/initialize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: request.client_email, amount: ACCESS_FEE_KOBO, requestId: request.id, name: request.client_name, phone: request.client_phone }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData?.access_code) { alert(initData?.error || "Failed to initialize payment."); setPaymentLoading(false); return; }
      if (!PaystackPop) { const m = await import("@paystack/inline-js"); PaystackPop = m.default; }
      const popup = new PaystackPop();
      popup.resumeTransaction(initData.access_code, {
        onSuccess: async (transaction: { reference: string }) => {
          try {
            const verifyRes = await fetch("/api/paystack/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: transaction.reference, requestId: request.id, expectedAmount: ACCESS_FEE_KOBO }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) { alert(verifyData?.error || "Verification failed."); return; }
            await syncState(request.id);
            alert("Payment confirmed! Supplier contact will be released after approval.");
          } catch { alert("Payment verification failed."); }
          finally { setPaymentLoading(false); }
        },
        onCancel: () => setPaymentLoading(false),
      });
    } catch { setPaymentLoading(false); alert("Failed to launch payment."); }
  }

  useEffect(() => {
    if (!requestId) return;
    async function refresh() {
      const request = await fetchRequest(requestId);
      const quotes = await fetchQuotes(requestId);
      setSubmittedRequest(request);
      setSubmittedQuotes(quotes);
    }
    refresh();
  }, [requestId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("requestId");
    if (!id) return;
    setLookupId(id);
    setActiveTab("track");
    async function load() {
      const request = await fetchRequest(id!);
      if (!request) return;
      const quotes = await fetchQuotes(id!);
      setLookupRequest(request);
      setLookupQuotes(quotes);
    }
    load();
  }, []);

  const activeRequest = useMemo(() => lookupRequest || submittedRequest, [lookupRequest, submittedRequest]);
  const activeQuotes = useMemo(() => lookupRequest ? lookupQuotes : submittedQuotes, [lookupRequest, lookupQuotes, submittedQuotes]);
  const stagePill = useMemo(() => activeRequest ? getStagePill(activeRequest, activeQuotes.length) : null, [activeRequest, activeQuotes.length]);
  const genericSupportLink = buildWhatsappLink("Hello Weinly, I need help with fabric sourcing.");

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 md:px-4 md:py-4 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-3">

        <SiteHeader />

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] border border-indigo-500/15 rounded-3xl p-6 md:p-12 shadow-2xl shadow-indigo-500/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <span className="text-indigo-300 text-xs font-semibold">Fabric sourcing platform</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">
                Source premium fabrics{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                  directly from China
                </span>
              </h1>

              <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-lg">
                Describe what you need. Get verified supplier quotes. Unlock direct contact and negotiate the best deals — no middlemen.
              </p>

              <div className="flex gap-6 flex-wrap">
                {[{ v: "500+", l: "Verified suppliers" }, { v: "24hr", l: "Avg quote time" }, { v: "₦10k", l: "Contact unlock" }].map((s) => (
                  <div key={s.l} className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-white">{s.v}</span>
                    <span className="text-xs text-slate-500 font-medium">{s.l}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 flex-wrap">
                <button onClick={() => { setActiveTab("submit"); document.getElementById("main-tabs")?.scrollIntoView({ behavior: "smooth" }); }} className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all border-0 cursor-pointer">
                  Start sourcing →
                </button>
                <a href={genericSupportLink} target="_blank" rel="noreferrer" className="bg-white/6 border border-white/12 text-slate-300 font-semibold text-sm px-6 py-3 rounded-xl no-underline hover:bg-white/10 transition-all flex items-center">
                  WhatsApp us
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { icon: "✦", title: "AI spec formatting", text: "Turn rough descriptions into professional sourcing specs instantly.", color: "text-indigo-400" },
                { icon: "◈", title: "Verified quotes first", text: "See price, MOQ and lead time before paying anything.", color: "text-emerald-400" },
                { icon: "⬡", title: "Direct supplier access", text: "Pay ₦10,000 to unlock phone, WeChat and email directly.", color: "text-amber-400" },
              ].map((f) => (
                <div key={f.title} className="bg-white/5 border border-white/8 rounded-2xl p-4 flex gap-4 items-start backdrop-blur-sm">
                  <span className={`text-xl ${f.color} shrink-0 mt-0.5`}>{f.icon}</span>
                  <div>
                    <div className="text-white font-bold text-sm mb-1">{f.title}</div>
                    <div className="text-slate-400 text-xs leading-relaxed">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="bg-[#111827] border border-white/7 rounded-3xl p-6 md:p-10">
          <span className="inline-block bg-indigo-500/12 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">How it works</span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">Three steps to your supplier</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: "01", title: "Submit your request", text: "Describe the fabric you need. AI formats it into a professional sourcing spec.", color: "from-indigo-500 to-indigo-600", textColor: "text-indigo-400" },
              { n: "02", title: "Review supplier quotes", text: "We match you to verified Chinese suppliers. See price, MOQ and lead time first.", color: "from-emerald-500 to-emerald-600", textColor: "text-emerald-400" },
              { n: "03", title: "Unlock & connect", text: "Pay ₦10,000 to unlock direct supplier contact — phone, WeChat, email.", color: "from-amber-500 to-amber-600", textColor: "text-amber-400" },
            ].map((step) => (
              <div key={step.n} className="bg-white/4 border border-white/7 rounded-2xl p-6">
                <div className={`text-xs font-black uppercase tracking-widest ${step.textColor} mb-3`}>{step.n}</div>
                <div className={`w-10 h-1 rounded-full bg-gradient-to-r ${step.color} mb-4`} />
                <h3 className="text-white font-bold text-base mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed m-0">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN TABS ── */}
        <section id="main-tabs" className="bg-[#111827] border border-white/7 rounded-3xl p-4 md:p-8">
          <div className="flex gap-2 mb-6 bg-white/4 border border-white/7 rounded-2xl p-1.5">
            {(["submit", "track"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all ${activeTab === tab ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25" : "text-slate-500 bg-transparent hover:text-slate-300"}`}>
                {tab === "submit" ? "Submit request" : "Track request"}
              </button>
            ))}
          </div>

          {activeTab === "submit" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1">Tell us what you need</h2>
                <p className="text-slate-500 text-sm leading-relaxed m-0">Be detailed — fabric type, color, quantity and quality. Better detail = better quotes.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "Your name", value: clientName, setter: setClientName, placeholder: "e.g. Amaka Obi", type: "text" },
                    { label: "Email address", value: clientEmail, setter: setClientEmail, placeholder: "you@example.com", type: "email" },
                    { label: "WhatsApp / phone", value: clientPhone, setter: setClientPhone, placeholder: "+234 800 000 0000", type: "text" },
                  ].map((field) => (
                    <div key={field.label} className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">{field.label}</label>
                      <input value={field.value} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder} type={field.type} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all" />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fabric description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Example: premium beaded lace for wedding asoebi, navy blue, soft handfeel, 5-yard packs, high-end quality, need at least 50 packs..." rows={5} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all resize-y" />
                  <p className="text-slate-600 text-xs m-0">Include: fabric type · color · quantity · quality level · intended use</p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Processing..." : "Submit fabric request →"}
                  </button>
                  <a href={genericSupportLink} target="_blank" rel="noreferrer" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm px-6 py-3 rounded-xl no-underline hover:bg-emerald-500/15 transition-all flex items-center">
                    Need help?
                  </a>
                </div>
              </form>
            </div>
          )}

          {activeTab === "track" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1">Track your request</h2>
                <p className="text-slate-500 text-sm leading-relaxed m-0">Paste your request ID to see quotes, payment status and supplier contact.</p>
              </div>

              <div className="flex gap-3 flex-wrap">
                <input value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="Paste your request ID here" className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-all" />
                <button onClick={() => handleLookup()} disabled={lookupLoading} className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl border-0 cursor-pointer disabled:opacity-60 shrink-0">
                  {lookupLoading ? "Loading..." : "Track →"}
                </button>
              </div>

              <div className="flex gap-5 flex-wrap">
                <a href="/history" className="text-indigo-400 text-sm font-semibold no-underline hover:text-indigo-300 transition-colors">View all history →</a>
                <a href={genericSupportLink} target="_blank" rel="noreferrer" className="text-emerald-400 text-sm font-semibold no-underline hover:text-emerald-300 transition-colors">Chat support →</a>
              </div>

              {/* Submitted result */}
              {submittedRequest && (
                <div id="request-result" className="bg-indigo-500/6 border border-indigo-500/20 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-base shrink-0 shadow-lg shadow-emerald-500/30">✓</div>
                    <div>
                      <div className="text-white font-bold text-base">Request submitted!</div>
                      <div className="text-slate-500 text-sm">Save your ID to track quotes</div>
                    </div>
                  </div>
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
                    <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Request ID</div>
                    <div className="text-emerald-300 text-sm font-semibold break-all">{submittedRequest.id}</div>
                  </div>
                  {submittedRequest.ai_output != null && (
                    <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">AI sourcing spec</div>
                      <p className="text-slate-400 text-sm leading-relaxed m-0 whitespace-pre-wrap">{formatAiOutput(submittedRequest.ai_output)}</p>
                    </div>
                  )}
                  <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl p-4">
                    <p className="text-slate-400 text-sm leading-relaxed m-0"><strong className="text-white">What happens next?</strong> We are matching your request to verified suppliers. Quotes appear within 24 hours. Use your request ID to check progress anytime.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── TRACKER ── */}
        {activeRequest && stagePill && (
          <section id="request-tracker" className="bg-[#0d1424] border border-indigo-500/15 rounded-3xl p-5 md:p-8 shadow-xl shadow-indigo-500/8 flex flex-col gap-5">
            <div className="flex justify-between gap-4 flex-wrap items-start">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1">Request tracker</h2>
                <p className="text-slate-500 text-sm m-0">Follow quotes, pay and unlock supplier contact</p>
              </div>
              <span className={`text-xs font-bold px-4 py-2 rounded-full ${stagePill.bg}`}>{stagePill.label}</span>
            </div>

            <div className="bg-white/4 border border-white/7 rounded-2xl p-4">
              <div className="text-white font-bold text-base mb-2">{getStageLabel(activeRequest, activeQuotes.length)}</div>
              <p className="text-slate-500 text-sm leading-relaxed m-0">
                {activeRequest.contact_request_status === "approved" ? "Supplier contact approved — direct details visible below." : activeRequest.payment_status === "paid" ? "Payment received. Admin is reviewing — contact will be released shortly." : activeQuotes.length > 0 ? "Quote preview ready. Review below then proceed to unlock supplier contact." : "Request received and being matched to verified suppliers."}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { label: "Request ID", value: activeRequest.id },
                { label: "Buyer", value: activeRequest.client_name || "—" },
                { label: "Status", value: activeRequest.status || "submitted" },
                { label: "Payment", value: activeRequest.payment_status || "unpaid" },
                { label: "Contact status", value: activeRequest.contact_request_status || "none" },
                { label: "Access fee", value: activeRequest.contact_access_fee || "—" },
                { label: "Reference", value: activeRequest.payment_reference || "—" },
                { label: "Paid at", value: activeRequest.paid_at ? new Date(activeRequest.paid_at).toLocaleString() : "—" },
              ].map((info) => (
                <div key={info.label} className="bg-white/4 border border-white/7 rounded-xl p-3">
                  <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">{info.label}</div>
                  <div className="text-slate-300 text-xs leading-relaxed break-words">{info.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white/4 border border-white/7 rounded-xl p-4">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Fabric request</div>
              <p className="text-slate-400 text-sm leading-relaxed m-0 whitespace-pre-wrap">{activeRequest.user_input}</p>
            </div>

            {activeRequest.ai_output != null && (
              <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">AI sourcing spec</div>
                <p className="text-slate-400 text-sm leading-relaxed m-0 whitespace-pre-wrap">{formatAiOutput(activeRequest.ai_output)}</p>
              </div>
            )}

            {/* Quotes */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-lg m-0">Supplier quotes</h3>
                <span className="bg-indigo-500/15 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-full">{activeQuotes.length} {activeQuotes.length === 1 ? "quote" : "quotes"}</span>
              </div>

              {activeQuotes.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-white/2 rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-3">◎</div>
                  <div className="text-slate-400 font-bold mb-2">Sourcing in progress</div>
                  <p className="text-slate-600 text-sm leading-relaxed m-0">Matching your request to verified suppliers. Quotes appear here shortly.</p>
                </div>
              ) : (
                activeQuotes.map((quote) => {
                  const isReleased = !!quote.is_contact_released;
                  const contactStatus = activeRequest.contact_request_status || "none";
                  const paymentStatus = activeRequest.payment_status || "unpaid";
                  const supportLink = buildWhatsappLink(`Hello Weinly, I need help with request ID: ${activeRequest.id}`);

                  return (
                    <div key={quote.id} className="bg-white/3 border border-white/7 rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex justify-between gap-3 flex-wrap items-start">
                        <div>
                          <div className="text-white font-bold text-lg mb-1">{quote.supplier_name || "Verified Supplier"}</div>
                          <div className="text-slate-500 text-xs">{quote.supplier_region || "China"} · Verified partner</div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isReleased ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30" : "bg-blue-900/60 text-blue-300 border border-blue-500/30"}`}>
                          {isReleased ? "Contact released" : "Protected"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        {[{ label: "Price", value: quote.price || "Pending" }, { label: "MOQ", value: quote.moq || "Pending" }, { label: "Lead time", value: quote.lead_time || "—" }, { label: "Region", value: quote.supplier_region || "—" }].map((s) => (
                          <div key={s.label} className="bg-white/4 border border-white/7 rounded-xl p-3">
                            <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</div>
                            <div className="text-white font-semibold text-sm">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {quote.note && (
                        <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Supplier note</div>
                          <p className="text-slate-400 text-sm leading-relaxed m-0 whitespace-pre-wrap">{quote.note}</p>
                        </div>
                      )}

                      {!isReleased && contactStatus === "none" && (
                        <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                          <p className="text-slate-400 text-sm leading-relaxed mb-4 m-0">Supplier contact is protected. Proceed to request access and unlock direct contact details.</p>
                          <div className="flex gap-3 flex-wrap">
                            <button onClick={() => requestContact(activeRequest.id)} className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl border-0 cursor-pointer shadow-lg shadow-indigo-500/25">Proceed to unlock</button>
                            <a href={supportLink} target="_blank" rel="noreferrer" className="bg-white/6 border border-white/10 text-slate-400 font-semibold text-sm px-5 py-2.5 rounded-xl no-underline flex items-center hover:bg-white/10 transition-all">Ask support</a>
                          </div>
                        </div>
                      )}

                      {!isReleased && contactStatus === "pending" && paymentStatus === "unpaid" && (
                        <div className="bg-indigo-500/6 border border-indigo-500/20 rounded-2xl p-5">
                          <h4 className="text-white font-bold text-base mb-4 m-0">Unlock supplier contact</h4>
                          <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl p-4 flex flex-col gap-2 mb-4">
                            {[{ label: "Access fee", value: ACCESS_FEE }, { label: "Payment method", value: "Paystack" }, { label: "Request ID", value: activeRequest.id }].map((row) => (
                              <div key={row.label} className="flex justify-between gap-3 flex-wrap">
                                <span className="text-slate-500 text-sm">{row.label}</span>
                                <strong className="text-white text-sm">{row.value}</strong>
                              </div>
                            ))}
                          </div>
                          <p className="text-slate-500 text-sm leading-relaxed mb-4 m-0">Get direct access to supplier phone, WeChat and contact person. Negotiate better deals without middlemen.</p>
                          <div className="flex gap-3 flex-wrap">
                            <button onClick={() => startPayment(activeRequest)} disabled={paymentLoading} className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl border-0 cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed">
                              {paymentLoading ? "Processing..." : `Pay ${ACCESS_FEE} & unlock`}
                            </button>
                            <a href={supportLink} target="_blank" rel="noreferrer" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm px-5 py-2.5 rounded-xl no-underline flex items-center hover:bg-emerald-500/15 transition-all">Need help?</a>
                          </div>
                        </div>
                      )}

                      {!isReleased && contactStatus === "pending" && paymentStatus === "paid" && (
                        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-amber-300 text-sm leading-relaxed">
                          <strong>Payment confirmed.</strong> Awaiting admin approval — supplier contact will be released shortly.
                        </div>
                      )}

                      {!isReleased && contactStatus === "rejected" && (
                        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm leading-relaxed">
                          Contact release was not approved. Please contact support on WhatsApp for assistance.
                        </div>
                      )}

                      {isReleased && (
                        <div className="bg-emerald-500/6 border border-emerald-500/20 rounded-2xl p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">✓</span>
                            <h4 className="text-emerald-300 font-bold text-base m-0">Supplier contact details</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                            {[{ label: "Contact name", value: quote.contact_name || "—" }, { label: "Phone", value: quote.contact_phone || "—" }, { label: "WeChat", value: quote.contact_wechat || "—" }, { label: "Email", value: quote.contact_email || "—" }].map((c) => (
                              <div key={c.label} className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-3">
                                <div className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">{c.label}</div>
                                <div className="text-emerald-300 font-semibold text-sm break-words">{c.value}</div>
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

            <div className="bg-white/4 border border-white/7 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <div className="text-white font-bold mb-1">Need help with this request?</div>
                <p className="text-slate-500 text-sm m-0">Our team is on WhatsApp for quotes, payment and contact release help.</p>
              </div>
              <div className="flex gap-3 flex-wrap shrink-0">
                <a href={buildWhatsappLink(`Hello Weinly, I need help with request ID: ${activeRequest.id}`)} target="_blank" rel="noreferrer" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm px-5 py-2.5 rounded-xl no-underline hover:bg-emerald-500/15 transition-all flex items-center">Chat on WhatsApp</a>
                <a href="/history" className="bg-white/6 border border-white/10 text-slate-400 font-semibold text-sm px-5 py-2.5 rounded-xl no-underline flex items-center hover:bg-white/10 transition-all">View history</a>
              </div>
            </div>
          </section>
        )}

        {/* ── PRICING ── */}
        <section id="pricing" className="bg-[#111827] border border-white/7 rounded-3xl p-6 md:p-10">
          <span className="inline-block bg-indigo-500/12 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Pricing</span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">Simple, transparent pricing</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 m-0">Start for free. Only pay when you want direct access to a supplier.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/4 border border-white/7 rounded-2xl p-6">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Free</div>
              <div className="text-4xl font-black text-white tracking-tight mb-3">₦0</div>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">Submit requests and get supplier quote previews at no cost.</p>
              <div className="h-px bg-white/7 mb-5" />
              {["Submit fabric requests", "AI sourcing spec", "Quote preview", "Request tracking"].map((item) => (
                <div key={item} className="flex gap-3 items-start text-slate-400 text-sm mb-3"><span className="text-emerald-400 font-bold shrink-0">✓</span>{item}</div>
              ))}
            </div>

            <div className="bg-gradient-to-b from-indigo-950 to-violet-950 border border-indigo-500/30 rounded-2xl p-6 relative">
              <span className="absolute -top-3 left-6 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
              <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">Supplier Contact Unlock</div>
              <div className="text-4xl font-black text-white tracking-tight mb-3">₦10,000</div>
              <p className="text-indigo-300/70 text-sm leading-relaxed mb-5">Get direct access to your matched supplier after admin approval.</p>
              <div className="h-px bg-white/10 mb-5" />
              {["Everything in Free", "Direct phone number", "WeChat ID", "Email address", "Contact person name", "Controlled release process"].map((item) => (
                <div key={item} className="flex gap-3 items-start text-indigo-200 text-sm mb-3"><span className="text-cyan-400 font-bold shrink-0">✓</span>{item}</div>
              ))}
            </div>

            <div className="bg-white/4 border border-white/7 rounded-2xl p-6">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Support</div>
              <div className="text-4xl font-black text-white tracking-tight mb-3">Free</div>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">Talk to our team on WhatsApp before, during or after your request.</p>
              <div className="h-px bg-white/7 mb-5" />
              {["Pre-payment guidance", "Request assistance", "Quote clarification", "Managed sourcing help"].map((item) => (
                <div key={item} className="flex gap-3 items-start text-slate-400 text-sm mb-3"><span className="text-emerald-400 font-bold shrink-0">✓</span>{item}</div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST ── */}
        <section className="bg-[#111827] border border-white/7 rounded-3xl p-6 md:p-10">
          <span className="inline-block bg-indigo-500/12 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Why Weinly</span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">Built for serious fabric buyers</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: "See quotes before paying", text: "Review price, MOQ and lead time before spending anything.", accent: "from-indigo-500 to-indigo-600" },
              { title: "Protected supplier details", text: "Supplier contact stays protected until approval is complete.", accent: "from-emerald-500 to-emerald-600" },
              { title: "China sourcing expertise", text: "Designed for buyers sourcing fabrics from China for Africa.", accent: "from-amber-500 to-amber-600" },
              { title: "WhatsApp support", text: "Real human support throughout your entire sourcing journey.", accent: "from-pink-500 to-pink-600" },
            ].map((t) => (
              <div key={t.title} className="bg-white/4 border border-white/7 rounded-2xl p-5">
                <div className={`w-full h-1 rounded-full bg-gradient-to-r ${t.accent} mb-4`} />
                <h3 className="text-white font-bold text-sm mb-2 m-0">{t.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed m-0">{t.text}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { q: "Do I pay before seeing quotes?", a: "No. You submit your request first, then see quote previews. Payment is only required to unlock direct supplier contact." },
              { q: "What does the unlock fee cover?", a: "Direct supplier phone number, WeChat ID, email address and contact person name when available." },
              { q: "Why are contacts protected?", a: "It keeps the process serious and controlled, ensuring quality interactions between buyers and suppliers." },
              { q: "Can I get help before paying?", a: "Yes, always. Chat with us on WhatsApp at any point during your sourcing journey." },
            ].map((faq) => (
              <div key={faq.q} className="bg-white/4 border border-white/7 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-2 m-0">{faq.q}</h3>
                <p className="text-slate-500 text-xs leading-relaxed m-0">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}