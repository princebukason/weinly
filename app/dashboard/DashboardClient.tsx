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
  if (request.contact_request_status === "approved") {
    return {
      cls: "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30",
      label: "Access unlocked",
    };
  }
  if (request.payment_status === "paid") {
    return {
      cls: "bg-violet-900/60 text-violet-300 border border-violet-500/30",
      label: "Paid — awaiting approval",
    };
  }
  if (quoteCount > 0) {
    return {
      cls: "bg-blue-900/60 text-blue-300 border border-blue-500/30",
      label: "Quotes ready",
    };
  }
  return {
    cls: "bg-amber-900/60 text-amber-300 border border-amber-500/30",
    label: "In progress",
  };
}

export default function DashboardClient({
  user,
  requests,
  quotesMap,
  isPro,
  subscription,
}: Props) {
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

  const totalQuotes = requests.reduce(
    (acc, request) => acc + (quotesMap[request.id]?.length || 0),
    0
  );

  const unlockedCount = requests.filter(
    (request) => request.contact_request_status === "approved"
  ).length;

  const pendingCount = requests.filter(
    (request) =>
      request.payment_status !== "paid" &&
      request.contact_request_status !== "approved" &&
      (quotesMap[request.id]?.length || 0) > 0
  ).length;

  const stats = [
    {
      label: "Total requests",
      value: String(requests.length),
      color: "text-indigo-400",
      bg: "bg-indigo-500/8 border-indigo-500/20",
    },
    {
      label: "Supplier quotes",
      value: String(totalQuotes),
      color: "text-sky-400",
      bg: "bg-sky-500/8 border-sky-500/20",
    },
    {
      label: "Contacts unlocked",
      value: String(unlockedCount),
      color: "text-emerald-400",
      bg: "bg-emerald-500/8 border-emerald-500/20",
    },
    {
      label: "Ready to unlock",
      value: String(pendingCount),
      color: "text-amber-400",
      bg: "bg-amber-500/8 border-amber-500/20",
    },
    {
      label: isPro ? "Pro unlocks/month" : "Upgrade to Pro",
      value: isPro ? "3/month" : "Free",
      color: isPro ? "text-violet-400" : "text-slate-500",
      bg: isPro ? "bg-violet-500/8 border-violet-500/20" : "bg-white/4 border-white/7",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 md:px-4 md:py-4 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-3">
        <SiteHeader />

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

              {isPro && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-full px-3 py-1 mt-2">
                  <span className="text-xs">✨</span>
                  <span className="text-indigo-300 text-xs font-bold">Weinly Pro</span>
                  {subscription?.expires_at && (
                    <span className="text-indigo-400/60 text-xs">
                      {" · expires "}
                      {new Date(subscription.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <a
                href="/#main-tabs"
                className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl no-underline shadow-lg shadow-indigo-500/25 flex items-center"
              >
                New request
              </a>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="bg-white/6 border border-white/10 text-slate-400 font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer transition-all disabled:opacity-60"
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className={`border rounded-2xl p-4 ${stat.bg}`}>
              <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-500 text-xs font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {!isPro && (
          <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border border-indigo-500/20 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✨</span>
                <span className="text-white font-bold text-sm">Upgrade to Weinly Pro</span>
              </div>
              <p className="text-slate-400 text-xs m-0 leading-relaxed">
                Get 3 contact unlocks/month, priority matching and dedicated support for ₦25,000/month.
              </p>
            </div>

            <a
              href="/pricing"
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl no-underline shadow-lg shadow-indigo-500/20 whitespace-nowrap flex items-center shrink-0"
            >
              Upgrade to Pro
            </a>
          </div>
        )}

        <section className="bg-[#111827] border border-white/7 rounded-3xl p-5 md:p-8">
          <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1">
                Your requests
              </h2>
              <p className="text-slate-500 text-sm m-0">
                {requests.length === 0 ? "No requests yet" : `${requests.length} request${requests.length === 1 ? "" : "s"} found`}
              </p>
            </div>
            <a
              href="/#main-tabs"
              className="bg-indigo-500/12 text-indigo-400 text-xs font-bold px-4 py-2 rounded-full no-underline border border-indigo-500/20"
            >
              + New request
            </a>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <div className="mb-3 text-4xl">◎</div>
              <div className="mb-2 font-bold text-slate-400">No requests yet</div>
              <p className="m-0 mb-5 text-sm text-slate-600">Submit your first fabric sourcing request and quotes will appear here.</p>
              <a href="/#main-tabs" className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/25">
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
                  <div key={request.id} className="rounded-2xl border border-white/7 bg-white/3 overflow-hidden">
                    {/* Request header — always visible */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : request.id)}
                      className="w-full text-left p-4 md:p-5 flex flex-col gap-3 cursor-pointer bg-transparent border-0"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
                            {request.user_input.length > 80 ? request.user_input.slice(0, 80) + "…" : request.user_input}
                          </div>
                          <div className="text-xs text-slate-600">
                            {new Date(request.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            {" · "}ID: <span className="font-mono text-slate-500">{request.id.slice(0, 8)}…</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${pill.cls}`}>{pill.label}</span>
                          <span className="text-slate-600 text-sm">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <span className="text-xs text-slate-500">{quotes.length} {quotes.length === 1 ? "quote" : "quotes"}</span>
                        {unlockedQuotes.length > 0 && (
                          <span className="text-xs text-emerald-400 font-semibold">{unlockedQuotes.length} contact{unlockedQuotes.length !== 1 ? "s" : ""} unlocked</span>
                        )}
                        {request.payment_status === "paid" && request.contact_request_status !== "approved" && (
                          <span className="text-xs text-violet-400 font-semibold">Awaiting approval</span>
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-white/7 p-4 md:p-5 flex flex-col gap-4">
                        {/* Request ID with copy */}
                        <div className="flex items-center gap-3 rounded-xl border border-white/7 bg-white/4 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-0.5">Request ID</div>
                            <div className="text-xs font-mono text-slate-300 break-all">{request.id}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(request.id)}
                            className="shrink-0 rounded-lg border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-pointer hover:text-white transition-colors"
                          >
                            Copy
                          </button>
                        </div>

                        {/* Fabric description */}
                        <div className="rounded-xl border border-white/7 bg-white/4 p-4">
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Your request</div>
                          <p className="m-0 text-sm leading-relaxed text-slate-400 whitespace-pre-wrap">{request.user_input}</p>
                        </div>

                        {/* Status grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { label: "Status", value: request.status || "submitted" },
                            { label: "Payment", value: request.payment_status || "unpaid" },
                            { label: "Contact", value: request.contact_request_status || "none" },
                            { label: "Quotes", value: String(quotes.length) },
                          ].map((info) => (
                            <div key={info.label} className="rounded-xl border border-white/7 bg-white/4 p-3">
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{info.label}</div>
                              <div className="text-sm font-semibold text-slate-300">{info.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Quotes */}
                        {quotes.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <div className="text-sm font-bold text-white">Supplier quotes</div>
                            {quotes.map((quote) => (
                              <div key={quote.id} className="rounded-xl border border-white/7 bg-white/4 p-4 flex flex-col gap-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <div className="text-sm font-bold text-white">{quote.supplier_name || "Verified Supplier"}</div>
                                    <div className="text-xs text-slate-500">{quote.supplier_region || "China"}</div>
                                  </div>
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${quote.is_contact_released ? "border border-emerald-500/30 bg-emerald-900/60 text-emerald-300" : "border border-blue-500/30 bg-blue-900/60 text-blue-300"}`}>
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
                                    <div key={s.label} className="rounded-lg border border-white/7 bg-white/4 p-2.5">
                                      <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-0.5">{s.label}</div>
                                      <div className="text-xs font-semibold text-white">{s.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {quote.is_contact_released && (
                                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                      { label: "Contact", value: quote.contact_name || "—" },
                                      { label: "Phone", value: quote.contact_phone || "—" },
                                      { label: "WeChat", value: quote.contact_wechat || "—" },
                                      { label: "Email", value: quote.contact_email || "—" },
                                    ].map((c) => (
                                      <div key={c.label}>
                                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-0.5">{c.label}</div>
                                        <div className="text-xs font-semibold text-emerald-300 break-words">{c.value}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Track / unlock CTA */}
                        <div className="flex flex-wrap gap-3">
                          <a
                            href={`/?requestId=${request.id}#main-tabs`}
                            className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-5 py-2.5 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/20"
                          >
                            {quotes.length > 0 && request.contact_request_status !== "approved" ? "Unlock supplier →" : "View tracker →"}
                          </a>
                          <a
                            href={buildWhatsappLink(`Hello Weinly, I need help with request ID: ${request.id}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 no-underline"
                          >
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

        <section className="bg-[#111827] border border-white/7 rounded-3xl p-5 md:p-8">
          <h2 className="text-lg font-black text-white tracking-tight mb-4">Account details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {[
              { label: "Full name", value: user.name || "Not set" },
              { label: "Email address", value: user.email },
              { label: "WhatsApp / phone", value: user.phone || "Not set" },
            ].map((info) => (
              <div key={info.label} className="bg-white/4 border border-white/7 rounded-xl p-4">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                  {info.label}
                </div>
                <div className="text-white text-sm font-semibold break-words">{info.value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <a
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm px-5 py-2.5 rounded-xl no-underline flex items-center"
            >
              WhatsApp support
            </a>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-red-500/8 border border-red-500/20 text-red-400 font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}