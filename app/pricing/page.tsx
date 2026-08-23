"use client";

import { useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";
import { useCurrency } from "@/hooks/useCurrency";

let _sb: SupabaseClient | null = null;
function getSupabase() {
  if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
  return _sb;
}


let PaystackPop: any = null;


type BillingCycle = "monthly" | "yearly";
type ProPlan = "pro_monthly" | "pro_yearly";

export default function PricingPage() {
  const prices = useCurrency();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const supportLink = buildWhatsappLink("Hello Weinly, I want to upgrade to Weinly Pro.");

  async function handleProPayment(plan: ProPlan) {
    setLoading(plan);
    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session?.user) { window.location.href = "/auth?next=/pricing"; return; }

      const initRes = await fetch("/api/paystack/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "",
          phone: session.user.user_metadata?.phone || "",
          plan,
          currency: prices.currency,
        }),
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
              body: JSON.stringify({ reference: transaction.reference, email: session.user.email, userId: session.user.id }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) { alert(verifyData?.error || "Subscription verification failed."); return; }
            window.location.href = "/dashboard?upgraded=true";
          } catch { alert("Subscription verification failed."); }
          finally { setLoading(null); }
        },
        onCancel: () => setLoading(null),
      });
    } catch { alert("Failed to launch payment."); setLoading(null); }
  }

  function handleBankTransfer(plan: ProPlan) {
    const amount = plan === "pro_yearly" ? prices.proYearly : prices.proMonthly;
    const cycleLabel = plan === "pro_yearly" ? "Yearly" : "Monthly";
    window.open(buildWhatsappLink(`Hello Weinly, I want to subscribe to Weinly Pro ${cycleLabel} (${amount}). Please send me your bank details.`), "_blank");
  }

  const currentPlan: ProPlan = billingCycle === "monthly" ? "pro_monthly" : "pro_yearly";
  const currentPrice = billingCycle === "monthly" ? prices.proMonthly : prices.proYearly;
  const currentPeriod = billingCycle === "monthly" ? "month" : "year";
  const yearlySaving = prices.currency === "NGN" ? "₦100,000" : "$120";
  const yearlySavingShort = prices.currency === "NGN" ? "₦100k" : "$120";

  const faqs = [
    { q: "Who is Weinly Pro for?", a: "Weinly Pro is for serious buyers, fabric sellers, fashion brands and sourcing professionals who want faster access, better supplier matching and less risk when buying from China." },
    { q: "What does the 3 unlocks/month mean?", a: "Each month, Pro includes 3 supplier contact unlocks at no extra charge. That means you can access supplier contact details for up to 3 suitable quote matches every month." },
    { q: "What happens if I need more than 3 unlocks?", a: "You can still unlock more supplier contacts separately, or upgrade to a custom Enterprise arrangement if you buy in larger volumes." },
    { q: "Can I pay by bank transfer?", a: "Yes. If you prefer bank transfer, click the bank transfer option and we will send payment details on WhatsApp." },
    { q: "Is yearly cheaper?", a: `Yes. Yearly costs ${prices.proYearly}, which saves you ${yearlySaving} compared to paying ${prices.proMonthly} monthly for 12 months.` },
    { q: "Can I cancel later?", a: "Yes. If you want to stop renewal or make changes, contact Weinly support on WhatsApp." },
  ];

  return (
    <main className="min-h-screen bg-[#f5ecdc] font-sans">
      <div className="flex w-full flex-col gap-0">
        <SiteHeader />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">

          {/* Hero */}
          <section className="rounded-lg border border-[#24483f]/15 bg-[#fffaf2] p-6 md:p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#24483f]/20 bg-[#24483f]/10 px-4 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#2f7d57]" />
                  <span className="text-xs font-bold text-[#24483f]">Pricing built for serious buyers</span>
                </div>
                <h1 className="mb-4 text-3xl font-black tracking-tight text-[#1f2933] md:text-5xl">
                  Source premium fabrics from China with more speed, clarity and control.
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-stone-600 md:text-base">
                  Weinly helps buyers avoid costly mistakes, compare supplier quotes faster, and unlock verified supplier contacts when they are ready to move.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-[#2f7d57]">Faster sourcing</div>
                  <div className="rounded-full border border-[#24483f]/20 bg-[#24483f]/10 px-4 py-2 text-xs font-semibold text-[#24483f]">Better supplier matching</div>
                  <div className="rounded-full border border-[#c9935b]/25 bg-[#c9935b]/10 px-4 py-2 text-xs font-semibold text-[#7b3525]">Safer buying flow</div>
                </div>
              </div>
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 md:p-6">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a75635]">Why buyers upgrade</div>
                <div className="flex flex-col gap-3">
                  {[
                    "Get 3 contact unlocks included every month",
                    "Reach suppliers faster when you are ready to buy",
                    "See quotes with more intelligence and better support",
                    "Reorder more easily from previous sourcing requests",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-3">
                      <span className="mt-0.5 text-[#2f7d57] font-bold">✓</span>
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
                className={`rounded-md border-0 cursor-pointer px-5 py-2 text-sm font-bold transition-all ${billingCycle === "monthly" ? "bg-gradient-to-r from-[#a75635] to-[#7b3525] text-white shadow-lg shadow-stone-900/10" : "bg-transparent text-stone-500"}`}>
                Monthly
              </button>
              <button onClick={() => setBillingCycle("yearly")}
                className={`rounded-md border-0 cursor-pointer px-5 py-2 text-sm font-bold transition-all ${billingCycle === "yearly" ? "bg-gradient-to-r from-[#a75635] to-[#7b3525] text-white shadow-lg shadow-stone-900/10" : "bg-transparent text-stone-500"}`}>
                Yearly
                <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-[#2f7d57]">Save {yearlySavingShort}</span>
              </button>
            </div>
          </section>

          {/* Pricing cards */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">

            {/* Free */}
            <div className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Free</div>
              <div className="mb-2 text-4xl font-black tracking-tight text-[#1f2933]">{prices.symbol}0</div>
              <p className="mb-5 text-sm leading-relaxed text-stone-500">Good for testing Weinly and submitting sourcing requests.</p>
              <div className="mb-5 h-px bg-stone-200" />
              <div className="flex flex-1 flex-col gap-3">
                {["Submit sourcing requests", "AI sourcing spec", "Quote preview", "Track request progress"].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#2f7d57] font-bold">✓</span>
                    <span className="text-sm text-stone-600">{item}</span>
                  </div>
                ))}
                <div className="my-2 h-px bg-stone-200" />
                {["Supplier contact unlocks billed separately", "No priority matching", "No dedicated support"].map((item) => (
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

            {/* Contact Unlock */}
            <div className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Contact Unlock</div>
              <div className="mb-1 text-4xl font-black tracking-tight text-[#1f2933]">{prices.unlock}</div>
              <div className="mb-3 text-xs text-stone-400">one-time per request</div>
              <p className="mb-5 text-sm leading-relaxed text-stone-500">Unlock direct supplier contact for a single request after admin approval.</p>
              <div className="mb-5 h-px bg-stone-200" />
              <div className="flex flex-1 flex-col gap-3">
                {["Everything in Free", "Direct phone number", "WeChat ID", "Email address", "Contact person name", "Controlled release process"].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#2f7d57] font-bold">✓</span>
                    <span className="text-sm text-stone-600">{item}</span>
                  </div>
                ))}
              </div>
              <a href="/#main-tabs" className="mt-6 block rounded-md border border-[#a75635]/30 bg-[#a75635]/8 py-3 text-center text-sm font-bold text-[#7b3525] no-underline transition-all hover:bg-[#a75635]/12">
                Submit a request
              </a>
            </div>

            {/* Pro — highlighted */}
            <div className="relative flex h-full flex-col rounded-lg border border-[#24483f]/25 bg-white p-6 shadow-md shadow-stone-900/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-gradient-to-r from-[#c9935b] to-[#a75635] px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap">Most popular</span>
              </div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#24483f]">Weinly Pro</div>
              <div className="mb-2 flex items-end gap-2">
                <div className="text-4xl font-black tracking-tight text-[#1f2933]">{currentPrice}</div>
                <div className="mb-1 text-sm text-stone-500">/{currentPeriod}</div>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-stone-600">Best for active buyers who want faster supplier access and more support.</p>
              {billingCycle === "yearly" && (
                <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-[#2f7d57]">
                  Save {yearlySaving} yearly
                </div>
              )}
              <div className="mb-5 rounded-lg border border-[#24483f]/15 bg-[#24483f]/5 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-[#24483f]">What you get</div>
                <div className="text-sm font-semibold text-[#1f2933]">3 supplier contact unlocks included every month</div>
                <div className="mt-1 text-xs leading-relaxed text-stone-500">Plus priority matching, better support and a smoother reorder flow.</div>
              </div>
              <div className="mb-5 h-px bg-stone-200" />
              <div className="flex flex-1 flex-col gap-3">
                {["Everything in Free", "3 contact unlocks / month", "Priority supplier matching", "Dedicated WhatsApp support", "Reorder from past requests", "Price intelligence on quotes", "Faster turnaround", "Early access to new features"].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#2f7d57] font-bold">✓</span>
                    <span className="text-sm text-stone-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <button onClick={() => handleProPayment(currentPlan)} disabled={loading !== null}
                  className="w-full cursor-pointer rounded-md border-0 bg-gradient-to-r from-[#24483f] to-[#18362f] py-3.5 text-sm font-bold text-white shadow-lg shadow-stone-900/10 disabled:opacity-60">
                  {loading === currentPlan ? "Processing..." : "Pay with Paystack"}
                </button>
                <button onClick={() => handleBankTransfer(currentPlan)} disabled={loading !== null}
                  className="w-full cursor-pointer rounded-md border border-emerald-500/20 bg-emerald-500/10 py-3 text-sm font-bold text-[#2f7d57] disabled:opacity-60">
                  Pay via bank transfer
                </button>
              </div>
            </div>

            {/* Enterprise */}
            <div className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Enterprise</div>
              <div className="mb-2 text-4xl font-black tracking-tight text-[#1f2933]">Custom</div>
              <p className="mb-5 text-sm leading-relaxed text-stone-500">For large buyers, sourcing teams and businesses with ongoing volume.</p>
              <div className="mb-5 h-px bg-stone-200" />
              <div className="flex flex-1 flex-col gap-3">
                {["Everything in Pro", "Unlimited contact unlocks", "Dedicated account manager", "Factory inspection support", "Bulk order handling", "Custom sourcing workflow", "Custom pricing"].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#a75635] font-bold">✓</span>
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
              { title: "Built for fabric buyers", text: "This is not generic software. Weinly is designed around real sourcing pain points buyers face when dealing with suppliers in China." },
              { title: "Reduce costly mistakes", text: "Better request formatting, quote visibility and guided unlock flow help buyers avoid rushing into the wrong supplier." },
              { title: "Scale with confidence", text: "Whether you are buying for retail, wholesale or custom production, Weinly gives you a more structured sourcing workflow." },
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
            <div className="mb-3 inline-block rounded-full bg-[#a75635]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#a75635]">FAQ</div>
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
            <h2 className="mb-3 text-3xl font-black tracking-tight text-white">Ready to move faster with Weinly Pro?</h2>
            <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-[#e8dcc8]">
              Upgrade when you are ready to unlock suppliers faster, get better support, and source more confidently from China.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => handleProPayment(currentPlan)} disabled={loading !== null}
                className="cursor-pointer rounded-md border-0 bg-gradient-to-r from-[#c9935b] to-[#a75635] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 disabled:opacity-60">
                {loading === currentPlan ? "Processing..." : "Choose Pro"}
              </button>
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
