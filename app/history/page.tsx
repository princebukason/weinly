"use client";

import { useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";
import { useCurrency } from "@/hooks/useCurrency";

let _supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
  return _supabase;
}

type FabricRequest = {
  id: string;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  user_input: string;
  ai_output: unknown;
  status: string | null;
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
  if (request.contact_request_status === "approved")
    return { cls: "bg-emerald-500/10 text-[#2f7d57] border border-emerald-500/25", label: "Access unlocked" };
  if (request.payment_status === "paid")
    return { cls: "bg-violet-500/10 text-violet-700 border border-violet-500/25", label: "Paid — awaiting approval" };
  if (quoteCount > 0)
    return { cls: "bg-blue-500/10 text-blue-700 border border-blue-500/25", label: "Quotes ready" };
  return { cls: "bg-amber-500/10 text-[#24483f] border border-amber-500/25", label: "In progress" };
}

export default function HistoryPage() {
  const prices = useCurrency();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requests, setRequests] = useState<FabricRequest[]>([]);
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote[]>>({});
  const [searchError, setSearchError] = useState("");

  async function searchHistory(e: React.FormEvent) {
    e.preventDefault();
    setSearchError("");
    if (!email.trim() && !phone.trim()) { setSearchError("Enter your email or phone number to search."); return; }
    setLoading(true);
    setRequests([]);
    setQuotesMap({});
    setSearched(false);
    try {
      let query = getSupabase().from("fabric_requests").select("*").order("created_at", { ascending: false });
      if (email.trim() && phone.trim()) {
        query = query.or(`client_email.eq.${email.trim()},client_phone.eq.${phone.trim()}`);
      } else if (email.trim()) {
        query = query.eq("client_email", email.trim());
      } else {
        query = query.eq("client_phone", phone.trim());
      }
      const { data, error } = await query;
      if (error) throw error;
      const requestList = (data || []) as FabricRequest[];
      setRequests(requestList);
      setSearched(true);
      const ids = requestList.map((r) => r.id);
      if (ids.length > 0) {
        const { data: quoteData, error: quoteError } = await getSupabase()
          .from("quotes").select("*").in("request_id", ids).order("id", { ascending: false });
        if (quoteError) throw quoteError;
        const grouped: Record<string, Quote[]> = {};
        (quoteData || []).forEach((q: any) => {
          const quote = q as Quote;
          if (!grouped[quote.request_id]) grouped[quote.request_id] = [];
          grouped[quote.request_id].push(quote);
        });
        setQuotesMap(grouped);
      }
    } catch { setSearchError("Failed to load request history. Please try again."); }
    finally { setLoading(false); }
  }

  const genericSupportLink = buildWhatsappLink("Hello Weinly, I need help with my request history.");

  return (
    <main className="min-h-screen bg-[#f0f2f0] font-sans">
      <div className="flex w-full flex-col gap-0">
        <SiteHeader />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">

          {/* Header */}
          <section className="rounded-lg border border-[#24483f]/15 bg-[#fffaf2] p-6 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#24483f]/20 bg-[#24483f]/10 px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#2f7d57]" />
              <span className="text-xs font-bold text-[#24483f]">Request history</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1f2933] leading-tight tracking-tight mb-3">
              Your sourcing history
            </h1>
            <p className="text-stone-600 text-base leading-relaxed max-w-xl mb-8">
              Enter the same email or phone number you used when submitting your request to view all your previous sourcing requests and quotes.
            </p>

            <form onSubmit={searchHistory} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-stone-600 text-xs font-bold uppercase tracking-wider">Email address</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    className="w-full px-4 py-3 rounded-md bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-amber-500 focus:bg-amber-500/5 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-stone-600 text-xs font-bold uppercase tracking-wider">WhatsApp / phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-4 py-3 rounded-md bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-amber-500 focus:bg-amber-500/5 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#f59e0b] text-[#1a2e1a] text-white font-bold text-sm px-6 py-3 rounded-md shadow-lg shadow-stone-900/10 border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? "Searching..." : "Search history →"}
                </button>
                <a href="/" className="border border-stone-200 bg-white text-stone-600 font-semibold text-sm px-6 py-3 rounded-md no-underline hover:bg-stone-50 transition-all flex items-center">
                  ← Back to home
                </a>
                <a href={genericSupportLink} target="_blank" rel="noreferrer" className="border border-emerald-500/20 bg-emerald-500/10 text-[#2f7d57] font-semibold text-sm px-6 py-3 rounded-md no-underline hover:bg-emerald-500/15 transition-all flex items-center">
                  WhatsApp support
                </a>
              </div>
              {searchError && (
                <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-600">
                  <span>✕</span><span>{searchError}</span>
                </div>
              )}
            </form>
          </section>

          {/* Results */}
          {searched && (
            <section className="rounded-lg border border-stone-200 bg-white p-5 md:p-8">
              <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-[#1f2933] tracking-tight mb-1">Your requests</h2>
                  <p className="text-stone-500 text-sm m-0">{requests.length === 0 ? "No requests found" : `${requests.length} request${requests.length === 1 ? "" : "s"} found`}</p>
                </div>
                {requests.length > 0 && (
                  <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold px-4 py-2 rounded-full border border-[#f59e0b]/20">{requests.length} {requests.length === 1 ? "result" : "results"}</span>
                )}
              </div>

              {requests.length === 0 ? (
                <div className="border border-dashed border-stone-300 bg-stone-50 rounded-lg p-12 text-center">
                  <div className="text-5xl mb-4">◎</div>
                  <div className="text-stone-500 font-bold text-lg mb-2">No requests found</div>
                  <p className="text-stone-400 text-sm leading-relaxed max-w-sm mx-auto mb-6">
                    We couldn't find any requests matching that email or phone. Make sure you use the same details you submitted with.
                  </p>
                  <a href="/" className="bg-[#f59e0b] text-[#1a2e1a] text-white font-bold text-sm px-6 py-3 rounded-md no-underline inline-flex items-center shadow-lg shadow-stone-900/10">
                    Submit a new request →
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {requests.map((request) => {
                    const quotes = quotesMap[request.id] || [];
                    const pill = getStagePill(request, quotes.length);
                    const supportLink = buildWhatsappLink(`Hello Weinly, I need help with request ID: ${request.id}`);

                    return (
                      <div key={request.id} className="border border-stone-200 bg-stone-50 rounded-lg p-5 flex flex-col gap-4">

                        {/* Request header */}
                        <div className="flex justify-between gap-3 flex-wrap items-start">
                          <div>
                            <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Request ID</div>
                            <div className="text-[#1f2933] font-bold text-sm break-all mb-1">{request.id}</div>
                            <div className="text-stone-400 text-xs">Created: {new Date(request.created_at).toLocaleString()}</div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className="bg-blue-500/10 text-blue-700 border border-blue-500/20 text-xs font-bold px-3 py-1.5 rounded-full">
                              {request.status || "submitted"}
                            </span>
                            <span className="bg-amber-500/10 text-[#24483f] border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-full">
                              {request.payment_status || "unpaid"}
                            </span>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${pill.cls}`}>{pill.label}</span>
                          </div>
                        </div>

                        {/* Stage box */}
                        <div className="bg-white border border-stone-200 rounded-lg p-4">
                          <div className="text-[#1f2933] font-bold text-sm mb-1">{getStageLabel(request, quotes.length)}</div>
                          <p className="text-stone-500 text-xs leading-relaxed m-0">
                            {request.contact_request_status === "approved"
                              ? "Your supplier contact access has been approved. Direct contact details are visible below."
                              : request.payment_status === "paid"
                              ? "Payment received. Admin is reviewing — contact will be released shortly."
                              : quotes.length > 0
                              ? "Quote preview is ready. Go to the tracker to proceed with unlocking supplier contact."
                              : "Request received and being matched to verified suppliers."}
                          </p>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          {[
                            { label: "Buyer", value: request.client_name || "—" },
                            { label: "Email", value: request.client_email || "—" },
                            { label: "Phone", value: request.client_phone || "—" },
                            { label: "Total quotes", value: String(quotes.length) },
                            { label: "Contact status", value: request.contact_request_status || "none" },
                            { label: "Access fee", value: request.contact_access_fee || "—" },
                            { label: "Reference", value: request.payment_reference || "—" },
                            { label: "Paid at", value: request.paid_at ? new Date(request.paid_at).toLocaleString() : "—" },
                          ].map((info) => (
                            <div key={info.label} className="bg-white border border-stone-200 rounded-lg p-3">
                              <div className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">{info.label}</div>
                              <div className="text-stone-600 text-xs leading-relaxed break-words">{info.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Fabric request */}
                        <div className="bg-white border border-stone-200 rounded-lg p-4">
                          <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Fabric request</div>
                          <p className="text-stone-600 text-sm leading-relaxed m-0 whitespace-pre-wrap">{request.user_input}</p>
                        </div>

                        {/* AI spec */}
                        {request.ai_output != null && (
                          <div className="bg-white border border-stone-200 rounded-lg p-4">
                            <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">AI sourcing spec</div>
                            <p className="text-stone-600 text-sm leading-relaxed m-0 whitespace-pre-wrap">{formatAiOutput(request.ai_output)}</p>
                          </div>
                        )}

                        {/* Quotes */}
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <h3 className="text-[#1f2933] font-bold text-base m-0">Supplier quotes</h3>
                            <span className="bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 text-xs font-bold px-3 py-1.5 rounded-full">{quotes.length} {quotes.length === 1 ? "quote" : "quotes"}</span>
                          </div>

                          {quotes.length === 0 ? (
                            <div className="border border-dashed border-stone-300 bg-stone-50 rounded-lg p-6 text-center">
                              <p className="text-stone-400 text-sm m-0">Quotes will appear here once suppliers have been matched.</p>
                            </div>
                          ) : (
                            quotes.map((quote) => (
                              <div key={quote.id} className="bg-white border border-stone-200 rounded-lg p-4 flex flex-col gap-3">
                                <div className="flex justify-between gap-3 flex-wrap items-start">
                                  <div>
                                    <div className="text-[#1f2933] font-bold text-base mb-1">{quote.supplier_name || "Verified Supplier"}</div>
                                    <div className="text-stone-500 text-xs">{quote.supplier_region || "China"} · Verified partner</div>
                                  </div>
                                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${quote.is_contact_released ? "bg-emerald-500/10 text-[#2f7d57] border border-emerald-500/25" : "bg-blue-500/10 text-blue-700 border border-blue-500/25"}`}>
                                    {quote.is_contact_released ? "Contact released" : "Protected"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {[
                                    { label: "Price", value: quote.price || "—" },
                                    { label: "MOQ", value: quote.moq || "—" },
                                    { label: "Lead time", value: quote.lead_time || "—" },
                                    { label: "Region", value: quote.supplier_region || "—" },
                                  ].map((s) => (
                                    <div key={s.label} className="bg-stone-50 border border-stone-200 rounded-md p-2.5">
                                      <div className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</div>
                                      <div className="text-[#1f2933] font-semibold text-sm">{s.value}</div>
                                    </div>
                                  ))}
                                </div>

                                {quote.note && (
                                  <div className="bg-stone-50 border border-stone-200 rounded-md p-3">
                                    <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1.5">Supplier note</div>
                                    <p className="text-stone-600 text-sm leading-relaxed m-0 whitespace-pre-wrap">{quote.note}</p>
                                  </div>
                                )}

                                {quote.is_contact_released ? (
                                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-[#2f7d57] flex items-center justify-center font-black text-xs">✓</span>
                                      <div className="text-[#2f7d57] font-bold text-sm">Supplier contact details</div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {[
                                        { label: "Contact name", value: quote.contact_name || "—" },
                                        { label: "Phone", value: quote.contact_phone || "—" },
                                        { label: "WeChat", value: quote.contact_wechat || "—" },
                                        { label: "Email", value: quote.contact_email || "—" },
                                      ].map((c) => (
                                        <div key={c.label} className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2.5">
                                          <div className="text-[#2f7d57] text-xs font-bold uppercase tracking-wider mb-1">{c.label}</div>
                                          <div className="text-[#24483f] font-semibold text-sm break-words">{c.value}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-stone-50 border border-dashed border-stone-300 rounded-lg p-4">
                                    <div className="text-[#1f2933] font-bold text-sm mb-1">Supplier contact is protected</div>
                                    <p className="text-stone-500 text-xs leading-relaxed m-0">You can preview pricing, MOQ and lead time here. Direct supplier contact is only shown after access is approved and payment is complete.</p>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Unlock CTA */}
                        {quotes.length > 0 && request.contact_request_status !== "approved" && (
                          <div className="bg-[#24483f]/5 border border-[#24483f]/15 rounded-lg p-5">
                            <h4 className="text-[#1f2933] font-bold text-base mb-2 m-0">Ready to unlock supplier contact?</h4>
                            <p className="text-stone-500 text-sm leading-relaxed mb-4 m-0">
                              Get direct access to supplier phone, WeChat and contact person. Pay {prices.unlock} to unlock after approval.
                            </p>
                            <div className="grid grid-cols-2 gap-2.5 mb-4">
                              <div className="bg-white border border-stone-200 rounded-md p-3">
                                <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Access fee</div>
                                <div className="text-[#1f2933] font-bold text-sm">{request.contact_access_fee || prices.unlock}</div>
                              </div>
                              <div className="bg-white border border-stone-200 rounded-md p-3">
                                <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Contact status</div>
                                <div className="text-[#1f2933] font-bold text-sm">{request.contact_request_status || "not requested"}</div>
                              </div>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                              <a href={`/?requestId=${request.id}`} className="bg-[#f59e0b] text-[#1a2e1a] text-white font-bold text-sm px-5 py-2.5 rounded-md no-underline shadow-lg shadow-stone-900/10 flex items-center">
                                Open request & unlock →
                              </a>
                              <a href={supportLink} target="_blank" rel="noreferrer" className="border border-emerald-500/20 bg-emerald-500/10 text-[#2f7d57] font-semibold text-sm px-5 py-2.5 rounded-md no-underline flex items-center hover:bg-emerald-500/15 transition-all">
                                Chat on WhatsApp
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Footer row */}
                        <div className="flex justify-between items-center gap-3 flex-wrap pt-2 border-t border-stone-200">
                          <p className="text-stone-400 text-xs m-0">Need help? Contact Weinly support on WhatsApp.</p>
                          <a href={`/?requestId=${request.id}`} className="text-[#f59e0b] text-sm font-bold no-underline hover:text-[#24483f] transition-colors">
                            Track this request →
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Trust / FAQ */}
          <section className="rounded-lg border border-stone-200 bg-white p-6 md:p-10">
            <span className="inline-block bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Why Weinly</span>
            <h2 className="text-2xl md:text-3xl font-black text-[#1f2933] tracking-tight mb-2">Why buyers trust Weinly</h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-8 m-0">Clear answers for buyers who want confidence before requesting quotes or paying to unlock supplier contact.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { title: "Quote preview first", text: "See price, MOQ, lead time and supplier notes before paying anything for direct contact.", accent: "from-amber-500 to-amber-600" },
                { title: "Protected supplier access", text: "Supplier contact details are released only after the proper access flow is completed.", accent: "from-emerald-500 to-emerald-600" },
                { title: "Built for China sourcing", text: "Designed for buyers sourcing fabrics from China, especially for the African market.", accent: "from-[#c9935b] to-[#a75635]" },
              ].map((t) => (
                <div key={t.title} className="border border-stone-200 bg-stone-50 rounded-lg p-5">
                  <div className={`w-full h-1 rounded-full bg-gradient-to-r ${t.accent} mb-4`} />
                  <h3 className="text-[#1f2933] font-bold text-sm mb-2 m-0">{t.title}</h3>
                  <p className="text-stone-500 text-xs leading-relaxed m-0">{t.text}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {[
                { q: "Do I need to pay before getting quotes?", a: "No. The request flow starts first. You can review quote previews before paying to unlock direct supplier contact." },
                { q: "What does the unlock fee cover?", a: "The fee covers access to direct supplier details — contact name, phone number, WeChat and email when available." },
                { q: "Why are supplier contacts protected?", a: "This keeps the sourcing process controlled and helps maintain quality, trust and proper buyer flow inside Weinly." },
                { q: "What if I need help with my request?", a: "Contact Weinly support on WhatsApp anytime for help with history, quotes, payment or supplier access." },
              ].map((faq) => (
                <div key={faq.q} className="border border-stone-200 bg-stone-50 rounded-lg p-5">
                  <h3 className="text-[#1f2933] font-bold text-sm mb-2 m-0">{faq.q}</h3>
                  <p className="text-stone-500 text-xs leading-relaxed m-0">{faq.a}</p>
                </div>
              ))}
            </div>

            <div className="border border-[#24483f]/20 bg-[#24483f]/5 rounded-lg p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <h3 className="text-[#1f2933] font-bold text-base mb-1 m-0">Still need help?</h3>
                <p className="text-stone-500 text-sm m-0">Chat with Weinly support for help finding your request, understanding quotes or unlocking supplier contact.</p>
              </div>
              <a href={genericSupportLink} target="_blank" rel="noreferrer" className="border border-emerald-500/20 bg-emerald-500/10 text-[#2f7d57] font-bold text-sm px-6 py-3 rounded-md no-underline hover:bg-emerald-500/15 transition-all flex items-center shrink-0">
                Chat on WhatsApp →
              </a>
            </div>
          </section>

        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
