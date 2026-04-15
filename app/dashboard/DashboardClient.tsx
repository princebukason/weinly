"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";

type User = { id: string; email: string; name: string | null; phone: string | null; };

type FabricRequest = {
  id: string; created_at: string; client_name: string | null; client_email: string | null;
  client_phone: string | null; user_input: string; ai_output: unknown; status: string | null;
  contact_request_status: string | null; contact_access_fee: string | null;
  payment_status: string | null; payment_reference: string | null; paid_at: string | null;
};

type Quote = {
  id: string; request_id: string; supplier_name: string; price: string | null;
  moq: string | null; note: string | null; contact_name: string | null;
  contact_phone: string | null; contact_wechat: string | null; contact_email: string | null;
  supplier_region: string | null; lead_time: string | null; is_contact_released: boolean | null;
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

function getStagePill(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved") return { cls: "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30", label: "Access unlocked" };
  if (request.payment_status === "paid") return { cls: "bg-violet-900/60 text-violet-300 border border-violet-500/30", label: "Paid — awaiting approval" };
  if (quoteCount > 0) return { cls: "bg-blue-900/60 text-blue-300 border border-blue-500/30", label: "Quotes ready" };
  return { cls: "bg-amber-900/60 text-amber-300 border border-amber-500/30", label: "In progress" };
}

type Props = { user: User; requests: FabricRequest[]; quotesMap: Record<string, Quote[]>; };

export default function DashboardClient({ user, requests, quotesMap }: Props) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const supportLink = buildWhatsappLink("Hello Weinly, I need help with my account.");

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const totalQuotes = requests.reduce((acc, r) => acc + (quotesMap[r.id]?.length || 0), 0);
  const unlockedCount = requests.filter((r) => r.contact_request_status === "approved").length;
  const pendingCount = requests.filter((r) => r.payment_status !== "paid" && r.contact_request_status !== "approved" && (quotesMap[r.id]?.length || 0) > 0).length;

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 md:px-4 md:py-4 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-3">
        <SiteHeader />

        {/* ── WELCOME BANNER ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] border border-indigo-500/15 rounded-3xl p-6 md:p-8 shadow-2xl shadow-indigo-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <span className="text-indigo-300 text-xs font-semibold">Buyer dashboard</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
                Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
              </h1>
              <p className="text-slate-400 text-sm m-0">{user.email}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a href="/#main-tabs" className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl no-underline shadow-lg shadow-indigo-500/25 flex items-center">
                New request →
              </a>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="bg-white/6 border border-white/10 text-slate-400 font-semibold text-sm px-5 py-2.5 rounded-xl border-0 cursor-pointer hover:bg-white/10 transition-all disabled:opacity-60">
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total requests", value: String(requests.length), color: "text-indigo-400", bg: "bg-indigo-500/8 border-indigo-500/20" },
            { label: "Supplier quotes", value: String(totalQuotes), color: "text-sky-400", bg: "bg-sky-500/8 border-sky-500/20" },
            { label: "Contacts unlocked", value: String(unlockedCount), color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
            { label: "Ready to unlock", value: String(pendingCount), color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/20" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border rounded-2xl p-4`}>
              <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-slate-500 text-xs font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── REQUESTS ── */}
        <section className="bg-[#111827] border border-white/7 rounded-3xl p-5 md:p-8">
          <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1">Your requests</h2>
              <p className="text-slate-500 text-sm m-0">{requests.length === 0 ? "No requests yet" : `${requests.length} request${requests.length === 1 ? "" : "s"} found`}</p>
            </div>
            <a href="/#main-tabs" className="bg-indigo-500/12 text-indigo-400 text-xs font-bold px-4 py-2 rounded-full no-underline hover:bg-indigo-500/20 transition-all border border-indigo-500/20">
              + New request
            </a>
          </div>

          {requests.length === 0 ? (
            <div className="border border-dashed border-white/10 bg-white/2 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">◎</div>
              <div className="text-slate-400 font-bold text-lg mb-2">No requests yet</div>
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto mb-6">
                Submit your first fabric sourcing request and we'll match you with verified Chinese suppliers.
              </p>
              <a href="/#main-tabs" className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl no-underline inline-flex items-center shadow-lg shadow-indigo-500/25">
                Submit first request →
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((request) => {
                const quotes = quotesMap[request.id] || [];
                const pill = getStagePill(request, quotes.length);
                const isExpanded = expandedId === request.id;
                const reqSupportLink = buildWhatsappLink(`Hello Weinly, I need help with request ID: ${request.id}`);

                return (
                  <div key={request.id} className="bg-white/3 border border-white/7 rounded-2xl overflow-hidden">

                    {/* Request summary row */}
                    <div
                      className="p-4 md:p-5 flex justify-between gap-3 flex-wrap items-start cursor-pointer hover:bg-white/2 transition-all"
                      onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pill.cls}`}>{pill.label}</span>
                          <span className="text-slate-600 text-xs">{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed m-0 line-clamp-2">{request.user_input}</p>
                        <div className="text-slate-600 text-xs font-mono break-all">{request.id}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <div className="text-white font-black text-lg">{quotes.length}</div>
                          <div className="text-slate-600 text-xs">quotes</div>
                        </div>
                        <span className={`text-slate-400 text-lg transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>↓</span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-white/6 p-4 md:p-5 flex flex-col gap-4">

                        {/* Info grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          {[
                            { label: "Status", value: request.status || "submitted" },
                            { label: "Payment", value: request.payment_status || "unpaid" },
                            { label: "Contact status", value: request.contact_request_status || "none" },
                            { label: "Access fee", value: request.contact_access_fee || "—" },
                            { label: "Reference", value: request.payment_reference || "—" },
                            { label: "Paid at", value: request.paid_at ? new Date(request.paid_at).toLocaleDateString() : "—" },
                            { label: "Total quotes", value: String(quotes.length) },
                            { label: "Created", value: new Date(request.created_at).toLocaleDateString() },
                          ].map((info) => (
                            <div key={info.label} className="bg-white/4 border border-white/7 rounded-xl p-3">
                              <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">{info.label}</div>
                              <div className="text-slate-300 text-xs break-words">{info.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* AI spec */}
                        {request.ai_output != null && (
                          <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">AI sourcing spec</div>
                            <p className="text-slate-400 text-sm leading-relaxed m-0 whitespace-pre-wrap">{formatAiOutput(request.ai_output)}</p>
                          </div>
                        )}

                        {/* Quotes */}
                        {quotes.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <h3 className="text-white font-bold text-sm m-0">Supplier quotes ({quotes.length})</h3>
                            {quotes.map((quote) => (
                              <div key={quote.id} className="bg-white/4 border border-white/7 rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex justify-between gap-3 flex-wrap">
                                  <div>
                                    <div className="text-white font-bold text-sm mb-1">{quote.supplier_name || "Verified Supplier"}</div>
                                    <div className="text-slate-500 text-xs">{quote.supplier_region || "China"}</div>
                                  </div>
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${quote.is_contact_released ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30" : "bg-blue-900/60 text-blue-300 border border-blue-500/30"}`}>
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
                                    <div key={s.label} className="bg-white/4 border border-white/7 rounded-lg p-2.5">
                                      <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</div>
                                      <div className="text-white font-semibold text-xs">{s.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {quote.is_contact_released && (
                                  <div className="bg-emerald-500/6 border border-emerald-500/20 rounded-xl p-3">
                                    <div className="text-emerald-300 font-bold text-xs mb-2">✓ Supplier contact details</div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {[
                                        { label: "Name", value: quote.contact_name || "—" },
                                        { label: "Phone", value: quote.contact_phone || "—" },
                                        { label: "WeChat", value: quote.contact_wechat || "—" },
                                        { label: "Email", value: quote.contact_email || "—" },
                                      ].map((c) => (
                                        <div key={c.label} className="bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-2">
                                          <div className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-0.5">{c.label}</div>
                                          <div className="text-emerald-300 text-xs font-semibold break-words">{c.value}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 flex-wrap pt-2 border-t border-white/6">
                          <a href={`/?requestId=${request.id}`} className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl no-underline shadow-lg shadow-indigo-500/20 flex items-center">
                            {request.contact_request_status !== "approved" && quotes.length > 0 ? "Unlock supplier contact →" : "Open request →"}
                          </a>
                          <a href={reqSupportLink} target="_blank" rel="noreferrer" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs px-4 py-2.5 rounded-xl no-underline flex items-center hover:bg-emerald-500/15 transition-all">
                            WhatsApp support
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── ACCOUNT ── */}
        <section className="bg-[#111827] border border-white/7 rounded-3xl p-5 md:p-8">
          <h2 className="text-lg font-black text-white tracking-tight mb-4">Account details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {[
              { label: "Full name", value: user.name || "Not set" },
              { label: "Email address", value: user.email },
              { label: "WhatsApp / phone", value: user.phone || "Not set" },
            ].map((info) => (
              <div key={info.label} className="bg-white/4 border border-white/7 rounded-xl p-4">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{info.label}</div>
                <div className="text-white text-sm font-semibold break-words">{info.value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href={supportLink} target="_blank" rel="noreferrer" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm px-5 py-2.5 rounded-xl no-underline hover:bg-emerald-500/15 transition-all flex items-center">
              WhatsApp support
            </a>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-red-500/8 border border-red-500/20 text-red-400 font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer hover:bg-red-500/15 transition-all disabled:opacity-60">
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}