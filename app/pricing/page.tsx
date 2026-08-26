"use client";

import { useState } from "react";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";
import { useCurrency } from "@/hooks/useCurrency";

let PaystackPop: any = null;

type BillingCycle = "monthly" | "yearly";
type ProPlan = "pro_monthly" | "pro_yearly";

export default function PricingPage() {
  const prices = useCurrency();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [proEmail, setProEmail] = useState("");
  const [proName, setProName] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [proSuccess, setProSuccess] = useState(false);

  const supportLink = buildWhatsappLink("Hello Weinly, I want to upgrade to Weinly Pro.");

  async function handleProPayment(plan: ProPlan) {
    if (!proEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proEmail)) {
      alert("Please enter a valid email address.");
      return;
    }
    setLoading(plan);
    try {
      const initRes = await fetch("/api/paystack/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: proEmail, name: proName, plan, currency: prices.currency }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData?.access_code) { alert(initData?.error || "Failed to initialize payment."); setLoading(null); return; }

      if (!PaystackPop) { const module = await import("@paystack/inline-js"); PaystackPop = module.default; }

      const popup = new PaystackPop();
      popup.resumeTransaction(initData.access_code, {
        onSuccess: async (transaction: { reference: string }) => {
          try {
            const verifyRes = await fetch("/api/paystack/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: transaction.reference, email: proEmail }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) { alert(verifyData?.error || "Subscription verification failed."); return; }
            setProSuccess(true);
            setShowEmailForm(false);
          } catch { alert("Subscription verification failed."); }
          finally { setLoading(null); }
        },
        onCancel: () => setLoading(null),
      });
    } catch { alert("Failed to launch payment."); setLoading(null); }
  }

  const currentPlan: ProPlan = billingCycle === "monthly" ? "pro_monthly" : "pro_yearly";
  const currentPrice = billingCycle === "monthly" ? prices.proMonthly : prices.proYearly;
  const currentPeriod = billingCycle === "monthly" ? "month" : "year";
  const yearlySaving = prices.currency === "NGN" ? "₦100,000" : "$110";
  const yearlySavingShort = prices.currency === "NGN" ? "₦100k" : "$110";

  const faqs = [
    {
      q: "How does Weinly make money?",
      a: "Weinly charges a 4% service fee on the final order value for managed orders. We coordinate supplier, QC and shipping end-to-end — you pay nothing upfront, only when your order is completed.",
    },
    {
      q: "Who is Weinly Pro for?",
      a: "Pro is for active buyers and sourcing professionals who order regularly from China. It gives you priority matching, faster turnaround and dedicated WhatsApp support — so your requests move ahead of the queue.",
    },
    {
      q: "What's the difference between Free and Pro?",
      a: "Free buyers can submit requests and get quotes. Pro buyers get priority supplier matching, faster response times, dedicated support and better visibility on pricing intelligence across orders.",
    },
    {
      q: "Does Pro reduce the 4% service fee?",
      a: "Not directly — but Pro buyers get better negotiated prices and faster execution, which often more than offsets the subscription cost over multiple orders.",
    },
    {
      q: "Is yearly cheaper?",
      a: `Yes. The yearly plan costs ${prices.proYearly} upfront instead of paying ${prices.proMonthly} every month. You save ${yearlySaving} over 12 months.`,
    },
    {
      q: "Can I cancel later?",
      a: "Yes. Contact Weinly support on WhatsApp to cancel or make changes to your subscription at any time.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f0f2f0] font-sans">
      <div className="flex w-full flex-col gap-0">
        <SiteHeader />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">

          {/* Hero */}
          <section className="rounded-lg border border-[#24483f]/15 bg-[#fffaf2] p-6 md:p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#24483f]/20 bg-[#24483f]/10 px-4 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#2f7d57]" />
                  <span className="text-xs font-bold text-[#24483f]">Simple, honest pricing</span>
                </div>
                <h1 className="mb-4 text-3xl font-black tracking-tight text-[#1f2933] md:text-5xl">
                  We earn when your order succeeds. Not before.
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-stone-600 md:text-base">
                  Weinly charges a 4% service fee on managed orders — paid on completion. No upfront fees, no contact unlock charges. Submit a request, we handle the rest.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-[#2f7d57]">No upfront cost</div>
                  <div className="rounded-full border border-[#24483f]/20 bg-[#24483f]/10 px-4 py-2 text-xs font-semibold text-[#24483f]">4% service fee on orders</div>
                  <div className="rounded-full border border-[#f59e0b]/25 bg-[#f59e0b]/10 px-4 py-2 text-xs font-semibold text-[#24483f]">Pro for priority buyers</div>
                </div>
              </div>
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 md:p-6">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#f59e0b]">How a managed order works</div>
                <div className="flex flex-col gap-3">
                  {[
                    "Submit your fabric requirement — free",
                    "Weinly matches and negotiates with verified suppliers",
                    "We inspect quality before your shipment leaves China",
                    "Pay 4% of order value when order is confirmed",
                  ].map((item, i) => (
                    <div key={item} className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#24483f] text-xs font-black text-white">{i + 1}</span>
                      <span className="text-sm leading-relaxed text-stone-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Billing toggle */}
          <section className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-1.5">
              <button onClick={() => setBillingCycle("monthly")}
                className={`rounded-md border-0 cursor-pointer px-5 py-2 text-sm font-bold transition-all ${billingCycle === "monthly" ? "bg-[#f59e0b] text-[#1a2e1a] shadow-lg shadow-stone-900/10" : "bg-transparent text-stone-500"}`}>
                Monthly
              </button>
              <button onClick={() => setBillingCycle("yearly")}
                className={`rounded-md border-0 cursor-pointer px-5 py-2 text-sm font-bold transition-all ${billingCycle === "yearly" ? "bg-[#f59e0b] text-[#1a2e1a] shadow-lg shadow-stone-900/10" : "bg-transparent text-stone-500"}`}>
                Yearly
                <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-[#2f7d57]">Save {yearlySavingShort}</span>
              </button>
            </div>
          </section>

          {/* Pricing cards */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">

            {/* Free */}
            <div className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Free</div>
              <div className="mb-2 text-4xl font-black tracking-tight text-[#1f2933]">{prices.symbol}0</div>
              <p className="mb-5 text-sm leading-relaxed text-stone-500">Submit requests and start managed orders. Pay 4% only when your order completes.</p>
              <div className="mb-5 h-px bg-stone-200" />
              <div className="flex flex-1 flex-col gap-3">
                {[
                  "Submit sourcing requests",
                  "AI-formatted sourcing spec",
                  "Weinly manages supplier, QC & shipping",
                  "Track request progress",
                  "4% service fee on order value",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#2f7d57] font-bold">✓</span>
                    <span className="text-sm text-stone-600">{item}</span>
                  </div>
                ))}
                <div className="my-2 h-px bg-stone-200" />
                {["Standard matching speed", "No dedicated support", "No priority queue"].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-stone-300">✕</span>
                    <span className="text-sm text-stone-400">{item}</span>
                  </div>
                ))}
              </div>
              <a href="/#main-tabs" className="mt-6 block rounded-md border border-stone-200 bg-stone-50 py-3 text-center text-sm font-bold text-stone-700 no-underline hover:bg-[#24483f]/10 transition-all">
                Start free
              </a>
            </div>

            {/* Pro — highlighted */}
            <div id="pro-card" className="relative flex h-full flex-col rounded-lg border border-[#24483f]/25 bg-white p-6 shadow-md shadow-stone-900/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-[#f59e0b] text-[#1a2e1a] px-4 py-1.5 text-xs font-bold whitespace-nowrap">Most popular</span>
              </div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#24483f]">Weinly Pro</div>
              <div className="mb-2 flex items-end gap-2">
                <div className="text-4xl font-black tracking-tight text-[#1f2933]">{currentPrice}</div>
                <div className="mb-1 text-sm text-stone-500">/{currentPeriod}</div>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-stone-600">For active buyers who order regularly and want faster turnaround and priority service.</p>
              {billingCycle === "yearly" && (
                <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-[#2f7d57]">
                  Save {yearlySaving} vs monthly
                </div>
              )}
              <div className="mb-5 rounded-lg border border-[#24483f]/15 bg-[#24483f]/5 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-[#24483f]">What you get</div>
                {billingCycle === "monthly" ? (
                  <>
                    <div className="text-sm font-semibold text-[#1f2933]">Priority matching + dedicated support</div>
                    <div className="mt-1 text-xs leading-relaxed text-stone-500">Your requests move ahead of the queue. Billed monthly, cancel anytime.</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-[#1f2933]">Full year of priority access</div>
                    <div className="mt-1 text-xs leading-relaxed text-stone-500">Everything in monthly — paid once upfront. Save {yearlySaving} compared to 12 monthly payments.</div>
                  </>
                )}
              </div>
              <div className="mb-5 h-px bg-stone-200" />
              <div className="flex flex-1 flex-col gap-3">
                {[
                  "Everything in Free",
                  "Priority supplier matching",
                  "Faster order turnaround",
                  "Dedicated WhatsApp support",
                  "Reorder from past requests",
                  "Price intelligence on quotes",
                  "Early access to new features",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#2f7d57] font-bold">✓</span>
                    <span className="text-sm text-stone-700">{item}</span>
                  </div>
                ))}
              </div>
              {proSuccess ? (
                <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                  <div className="mb-1 text-lg font-black text-[#2f7d57]">You are now on Weinly Pro!</div>
                  <p className="text-xs text-stone-600">We've sent your Pro confirmation to <strong>{proEmail}</strong>. Your requests now get priority matching. Contact us on WhatsApp if you need anything.</p>
                  <a href={supportLink} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-md bg-[#24483f] px-4 py-2 text-xs font-bold text-white no-underline">Message us on WhatsApp</a>
                </div>
              ) : !showEmailForm ? (
                <button onClick={() => setShowEmailForm(true)} className="mt-6 w-full cursor-pointer rounded-md border-0 bg-[#24483f] py-3.5 text-sm font-bold text-white shadow-lg shadow-stone-900/10">
                  Get Weinly Pro
                </button>
              ) : (
                <div className="mt-6 flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={proName}
                    onChange={(e) => setProName(e.target.value)}
                    className="w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-[#24483f]"
                  />
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={proEmail}
                    onChange={(e) => setProEmail(e.target.value)}
                    className="w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-[#24483f]"
                  />
                  <button onClick={() => handleProPayment(currentPlan)} disabled={loading !== null}
                    className="w-full cursor-pointer rounded-md border-0 bg-[#24483f] py-3.5 text-sm font-bold text-white shadow-lg shadow-stone-900/10 disabled:opacity-60">
                    {loading === currentPlan ? "Processing..." : `Pay ${currentPrice} — Activate Pro`}
                  </button>
                  <button onClick={() => setShowEmailForm(false)} className="text-xs text-stone-400 underline cursor-pointer border-0 bg-transparent">Cancel</button>
                </div>
              )}
            </div>

            {/* Enterprise */}
            <div className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Enterprise</div>
              <div className="mb-2 text-4xl font-black tracking-tight text-[#1f2933]">Custom</div>
              <p className="mb-5 text-sm leading-relaxed text-stone-500">For large buyers, sourcing teams and businesses with ongoing high-volume orders.</p>
              <div className="mb-5 h-px bg-stone-200" />
              <div className="flex flex-1 flex-col gap-3">
                {[
                  "Everything in Pro",
                  "Dedicated account manager",
                  "Reduced service fee on large orders",
                  "Factory inspection support",
                  "Bulk order handling",
                  "Custom sourcing workflow",
                  "Custom pricing",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#f59e0b] font-bold">✓</span>
                    <span className="text-sm text-stone-600">{item}</span>
                  </div>
                ))}
              </div>
              <a href={supportLink} target="_blank" rel="noreferrer" className="mt-6 block rounded-md border border-emerald-500/20 bg-emerald-500/10 py-3 text-center text-sm font-bold text-[#2f7d57] no-underline hover:bg-emerald-500/15 transition-all">
                Talk to us on WhatsApp
              </a>
            </div>
          </section>

          {/* Trust */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { title: "We earn when you succeed", text: "No contact unlock fees. No paywalled directories. Weinly charges 4% on completed orders — so we're motivated to get your order right." },
              { title: "WeChat-based supplier access", text: "Most Chinese fabric suppliers operate on WeChat, not email. Weinly handles supplier coordination directly so you never need to figure that out yourself." },
              { title: "QC before it ships", text: "We inspect fabric quality at the factory before your shipment leaves China — reducing the risk of receiving goods that don't match the spec." },
            ].map((t) => (
              <div key={t.title} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="mb-3 h-1 w-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600" />
                <div className="mb-2 text-sm font-bold text-[#1f2933]">{t.title}</div>
                <p className="text-sm leading-relaxed text-stone-500">{t.text}</p>
              </div>
            ))}
          </section>

          {/* FAQ */}
          <section className="rounded-lg border border-stone-200 bg-white p-6 md:p-10">
            <div className="mb-3 inline-block rounded-full bg-[#f59e0b]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#f59e0b]">FAQ</div>
            <h2 className="mb-8 text-2xl font-black tracking-tight text-[#1f2933] md:text-3xl">Frequently asked questions</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-lg border border-stone-200 bg-stone-50 p-5">
                  <h3 className="mb-2 text-sm font-bold text-[#1f2933]">{faq.q}</h3>
                  <p className="text-xs leading-relaxed text-stone-500">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="hidden md:block rounded-lg border border-[#24483f]/20 bg-[#24483f] p-8 text-center">
            <h2 className="mb-3 text-3xl font-black tracking-tight text-white">Ready to place your first order?</h2>
            <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-[#e8dcc8]">
              Tell Weinly what fabric you need. We find the supplier, inspect quality and coordinate shipping — you pay 4% when the order is confirmed.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="/#main-tabs"
                className="inline-flex items-center rounded-md bg-[#f59e0b] text-[#1a2e1a] px-8 py-3.5 text-sm font-bold no-underline shadow-lg shadow-black/20">
                Submit a request — free
              </a>
              <a href={supportLink} target="_blank" rel="noreferrer"
                className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-[#fffaf2] no-underline hover:bg-white/15 transition-all">
                Talk to us first
              </a>
            </div>
          </section>

        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
