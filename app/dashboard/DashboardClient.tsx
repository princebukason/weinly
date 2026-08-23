"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";

type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
};

type FabricRequest = {
  id: string;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  user_input: string;
  ai_output: unknown;
  status: string | null;
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

type Props = {
  user: User;
  requests: FabricRequest[];
  quotesMap: Record<string, Quote[]>;
  isPro: boolean;
  subscription: {
    plan?: string | null;
    expires_at?: string | null;
  } | null;
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
  if (request.contact_request_status === "approved")
    return { cls: "bg-emerald-500/10 text-[#2f7d57] border border-emerald-500/25", label: "Access unlocked" };
  if (request.payment_status === "paid")
    return { cls: "bg-violet-500/10 text-violet-700 border border-violet-500/25", label: "Paid — awaiting approval" };
  if (quoteCount > 0)
    return { cls: "bg-blue-500/10 text-blue-700 border border-blue-500/25", label: "Quotes ready" };
  return { cls: "bg-amber-500/10 text-[#24483f] border border-amber-500/25", label: "In progress" };
}

export default function DashboardClient({ user, requests, quotesMap, isPro, subscription }: Props) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const supportLink = buildWhatsappLink("Hello Weinly, I need help with my account.");

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const totalQuotes = requests.reduce((acc, r) => acc + (quotesMap[r.id]?.length || 0), 0);
  const unlockedCount = requests.filter((r) => r.contact_request_status === "approved").length;
  const pendingCount = requests.filter(
    (r) => r.payment_status !== "paid" && r.contact_request_status !== "approved" && (quotesMap[r.id]?.length || 0) > 0
  ).length;

  const stats = [
    { label: "Total requests", value: String(requests.length), color: "text-[#24483f]", bg: "bg-[#24483f]/8 border-[#24483f]/20" },
    { label: "Supplier quotes", value: String(totalQuotes), color: "text-[#2f7d57]", bg: "bg-emerald-500/8 border-emerald-500/20" },
    { label: "Contacts unlocked", value: String(unlockedCount), color: "text-[#2f7d57]", bg: "bg-emerald-500/8 border-emerald-500/20" },
    { label: "Ready to unlock", value: String(pendingCount), color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/8 border-[#f59e0b]/20" },
    {
      label: isPro ? "Pro unlocks/month" : "Upgrade to Pro",
      value: isPro ? "3/month" : "Free",
      color: isPro ? "text-[#24483f]" : "text-stone-500",
      bg: isPro ? "bg-[#24483f]/8 border-[#24483f]/20" : "bg-stone-50 border-stone-200",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f0f2f0] font-sans">
      <div className="flex w-full flex-col gap-0">
        <SiteHeader />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">

          {/* Hero */}
          <section className="rounded-lg border border-[#24483f]/15 bg-[#fffaf2] p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#24483f]/20 bg-[#24483f]/10 px-4 py-1.5 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#2f7d57]" />
                  <span className="text-xs font-bold text-[#24483f]">Buyer dashboard</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-[#1f2933] tracking-tight mb-1">
                  Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-stone-500 text-sm m-0">{user.email}</p>
                {isPro && (
                  <div className="inline-flex items-center gap-2 bg-[#24483f]/10 border border-[#24483f]/20 rounded-full px-3 py-1 mt-2">
                    <span className="text-xs">✨</span>
                    <span className="text-[#24483f] text-xs font-bold">Weinly Pro</span>
                    {subscription?.expires_at && (
                      <span className="text-stone-400 text-xs">
                        {" · expires "}
                        {new Date(subscription.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                <a href="/#main-tabs"
                  className="bg-[#f59e0b] text-[#1a2e1a] text-white font-bold text-sm px-5 py-2.5 rounded-md no-underline shadow-lg shadow-stone-900/10 flex items-center">
                  New request
                </a>
                <button onClick={handleLogout} disabled={loggingOut}
                  className="border border-stone-200 bg-white text-stone-600 font-semibold text-sm px-5 py-2.5 rounded-md cursor-pointer transition-all disabled:opacity-60">
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            </div>
          </section>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className={`border rounded-lg p-4 ${stat.bg}`}>
                <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-stone-500 text-xs font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Pro upsell */}
          {!isPro && (
            <div className="rounded-lg border border-[#24483f]/20 bg-gradient-to-r from-[#fbf6ed] to-[#efe3d0] p-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">✨</span>
                  <span className="text-[#1f2933] font-bold text-sm">Upgrade to Weinly Pro</span>
                </div>
                <p className="text-stone-500 text-xs m-0 leading-relaxed">
                  Get 3 contact unlocks/month, priority matching and dedicated support for ₦25,000/month.
                </p>
              </div>
              <a href="/pricing"
                className="bg-gradient-to-r from-[#24483f] to-[#18362f] text-white font-bold text-sm px-5 py-2.5 rounded-md no-underline shadow-lg shadow-stone-900/10 whitespace-nowrap flex items-center shrink-0">
                Upgrade to Pro
              </a>
            </div>
          )}

          {/* Requests */}
          <section className="rounded-lg border border-stone-200 bg-white p-5 md:p-8">
            <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#1f2933] tracking-tight mb-1">Your requests</h2>
                <p className="text-stone-500 text-sm m-0">
                  {requests.length === 0 ? "No requests yet" : `${requests.length} request${requests.length === 1 ? "" : "s"} found`}
                </p>
              </div>
              <a href="/#main-tabs"
                className="bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold px-4 py-2 rounded-full no-underline border border-[#f59e0b]/20">
                + New request
              </a>
            </div>

            {requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-300 p-10 text-center">
                <div className="mb-3 text-4xl">◎</div>
                <div className="mb-2 font-bold text-stone-500">No requests yet</div>
                <p className="m-0 mb-5 text-sm text-stone-400">Submit your first fabric sourcing request and quotes will appear here.</p>
                <a href="/#main-tabs" className="inline-flex items-center rounded-md bg-[#f59e0b] text-[#1a2e1a] px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-stone-900/10">
                  Start sourcing →
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((request) => {
                  const quotes = quotesMap[request.id] || [];
                  const pill = getStagePill(request, quotes.length);
                  const isExpanded = expandedId === request.id;
                  const unlockedQuotes = quotes.filter((q) => q.is_contact_released);

                  return (
                    <div key={request.id} className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : request.id)}
                        className="w-full text-left p-4 md:p-5 flex flex-col gap-3 cursor-pointer bg-transparent border-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="text-sm font-bold text-[#1f2933] truncate max-w-xs md:max-w-md">
                              {request.user_input.length > 80 ? request.user_input.slice(0, 80) + "…" : request.user_input}
                            </div>
                            <div className="text-xs text-stone-400">
                              {new Date(request.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              {" · "}ID: <span className="font-mono text-stone-400">{request.id.slice(0, 8)}…</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${pill.cls}`}>{pill.label}</span>
                            <span className="text-stone-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <span className="text-xs text-stone-400">{quotes.length} {quotes.length === 1 ? "quote" : "quotes"}</span>
                          {unlockedQuotes.length > 0 && (
                            <span className="text-xs text-[#2f7d57] font-semibold">{unlockedQuotes.length} contact{unlockedQuotes.length !== 1 ? "s" : ""} unlocked</span>
                          )}
                          {request.payment_status === "paid" && request.contact_request_status !== "approved" && (
                            <span className="text-xs text-violet-600 font-semibold">Awaiting approval</span>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-stone-200 p-4 md:p-5 flex flex-col gap-4 bg-white">
                          {/* Request ID */}
                          <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-0.5">Request ID</div>
                              <div className="text-xs font-mono text-stone-600 break-all">{request.id}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(request.id)}
                              className="shrink-0 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 cursor-pointer hover:text-[#1f2933] transition-colors">
                              Copy
                            </button>
                          </div>

                          {/* Fabric description */}
                          <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
                            <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Your request</div>
                            <p className="m-0 text-sm leading-relaxed text-stone-600 whitespace-pre-wrap">{request.user_input}</p>
                          </div>

                          {/* Status grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[
                              { label: "Status", value: request.status || "submitted" },
                              { label: "Payment", value: request.payment_status || "unpaid" },
                              { label: "Contact", value: request.contact_request_status || "none" },
                              { label: "Quotes", value: String(quotes.length) },
                            ].map((info) => (
                              <div key={info.label} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                                <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">{info.label}</div>
                                <div className="text-sm font-semibold text-[#1f2933]">{info.value}</div>
                              </div>
                            ))}
                          </div>

                          {/* Quotes */}
                          {quotes.length > 0 && (
                            <div className="flex flex-col gap-3">
                              <div className="text-sm font-bold text-[#1f2933]">Supplier quotes</div>
                              {quotes.map((quote) => (
                                <div key={quote.id} className="rounded-md border border-stone-200 bg-stone-50 p-4 flex flex-col gap-3">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                      <div className="text-sm font-bold text-[#1f2933]">{quote.supplier_name || "Verified Supplier"}</div>
                                      <div className="text-xs text-stone-500">{quote.supplier_region || "China"}</div>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${quote.is_contact_released ? "border border-emerald-500/25 bg-emerald-500/10 text-[#2f7d57]" : "border border-blue-500/25 bg-blue-500/10 text-blue-700"}`}>
                                      {quote.is_contact_released ? "Contact released" : "Protected"}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                      { label: "Price", value: quote.price || "Pending" },
                                      { label: "MOQ", value: quote.moq || "Pending" },
                                      { label: "Lead time", value: quote.lead_time || "—" },
                                      { label: "Region", value: quote.supplier_region || "—" },
                                    ].map((s) => (
                                      <div key={s.label} className="rounded-md border border-stone-200 bg-white p-2.5">
                                        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-0.5">{s.label}</div>
                                        <div className="text-xs font-semibold text-[#1f2933]">{s.value}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {quote.is_contact_released && (
                                    <div className="rounded-md border border-emerald-500/20 bg-emerald-500/8 p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {[
                                        { label: "Contact", value: quote.contact_name || "—" },
                                        { label: "Phone", value: quote.contact_phone || "—" },
                                        { label: "WeChat", value: quote.contact_wechat || "—" },
                                        { label: "Email", value: quote.contact_email || "—" },
                                      ].map((c) => (
                                        <div key={c.label}>
                                          <div className="text-xs font-bold uppercase tracking-wider text-[#2f7d57] mb-0.5">{c.label}</div>
                                          <div className="text-xs font-semibold text-[#24483f] break-words">{c.value}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* CTAs */}
                          <div className="flex flex-wrap gap-3">
                            <a href={`/?requestId=${request.id}#main-tabs`}
                              className="inline-flex items-center rounded-md bg-[#f59e0b] text-[#1a2e1a] px-5 py-2.5 text-sm font-bold text-white no-underline shadow-lg shadow-stone-900/10">
                              {quotes.length > 0 && request.contact_request_status !== "approved" ? "Unlock supplier →" : "View tracker →"}
                            </a>
                            <a href={buildWhatsappLink(`Hello Weinly, I need help with request ID: ${request.id}`)}
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-[#2f7d57] no-underline">
                              WhatsApp help
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

          {/* Account details */}
          <section className="rounded-lg border border-stone-200 bg-white p-5 md:p-8">
            <h2 className="text-lg font-black text-[#1f2933] tracking-tight mb-4">Account details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {[
                { label: "Full name", value: user.name || "Not set" },
                { label: "Email address", value: user.email },
                { label: "WhatsApp / phone", value: user.phone || "Not set" },
              ].map((info) => (
                <div key={info.label} className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                  <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">{info.label}</div>
                  <div className="text-[#1f2933] text-sm font-semibold break-words">{info.value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <a href={supportLink} target="_blank" rel="noreferrer"
                className="border border-emerald-500/20 bg-emerald-500/10 text-[#2f7d57] font-semibold text-sm px-5 py-2.5 rounded-md no-underline flex items-center">
                WhatsApp support
              </a>
              <button onClick={handleLogout} disabled={loggingOut}
                className="bg-red-500/8 border border-red-500/20 text-red-600 font-semibold text-sm px-5 py-2.5 rounded-md cursor-pointer disabled:opacity-60">
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </section>

        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
