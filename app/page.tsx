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
  if (request.contact_request_status === "approved") {
    return {
      bg: "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30",
      label: "Access unlocked",
    };
  }
  if (request.payment_status === "paid") {
    return {
      bg: "bg-violet-900/60 text-violet-300 border border-violet-500/30",
      label: "Paid — awaiting approval",
    };
  }
  if (quoteCount > 0) {
    return {
      bg: "bg-blue-900/60 text-blue-300 border border-blue-500/30",
      label: "Quotes ready",
    };
  }
  return {
    bg: "bg-amber-900/60 text-amber-300 border border-amber-500/30",
    label: "In progress",
  };
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
      const res = await fetch("/api/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userInput }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.output || null;
    } catch {
      return null;
    }
  }

  async function fetchQuotes(id: string) {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("request_id", id)
      .order("id", { ascending: false });

    if (error) return [];
    return (data || []) as Quote[];
  }

  async function fetchRequest(id: string) {
    const { data, error } = await supabase
      .from("fabric_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as FabricRequest;
  }

  async function syncState(id: string) {
    const request = await fetchRequest(id);
    const quotes = await fetchQuotes(id);
    setLookupRequest(request);
    setLookupQuotes(quotes);

    if (submittedRequest?.id === id) {
      setSubmittedRequest(request);
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
      setActiveTab("track");

      setTimeout(() => {
        document.getElementById("request-result")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      alert("Something went wrong. Please try again.");
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
      const request = await fetchRequest(cleanId);

      if (!request) {
        alert("Request not found.");
        return;
      }

      const quotes = await fetchQuotes(cleanId);
      setLookupRequest(request);
      setLookupQuotes(quotes);

      setTimeout(() => {
        document.getElementById("request-tracker")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      alert("Failed to fetch request.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function requestContact(reqId: string) {
    try {
      const { error } = await supabase
        .from("fabric_requests")
        .update({
          buyer_requested_contact: true,
          contact_request_status: "pending",
          payment_status: "unpaid",
          contact_access_fee: ACCESS_FEE,
        })
        .eq("id", reqId);

      if (error) throw error;
      await syncState(reqId);
    } catch {
      alert("Failed to request supplier contact.");
    }
  }

  async function startPayment(request: FabricRequest) {
    if (!request.client_email) {
      alert("Your email is required to proceed with payment.");
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY) {
      alert("Payment configuration missing.");
      return;
    }

    setPaymentLoading(true);

    try {
      const initRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: request.client_email,
          amount: ACCESS_FEE_KOBO,
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

      if (!PaystackPop) {
        const m = await import("@paystack/inline-js");
        PaystackPop = m.default;
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
                expectedAmount: ACCESS_FEE_KOBO,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              alert(verifyData?.error || "Verification failed.");
              return;
            }

            await syncState(request.id);
            alert("Payment confirmed! Supplier contact will be released after approval.");
          } catch {
            alert("Payment verification failed.");
          } finally {
            setPaymentLoading(false);
          }
        },
        onCancel: () => setPaymentLoading(false),
      });
    } catch {
      setPaymentLoading(false);
      alert("Failed to launch payment.");
    }
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

    const requestIdFromUrl = new URLSearchParams(window.location.search).get("requestId");
    if (!requestIdFromUrl) return;

    const safeRequestId = requestIdFromUrl;

    setLookupId(safeRequestId);
    setActiveTab("track");

    async function load() {
      const request = await fetchRequest(safeRequestId);
      if (!request) return;

      const quotes = await fetchQuotes(safeRequestId);
      setLookupRequest(request);
      setLookupQuotes(quotes);
    }

    load();
  }, []);

  const activeRequest = useMemo(
    () => lookupRequest || submittedRequest,
    [lookupRequest, submittedRequest]
  );

  const activeQuotes = useMemo(
    () => (lookupRequest ? lookupQuotes : submittedQuotes),
    [lookupRequest, lookupQuotes, submittedQuotes]
  );

  const stagePill = useMemo(
    () => (activeRequest ? getStagePill(activeRequest, activeQuotes.length) : null),
    [activeRequest, activeQuotes.length]
  );

  const genericSupportLink = buildWhatsappLink(
    "Hello Weinly, I need help with fabric sourcing."
  );

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <SiteHeader />

        {/* ── HERO ── */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] p-6 shadow-2xl shadow-indigo-500/10 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/8 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <span className="text-xs font-semibold text-indigo-300">
                  Fabric sourcing platform
                </span>
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl">
                Source premium fabrics{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                  directly from China
                </span>
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-slate-400 md:text-lg">
                Describe what you need. Get verified supplier quotes. Unlock direct
                contact and negotiate the best deals — no middlemen.
              </p>

              <div className="flex flex-wrap gap-6">
                {[
                  { v: "500+", l: "Verified suppliers" },
                  { v: "24hr", l: "Avg quote time" },
                  { v: "₦10k", l: "Contact unlock" },
                ].map((s) => (
                  <div key={s.l} className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-white">{s.v}</span>
                    <span className="text-xs font-medium text-slate-500">{s.l}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setActiveTab("submit");
                    document
                      .getElementById("main-tabs")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50"
                >
                  Start sourcing →
                </button>

                <a
                  href={genericSupportLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center rounded-xl border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/10"
                >
                  WhatsApp us
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                {
                  icon: "✦",
                  title: "AI spec formatting",
                  text: "Turn rough descriptions into professional sourcing specs instantly.",
                  color: "text-indigo-400",
                },
                {
                  icon: "◈",
                  title: "Verified quotes first",
                  text: "See price, MOQ and lead time before paying anything.",
                  color: "text-emerald-400",
                },
                {
                  icon: "⬡",
                  title: "Direct supplier access",
                  text: "Pay ₦10,000 to unlock phone, WeChat and email directly.",
                  color: "text-amber-400",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <span className={`mt-0.5 shrink-0 text-xl ${f.color}`}>{f.icon}</span>
                  <div>
                    <div className="mb-1 text-sm font-bold text-white">{f.title}</div>
                    <div className="text-xs leading-relaxed text-slate-400">
                      {f.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section
          id="how-it-works"
          className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10"
        >
          <span className="mb-3 inline-block rounded-full bg-indigo-500/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
            How it works
          </span>
          <h2 className="mb-8 text-2xl font-black tracking-tight text-white md:text-3xl">
            Three steps to your supplier
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Submit your request",
                text: "Describe the fabric you need. AI formats it into a professional sourcing spec.",
                color: "from-indigo-500 to-indigo-600",
                textColor: "text-indigo-400",
              },
              {
                n: "02",
                title: "Review supplier quotes",
                text: "We match you to verified Chinese suppliers. See price, MOQ and lead time first.",
                color: "from-emerald-500 to-emerald-600",
                textColor: "text-emerald-400",
              },
              {
                n: "03",
                title: "Unlock & connect",
                text: "Pay ₦10,000 to unlock direct supplier contact — phone, WeChat, email.",
                color: "from-amber-500 to-amber-600",
                textColor: "text-amber-400",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-white/7 bg-white/4 p-6"
              >
                <div
                  className={`mb-3 text-xs font-black uppercase tracking-widest ${step.textColor}`}
                >
                  {step.n}
                </div>
                <div className={`mb-4 h-1 w-10 rounded-full bg-gradient-to-r ${step.color}`} />
                <h3 className="mb-2 text-base font-bold text-white">{step.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN TABS ── */}
        <section
          id="main-tabs"
          className="rounded-3xl border border-white/7 bg-[#111827] p-4 md:p-8"
        >
          <div className="mb-6 flex gap-2 rounded-2xl border border-white/7 bg-white/4 p-1.5">
            {(["submit", "track"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 cursor-pointer rounded-xl border-0 px-4 py-3 text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab === "submit" ? "Submit request" : "Track request"}
              </button>
            ))}
          </div>

          {activeTab === "submit" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-white md:text-2xl">
                  Tell us what you need
                </h2>
                <p className="m-0 text-sm leading-relaxed text-slate-500">
                  Be detailed — fabric type, color, quantity and quality. Better detail
                  = better quotes.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    {
                      label: "Your name",
                      value: clientName,
                      setter: setClientName,
                      placeholder: "e.g. Amaka Obi",
                      type: "text",
                    },
                    {
                      label: "Email address",
                      value: clientEmail,
                      setter: setClientEmail,
                      placeholder: "you@example.com",
                      type: "email",
                    },
                    {
                      label: "WhatsApp / phone",
                      value: clientPhone,
                      setter: setClientPhone,
                      placeholder: "+234 800 000 0000",
                      type: "text",
                    },
                  ].map((field) => (
                    <div key={field.label} className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {field.label}
                      </label>
                      <input
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        type={field.type}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:bg-indigo-500/5"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Fabric description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Example: premium beaded lace for wedding asoebi, navy blue, soft handfeel, 5-yard packs, high-end quality, need at least 50 packs..."
                    rows={5}
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:bg-indigo-500/5"
                  />
                  <p className="m-0 text-xs text-slate-600">
                    Include: fabric type · color · quantity · quality level · intended
                    use
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Processing..." : "Submit fabric request →"}
                  </button>

                  <a
                    href={genericSupportLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-sm font-bold text-emerald-400 no-underline transition-all hover:bg-emerald-500/15"
                  >
                    Need help?
                  </a>
                </div>
              </form>
            </div>
          )}

          {activeTab === "track" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-white md:text-2xl">
                  Track your request
                </h2>
                <p className="m-0 text-sm leading-relaxed text-slate-500">
                  Paste your request ID to see quotes, payment status and supplier
                  contact.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <input
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="Paste your request ID here"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500"
                />
                <button
                  onClick={() => handleLookup()}
                  disabled={lookupLoading}
                  className="shrink-0 cursor-pointer rounded-xl border-0 bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {lookupLoading ? "Loading..." : "Track →"}
                </button>
              </div>

              <div className="flex flex-wrap gap-5">
                <a
                  href="/history"
                  className="text-sm font-semibold text-indigo-400 no-underline transition-colors hover:text-indigo-300"
                >
                  View all history →
                </a>
                <a
                  href={genericSupportLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-emerald-400 no-underline transition-colors hover:text-emerald-300"
                >
                  Chat support →
                </a>
              </div>

              {submittedRequest && (
                <div
                  id="request-result"
                  className="flex flex-col gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/6 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-base font-black text-white shadow-lg shadow-emerald-500/30">
                      ✓
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">
                        Request submitted!
                      </div>
                      <div className="text-sm text-slate-500">
                        Save your ID to track quotes
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
                      Request ID
                    </div>
                    <div className="break-all text-sm font-semibold text-emerald-300">
                      {submittedRequest.id}
                    </div>
                  </div>

                  {submittedRequest.ai_output != null && (
                    <div className="rounded-xl border border-white/7 bg-white/4 p-4">
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                        AI sourcing spec
                      </div>
                      <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                        {formatAiOutput(submittedRequest.ai_output)}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/8 p-4">
                    <p className="m-0 text-sm leading-relaxed text-slate-400">
                      <strong className="text-white">What happens next?</strong> We are
                      matching your request to verified suppliers. Quotes appear within
                      24 hours. Use your request ID to check progress anytime.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── TRACKER ── */}
        {activeRequest && stagePill && (
          <section
            id="request-tracker"
            className="flex flex-col gap-5 rounded-3xl border border-indigo-500/15 bg-[#0d1424] p-5 shadow-xl shadow-indigo-500/8 md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-white md:text-2xl">
                  Request tracker
                </h2>
                <p className="m-0 text-sm text-slate-500">
                  Follow quotes, pay and unlock supplier contact
                </p>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-xs font-bold ${stagePill.bg}`}
              >
                {stagePill.label}
              </span>
            </div>

            <div className="rounded-2xl border border-white/7 bg-white/4 p-4">
              <div className="mb-2 text-base font-bold text-white">
                {getStageLabel(activeRequest, activeQuotes.length)}
              </div>
              <p className="m-0 text-sm leading-relaxed text-slate-500">
                {activeRequest.contact_request_status === "approved"
                  ? "Supplier contact approved — direct details visible below."
                  : activeRequest.payment_status === "paid"
                  ? "Payment received. Admin is reviewing — contact will be released shortly."
                  : activeQuotes.length > 0
                  ? "Quote preview ready. Review below then proceed to unlock supplier contact."
                  : "Request received and being matched to verified suppliers."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {[
                { label: "Request ID", value: activeRequest.id },
                { label: "Buyer", value: activeRequest.client_name || "—" },
                { label: "Status", value: activeRequest.status || "submitted" },
                { label: "Payment", value: activeRequest.payment_status || "unpaid" },
                {
                  label: "Contact status",
                  value: activeRequest.contact_request_status || "none",
                },
                { label: "Access fee", value: activeRequest.contact_access_fee || "—" },
                { label: "Reference", value: activeRequest.payment_reference || "—" },
                {
                  label: "Paid at",
                  value: activeRequest.paid_at
                    ? new Date(activeRequest.paid_at).toLocaleString()
                    : "—",
                },
              ].map((info) => (
                <div
                  key={info.label}
                  className="rounded-xl border border-white/7 bg-white/4 p-3"
                >
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                    {info.label}
                  </div>
                  <div className="break-words text-xs leading-relaxed text-slate-300">
                    {info.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/7 bg-white/4 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                Fabric request
              </div>
              <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                {activeRequest.user_input}
              </p>
            </div>

            {activeRequest.ai_output != null && (
              <div className="rounded-xl border border-white/7 bg-white/4 p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  AI sourcing spec
                </div>
                <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                  {formatAiOutput(activeRequest.ai_output)}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="m-0 text-lg font-bold text-white">Supplier quotes</h3>
                <span className="rounded-full bg-indigo-500/15 px-3 py-1.5 text-xs font-bold text-indigo-400">
                  {activeQuotes.length} {activeQuotes.length === 1 ? "quote" : "quotes"}
                </span>
              </div>

              {activeQuotes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-10 text-center">
                  <div className="mb-3 text-4xl">◎</div>
                  <div className="mb-2 font-bold text-slate-400">
                    Sourcing in progress
                  </div>
                  <p className="m-0 text-sm leading-relaxed text-slate-600">
                    Matching your request to verified suppliers. Quotes appear here
                    shortly.
                  </p>
                </div>
              ) : (
                activeQuotes.map((quote) => {
                  const isReleased = !!quote.is_contact_released;
                  const contactStatus = activeRequest.contact_request_status || "none";
                  const paymentStatus = activeRequest.payment_status || "unpaid";
                  const supportLink = buildWhatsappLink(
                    `Hello Weinly, I need help with request ID: ${activeRequest.id}`
                  );

                  return (
                    <div
                      key={quote.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/7 bg-white/3 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 text-lg font-bold text-white">
                            {quote.supplier_name || "Verified Supplier"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {quote.supplier_region || "China"} · Verified partner
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                            isReleased
                              ? "border border-emerald-500/30 bg-emerald-900/60 text-emerald-300"
                              : "border border-blue-500/30 bg-blue-900/60 text-blue-300"
                          }`}
                        >
                          {isReleased ? "Contact released" : "Protected"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                        {[
                          { label: "Price", value: quote.price || "Pending" },
                          { label: "MOQ", value: quote.moq || "Pending" },
                          { label: "Lead time", value: quote.lead_time || "—" },
                          { label: "Region", value: quote.supplier_region || "—" },
                        ].map((s) => (
                          <div
                            key={s.label}
                            className="rounded-xl border border-white/7 bg-white/4 p-3"
                          >
                            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                              {s.label}
                            </div>
                            <div className="text-sm font-semibold text-white">
                              {s.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {quote.note && (
                        <div className="rounded-xl border border-white/7 bg-white/4 p-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                            Supplier note
                          </div>
                          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                            {quote.note}
                          </p>
                        </div>
                      )}

                      {!isReleased && contactStatus === "none" && (
                        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-[#111827] to-[#161b2f] p-5">
                          <div className="mb-4">
                            <h4 className="mb-1 text-base font-bold text-white">
                              Unlock supplier contact
                            </h4>
                            <p className="m-0 text-sm leading-relaxed text-slate-400">
                              Choose a one-time unlock or upgrade to Pro for better value.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/4 p-4">
                              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                                One-time unlock
                              </div>
                              <div className="mb-2 text-2xl font-black text-white">
                                ₦10,000
                              </div>
                              <div className="mb-4 text-sm leading-relaxed text-slate-400">
                                Unlock this supplier’s phone, WeChat and email for this
                                request.
                              </div>
                              <button
                                onClick={() => requestContact(activeRequest.id)}
                                className="w-full cursor-pointer rounded-xl border-0 bg-gradient-to-r from-indigo-500 to-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
                              >
                                Proceed to unlock
                              </button>
                            </div>

                            <div className="relative overflow-hidden rounded-xl border border-violet-500/25 bg-violet-500/8 p-4">
                              <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                Best value
                              </span>

                              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-300">
                                Weinly Pro
                              </div>
                              <div className="mb-1 text-2xl font-black text-white">
                                ₦25,000
                                <span className="ml-1 text-sm font-semibold text-slate-400">
                                  /month
                                </span>
                              </div>
                              <div className="mb-3 text-sm leading-relaxed text-slate-300">
                                Includes 3 contact unlocks every month plus priority
                                matching and support.
                              </div>

                              <div className="mb-4 flex flex-col gap-2">
                                {[
                                  "3 unlocks included monthly",
                                  "Priority supplier matching",
                                  "Dedicated support",
                                  "Better value for active buyers",
                                ].map((item) => (
                                  <div
                                    key={item}
                                    className="flex items-start gap-2 text-sm text-slate-300"
                                  >
                                    <span className="text-emerald-400">✓</span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>

                              <a
                                href="/pricing"
                                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-violet-500/20"
                              >
                                Upgrade to Pro
                              </a>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <a
                              href={supportLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center rounded-xl border border-white/10 bg-white/6 px-5 py-2.5 text-sm font-semibold text-slate-400 no-underline transition-all hover:bg-white/10"
                            >
                              Ask support
                            </a>
                          </div>
                        </div>
                      )}

                      {!isReleased &&
                        contactStatus === "pending" &&
                        paymentStatus === "unpaid" && (
                          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/6 p-5">
                            <h4 className="m-0 mb-4 text-base font-bold text-white">
                              Unlock supplier contact
                            </h4>

                            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-indigo-500/15 bg-indigo-500/8 p-4">
                              {[
                                { label: "Access fee", value: ACCESS_FEE },
                                { label: "Payment method", value: "Paystack" },
                                { label: "Request ID", value: activeRequest.id },
                              ].map((row) => (
                                <div
                                  key={row.label}
                                  className="flex flex-wrap justify-between gap-3"
                                >
                                  <span className="text-sm text-slate-500">
                                    {row.label}
                                  </span>
                                  <strong className="text-sm text-white">
                                    {row.value}
                                  </strong>
                                </div>
                              ))}
                            </div>

                            <p className="m-0 mb-4 text-sm leading-relaxed text-slate-500">
                              Get direct access to supplier phone, WeChat and contact
                              person. Negotiate better deals without middlemen.
                            </p>

                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => startPayment(activeRequest)}
                                disabled={paymentLoading}
                                className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-indigo-500 to-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {paymentLoading
                                  ? "Processing..."
                                  : `Pay ${ACCESS_FEE} & unlock`}
                              </button>
                              <a
                                href={supportLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 no-underline transition-all hover:bg-emerald-500/15"
                              >
                                Need help?
                              </a>
                            </div>
                          </div>
                        )}

                      {!isReleased &&
                        contactStatus === "pending" &&
                        paymentStatus === "paid" && (
                          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm leading-relaxed text-amber-300">
                            <strong>Payment confirmed.</strong> Awaiting admin approval —
                            supplier contact will be released shortly.
                          </div>
                        )}

                      {!isReleased && contactStatus === "rejected" && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-4 text-sm leading-relaxed text-red-300">
                          Contact release was not approved. Please contact support on
                          WhatsApp for assistance.
                        </div>
                      )}

                      {isReleased && (
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/6 p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-black text-emerald-400">
                              ✓
                            </span>
                            <h4 className="m-0 text-base font-bold text-emerald-300">
                              Supplier contact details
                            </h4>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                            {[
                              {
                                label: "Contact name",
                                value: quote.contact_name || "—",
                              },
                              { label: "Phone", value: quote.contact_phone || "—" },
                              { label: "WeChat", value: quote.contact_wechat || "—" },
                              { label: "Email", value: quote.contact_email || "—" },
                            ].map((c) => (
                              <div
                                key={c.label}
                                className="rounded-xl border border-emerald-500/15 bg-emerald-500/8 p-3"
                              >
                                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
                                  {c.label}
                                </div>
                                <div className="break-words text-sm font-semibold text-emerald-300">
                                  {c.value}
                                </div>
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

            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/7 bg-white/4 p-5 md:flex-row md:items-center">
              <div>
                <div className="mb-1 font-bold text-white">
                  Need help with this request?
                </div>
                <p className="m-0 text-sm text-slate-500">
                  Our team is on WhatsApp for quotes, payment and contact release help.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <a
                  href={buildWhatsappLink(
                    `Hello Weinly, I need help with request ID: ${activeRequest.id}`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-bold text-emerald-400 no-underline transition-all hover:bg-emerald-500/15"
                >
                  Chat on WhatsApp
                </a>
                <a
                  href="/history"
                  className="flex items-center rounded-xl border border-white/10 bg-white/6 px-5 py-2.5 text-sm font-semibold text-slate-400 no-underline transition-all hover:bg-white/10"
                >
                  View history
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── PRO TEASER ── */}
        <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 to-violet-950 p-6 md:p-10">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
            <div>
              <span className="mb-3 inline-block rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
                Weinly Pro
              </span>

              <h2 className="mb-3 text-2xl font-black tracking-tight text-white md:text-3xl">
                Upgrade when you're ready to move faster
              </h2>

              <p className="mb-5 text-sm leading-relaxed text-slate-400 md:text-base">
                Serious buyers use Weinly Pro to unlock suppliers faster, get priority
                matching, and scale their sourcing business with less risk.
              </p>

              <div className="mb-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  3 unlocks / month
                </span>
                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                  Priority suppliers
                </span>
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                  Dedicated support
                </span>
              </div>

              <a
                href="/pricing"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/20"
              >
                View Pro pricing →
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 text-sm font-bold text-white">
                Why buyers upgrade
              </div>

              <div className="flex flex-col gap-3 text-sm text-slate-300">
                <div className="flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Access suppliers faster when ready to buy</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Reduce delays and middlemen issues</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Make better sourcing decisions</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Scale your fabric business faster</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section
          id="pricing"
          className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10"
        >
          <span className="mb-3 inline-block rounded-full bg-indigo-500/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
            Pricing
          </span>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-white md:text-3xl">
            Simple, transparent pricing
          </h2>
          <p className="m-0 mb-8 text-sm leading-relaxed text-slate-500">
            Start for free. Only pay when you want direct access to a supplier.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/7 bg-white/4 p-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                Free
              </div>
              <div className="mb-3 text-4xl font-black tracking-tight text-white">
                ₦0
              </div>
              <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Submit requests and get supplier quote previews at no cost.
              </p>
              <div className="mb-5 h-px bg-white/7" />
              {[
                "Submit fabric requests",
                "AI sourcing spec",
                "Quote preview",
                "Request tracking",
              ].map((item) => (
                <div
                  key={item}
                  className="mb-3 flex items-start gap-3 text-sm text-slate-400"
                >
                  <span className="shrink-0 font-bold text-emerald-400">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="relative rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950 to-violet-950 p-6">
              <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-bold text-white">
                Most popular
              </span>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
                Supplier Contact Unlock
              </div>
              <div className="mb-3 text-4xl font-black tracking-tight text-white">
                ₦10,000
              </div>
              <p className="mb-5 text-sm leading-relaxed text-indigo-300/70">
                Get direct access to your matched supplier after admin approval.
              </p>
              <div className="mb-5 h-px bg-white/10" />
              {[
                "Everything in Free",
                "Direct phone number",
                "WeChat ID",
                "Email address",
                "Contact person name",
                "Controlled release process",
              ].map((item) => (
                <div
                  key={item}
                  className="mb-3 flex items-start gap-3 text-sm text-indigo-200"
                >
                  <span className="shrink-0 font-bold text-cyan-400">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/7 bg-white/4 p-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                Support
              </div>
              <div className="mb-3 text-4xl font-black tracking-tight text-white">
                Free
              </div>
              <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Talk to our team on WhatsApp before, during or after your request.
              </p>
              <div className="mb-5 h-px bg-white/7" />
              {[
                "Pre-payment guidance",
                "Request assistance",
                "Quote clarification",
                "Managed sourcing help",
              ].map((item) => (
                <div
                  key={item}
                  className="mb-3 flex items-start gap-3 text-sm text-slate-400"
                >
                  <span className="shrink-0 font-bold text-emerald-400">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST ── */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10">
          <span className="mb-3 inline-block rounded-full bg-indigo-500/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
            Why Weinly
          </span>
          <h2 className="mb-8 text-2xl font-black tracking-tight text-white md:text-3xl">
            Built for serious fabric buyers
          </h2>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "See quotes before paying",
                text: "Review price, MOQ and lead time before spending anything.",
                accent: "from-indigo-500 to-indigo-600",
              },
              {
                title: "Protected supplier details",
                text: "Supplier contact stays protected until approval is complete.",
                accent: "from-emerald-500 to-emerald-600",
              },
              {
                title: "China sourcing expertise",
                text: "Designed for buyers sourcing fabrics from China for Africa.",
                accent: "from-amber-500 to-amber-600",
              },
              {
                title: "WhatsApp support",
                text: "Real human support throughout your entire sourcing journey.",
                accent: "from-pink-500 to-pink-600",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="rounded-2xl border border-white/7 bg-white/4 p-5"
              >
                <div className={`mb-4 h-1 w-full rounded-full bg-gradient-to-r ${t.accent}`} />
                <h3 className="m-0 mb-2 text-sm font-bold text-white">{t.title}</h3>
                <p className="m-0 text-xs leading-relaxed text-slate-500">{t.text}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              {
                q: "Do I pay before seeing quotes?",
                a: "No. You submit your request first, then see quote previews. Payment is only required to unlock direct supplier contact.",
              },
              {
                q: "What does the unlock fee cover?",
                a: "Direct supplier phone number, WeChat ID, email address and contact person name when available.",
              },
              {
                q: "Why are contacts protected?",
                a: "It keeps the process serious and controlled, ensuring quality interactions between buyers and suppliers.",
              },
              {
                q: "Can I get help before paying?",
                a: "Yes, always. Chat with us on WhatsApp at any point during your sourcing journey.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/7 bg-white/4 p-5"
              >
                <h3 className="m-0 mb-2 text-sm font-bold text-white">{faq.q}</h3>
                <p className="m-0 text-xs leading-relaxed text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}