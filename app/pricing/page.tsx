"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";

let PaystackPop: any = null;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const supportLink = buildWhatsappLink("Hello Weinly, I want to upgrade to Pro.");

  async function handleProPayment(plan: "pro_monthly" | "pro_yearly") {
    setLoading(plan);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = "/auth?next=/pricing";
        return;
      }

      const initRes = await fetch("/api/paystack/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "",
          phone: session.user.user_metadata?.phone || "",
          plan,
        }),
      });

      const initData = await initRes.json();

      if (!initRes.ok || !initData?.access_code) {
        alert(initData?.error || "Failed to initialize payment.");
        setLoading(null);
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
            const verifyRes = await fetch("/api/paystack/verify-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: transaction.reference,
                email: session.user.email,
                userId: session.user.id,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              alert(verifyData?.error || "Subscription verification failed.");
              return;
            }

            window.location.href = "/dashboard?upgraded=true";
          } catch {
            alert("Subscription verification failed.");
          } finally {
            setLoading(null);
          }
        },
        onCancel: () => setLoading(null),
      });
    } catch {
      alert("Failed to launch payment.");
      setLoading(null);
    }
  }

  function handleBankTransfer(plan: "pro_monthly" | "pro_yearly") {
    const amount = plan === "pro_yearly" ? "₦200,000" : "₦25,000";
    const message =
      "Hello Weinly, I want to subscribe to Weinly Pro " +
      (plan === "pro_yearly" ? "Yearly" : "Monthly") +
      " (" +
      amount +
      "). Please send me your bank details.";

    window.open(buildWhatsappLink(message), "_blank");
  }

  const freeFeatures = [
    { text: "Submit fabric requests", included: true },
    { text: "AI sourcing spec", included: true },
    { text: "Quote preview", included: true },
    { text: "Request tracking", included: true },
    { text: "Supplier contact unlocks", included: false, note: "₦10,000 each" },
    { text: "Priority matching", included: false },
    { text: "Dedicated support", included: false },
    { text: "Reorder button", included: false },
    { text: "Price intelligence", included: false },
  ];

  const proFeatures = [
    { text: "Everything in Free", included: true },
    { text: "3 contact unlocks/month included", included: true },
    { text: "Priority supplier matching", included: true },
    { text: "Dedicated WhatsApp support", included: true },
    { text: "Reorder button on past requests", included: true },
    { text: "Price intelligence on quotes", included: true },
    { text: "Pro badge on profile", included: true },
    { text: "Faster response time", included: true },
    { text: "Early access to new features", included: true },
  ];

  const enterpriseFeatures = [
    { text: "Everything in Pro", included: true },
    { text: "Unlimited contact unlocks", included: true },
    { text: "Dedicated account manager", included: true },
    { text: "Custom MOQ negotiations", included: true },
    { text: "Factory inspection service", included: true },
    { text: "Bulk order management", included: true },
    { text: "Custom pricing", included: true },
    { text: "API access", included: true },
  ];

  const faqs = [
    {
      q: "What does Pro include?",
      a: "Weinly Pro includes 3 supplier contact unlocks per month, priority matching, dedicated WhatsApp support, reorder button, price intelligence and a Pro badge on your profile.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Your Pro access continues until the end of your billing period. Contact us on WhatsApp to cancel.",
    },
    {
      q: "What happens to unused unlocks?",
      a: "Unused contact unlocks do not roll over. You get 3 fresh unlocks at the start of each billing month.",
    },
    {
      q: "Can I pay by bank transfer?",
      a: "Yes. Click Pay via bank transfer and we will send you our bank details on WhatsApp. Your Pro subscription will be activated once payment is confirmed.",
    },
    {
      q: "Is there a yearly discount?",
      a: "Yes. The yearly plan is ₦200,000 which saves you ₦100,000 compared to paying monthly for 12 months.",
    },
    {
      q: "What is Enterprise for?",
      a: "Enterprise is for large buyers, sourcing agents and businesses that need unlimited unlocks, factory inspections and dedicated account management.",
    },
  ];

  const currentPlan = billingCycle === "monthly" ? "pro_monthly" : "pro_yearly";
  const currentPrice = billingCycle === "monthly" ? "₦25,000" : "₦200,000";
  const currentPeriod = billingCycle === "monthly" ? "month" : "year";

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <SiteHeader />

        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] p-6 text-center shadow-2xl shadow-indigo-500/10 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-indigo-300">Simple pricing</span>
            </div>

            <h1 className="mb-4 text-3xl font-black tracking-tight text-white md:text-5xl">
              {"Source smarter with "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Weinly Pro
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
              Serious fabric buyers use Weinly Pro to source faster, safer and more
              profitably from China.
            </p>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg"
                    : "bg-transparent text-slate-500"
                }`}
              >
                Monthly
              </button>

              <button
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg"
                    : "bg-transparent text-slate-500"
                }`}
              >
                {"Yearly "}
                <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                  Save ₦100k
                </span>
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/7 bg-[#111827] p-6">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                Free
              </div>
              <div className="mb-2 text-4xl font-black tracking-tight text-white">₦0</div>
              <p className="text-sm leading-relaxed text-slate-500">
                Get started with fabric sourcing at no cost.
              </p>
            </div>

            <div className="h-px bg-white/7" />

            <div className="flex flex-1 flex-col gap-3">
              {freeFeatures.map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 font-bold ${
                      item.included ? "text-emerald-400" : "text-slate-700"
                    }`}
                  >
                    {item.included ? "✓" : "✕"}
                  </span>

                  <span
                    className={`text-sm ${
                      item.included ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {item.text}
                    {item.note && (
                      <span className="ml-1 text-xs text-slate-500">({item.note})</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="/#main-tabs"
              className="block rounded-xl border border-white/10 bg-white/6 py-3 text-center text-sm font-bold text-slate-400 no-underline"
            >
              Get started free
            </a>
          </div>

          <div className="relative flex flex-col gap-4 rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950 to-violet-950 p-6 shadow-2xl shadow-indigo-500/15">
            <span className="absolute left-1/2 top-[-12px] -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-bold text-white">
              Most popular
            </span>

            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
                Pro
              </div>

              <div className="mb-2 flex items-end gap-2">
                <div className="text-4xl font-black tracking-tight text-white">
                  {currentPrice}
                </div>
                <div className="mb-1 text-sm text-slate-400">/{currentPeriod}</div>
              </div>

              {billingCycle === "yearly" && (
                <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                  Save ₦100,000 vs monthly
                </div>
              )}

              <p className="text-sm leading-relaxed text-indigo-300/70">
                Everything you need to source profitably.
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex flex-1 flex-col gap-3">
              {proFeatures.map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-bold text-cyan-400">✓</span>
                  <span className="text-sm text-indigo-200">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleProPayment(currentPlan)}
                disabled={loading !== null}
                className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 disabled:opacity-60"
              >
                {loading ? "Processing..." : "Pay with Paystack"}
              </button>

              <button
                onClick={() => handleBankTransfer(currentPlan)}
                disabled={loading !== null}
                className="w-full cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-400 disabled:opacity-60"
              >
                Pay via bank transfer
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-white/7 bg-[#111827] p-6">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                Enterprise
              </div>
              <div className="mb-2 text-4xl font-black tracking-tight text-white">
                Custom
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                For large buyers and sourcing agents with high volume.
              </p>
            </div>

            <div className="h-px bg-white/7" />

            <div className="flex flex-1 flex-col gap-3">
              {enterpriseFeatures.map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-bold text-amber-400">✓</span>
                  <span className="text-sm text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>

            <a
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-amber-500/20 bg-amber-500/10 py-3 text-center text-sm font-bold text-amber-400 no-underline"
            >
              Contact us on WhatsApp
            </a>
          </div>
        </div>

        <section className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10">
          <span className="mb-3 inline-block rounded-full bg-indigo-500/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
            FAQ
          </span>

          <h2 className="mb-8 text-2xl font-black tracking-tight text-white md:text-3xl">
            Frequently asked questions
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-white/7 bg-white/4 p-5">
                <h3 className="m-0 mb-2 text-sm font-bold text-white">{faq.q}</h3>
                <p className="m-0 text-xs leading-relaxed text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-900/60 to-violet-900/60 p-6 text-center md:p-10">
          <h2 className="mb-3 text-2xl font-black tracking-tight text-white md:text-3xl">
            Ready to source like a pro?
          </h2>

          <p className="mx-auto mb-6 max-w-lg text-base leading-relaxed text-slate-400">
            Join serious fabric buyers already using Weinly Pro to source premium
            fabrics from China with confidence.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleProPayment("pro_monthly")}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
            >
              Get Weinly Pro
            </button>

            <a
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/6 px-8 py-3.5 text-sm font-semibold text-slate-300 no-underline"
            >
              Talk to us first
            </a>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}