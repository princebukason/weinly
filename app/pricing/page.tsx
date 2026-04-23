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

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const supportLink = buildWhatsappLink("Hello Weinly, I want to upgrade to Pro.");

  async function handleProPayment(plan: "pro_monthly" | "pro_yearly") {
    setLoading(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = "/auth?next=/pricing";
        return;
      }

      const initRes = await fetch("/api/paystack/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
              headers: { "Content-Type": "application/json" },
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

  async function handleBankTransfer(plan: "pro_monthly" | "pro_yearly") {
    const amount = plan === "pro_yearly" ? "₦200,000" : "₦25,000";
    const message = `Hello Weinly, I want to subscribe to Weinly Pro ${plan === "pro_yearly" ? "Yearly" : "Monthly"} (${amount}). Please send me your bank details.`;
    window.open(buildWhatsappLink(message), "_blank");
  }

  const monthlyPrice = "₦25,000";
  const yearlyPrice = "₦200,000";
  const yearlySaving = "₦100,000";

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 md:px-4 md:py-4 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-3">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] border border-indigo-500/15 rounded-3xl p-6 md:p-12 text-center shadow-2xl shadow-indigo-500/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-indigo-300 text-xs font-semibold">Simple pricing</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Source smarter with{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Weinly Pro
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-8">
              Serious fabric buyers use Weinly Pro to source faster, safer and more profitably from China.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 mb-2">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all ${billingCycle === "monthly" ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25" : "text-slate-500 bg-transparent hover:text-slate-300"}`}>
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all ${billingCycle === "yearly" ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25" : "text-slate-500 bg-transparent hover:text-slate-300"}`}>
                Yearly
                <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Save {yearlySaving}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Free */}
          <div className="bg-[#111827] border border-white/7 rounded-3xl p-6 flex flex-col gap-4">
            <div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Free</div>
              <div className="text-4xl font-black text-white tracking-tight mb-2">₦0</div>
              <p className="text-slate-500 text-sm leading-relaxed">Get started with fabric sourcing at no cost.</p>
            </div>
            <div className="h-px bg-white/7" />
            <div className="flex flex-col gap-3 flex-1">
              {[
                { text: "Submit fabric requests", included: true },
                { text: "AI sourcing spec", included: true },
                { text: "Quote preview", included: true },
                { text: "Request tracking", included: true },
                { text: "Supplier contact unlocks", included: false, note: "₦10,000 each" },
                { text: "Priority matching", included: false },
                { text: "Dedicated support", included: false },
                { text: "Reorder button", included: false },
                { text: "Price intelligence", included: false },
              ].map((item) => (
                <div key={item.text} className="flex gap-3 items-start">
                  <span className={`font-bold shrink-0 mt-0.5 ${item.included ? "text-emerald-400" : "text-slate-700"}`}>
                    {item.included ? "✓" : "✕"}
                  </span>
                  <span className={`text-sm ${item.included ? "text-slate-300" : "text-slate-600"}`}>
                    {item.text}
                    {item.note && <span className="ml-1 text-slate-500 text-xs">({item.note})</span>}
                  </span>
                </div>
              ))}
            </div>
            <a href="/#main-tabs" className="block text-center bg-white/6 border border-white/10 text-slate-400 font-bold text-sm py-3 rounded-xl no-underline hover:bg-white/10 transition-all">
              Get started free
            </a>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-b from-indigo-950 to-violet-950 border border-indigo-500/30 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-indigo-500/15">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
              Most popular
            </span>
            <div>
              <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">Pro</div>
              <div className="flex items-end gap-2 mb-2">
                <div className="text-4xl font-black text-white tracking-tight">
                  {billingCycle === "monthly" ? monthlyPrice : yearlyPrice}
                </div>
                <div className="text-slate-400 text-sm mb-1">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </div>
              </div>
              {billingCycle === "yearly" && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
                  Save {yearlySaving} vs monthly
                </div>
              )}
              <p className="text-indigo-300/70 text-sm leading-relaxed">Everything you need to source profitably.</p>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex flex-col gap-3 flex-1">
              {[
                { text: "Everything in Free", included: true },
                { text: "3 contact unlocks/month included", included: true },
                { text: "Priority supplier matching", included: true },
                { text: "Dedicated WhatsApp support", included: true },
                { text: "Reorder button on past requests", included: true },
                { text: "Price intelligence on quotes", included: true },
                { text: "Pro badge on profile", included: true },
                { text: "Faster response time", included: true },
                { text: "Early access to new features", included: true },
              ].map((item) => (
                <div key={item.text} className="flex gap-3 items-start">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="text-indigo-200 text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleProPayment(billingCycle === "monthly" ? "pro_monthly" : "pro_yearly")}
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm py-3.5 rounded-xl border-0 cursor-pointer shadow-lg shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Processing..." : `Pay with Paystack`}
              </button>
              <button
                onClick={() => handleBankTransfer(billingCycle === "monthly" ? "pro_monthly" : "pro_yearly")}
                disabled={loading !== null}
                className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm py-3 rounded-xl cursor-pointer hover:bg-emerald-500/15 transition-all border-0 disabled:opacity-60">
                Pay via bank transfer
              </button>
            </div>
          </div>

          {/* Enterprise */}
          <div className="bg-[#111827] border border-white/7 rounded-3xl p-6 flex flex-col gap-4">
            <div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Enterprise</div>
              <div className="text-4xl font-black text-white tracking-tight mb-2">Custom</div>
              <p className="text-slate-500 text-sm leading-relaxed">For large buyers and sourcing agents with high volume.</p>
            </div>
            <div className="h-px bg-white/7" />
            <div className="flex flex-col gap-3 flex-1">
              {[
                { text: "Everything in Pro", included: true },
                { text: "Unlimited contact unlocks", included: true },
                { text: "Dedicated account manager", included: true },
                { text: "Custom MOQ negotiations", included: true },
                { text: "Factory inspection service", included: true },
                { text: "Bulk order management", included: true },
                { text: "Custom pricing", included: true },
                { text: "API access", included: true },
              ].map((item) => (
                <div key={item.text} className="flex gap-3 items-start">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="text-slate-300 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="block text-center bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm py-3 rounded-xl no-underline hover:bg-amber-500/15 transition-all">
              Contact us on WhatsApp
            </a>
          </div>
        </div>

        {/* FAQ */}
        <section className="bg-[#111827] border border-white/7 rounded-3xl p-6 md:p-10">
          <span className="inline-block bg-indigo-500/12 text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">FAQ</span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">Frequently asked questions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
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
                a: "Yes. Click 'Pay via bank transfer' and we will send you our bank details on WhatsApp. Your Pro subscription will be activated once payment is confirmed.",
              },
              {
                q: "Is there a yearly discount?",
                a: "Yes. The yearly plan is ₦200,000 which saves you ₦100,000 compared to paying monthly for 12 months.",
              },
              {
                q: "What is Enterprise for?",
                a: "Enterprise is for large buyers, sourcing agents and businesses that need unlimited unlocks, factory inspections and dedicated account management.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-white/4 border border-white/7 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-2 m-0">{faq.q}</h3>
                <p className="text-slate-500 text-xs leading-relaxed m-0">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="bg-gradient-to-r from-indigo-900/60 to-violet-900/60 border border-indigo-500/20 rounded-3xl p-6 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
            Ready to source like a pro?
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-6 max-w-lg mx-auto">
            Join serious fabric buyers already using Weinly Pro to source premium fabrics from China with confidence.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => handleProPayment("pro_monthly")}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl border-0 cursor-pointer shadow-lg shadow-indigo-500/25">
              Get Weinly Pro →
            </button>
            
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="bg-white/6 border border-white/10 text-slate-300 font-semibold text-sm px-8 py-3.5 rounded-xl no-underline hover:bg-white/10 transition-all flex items-center">
              Talk to us first
            </a>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}