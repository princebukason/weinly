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

          <div className="text-slate-400 text-sm">
            Dashboard content loaded.
          </div>
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