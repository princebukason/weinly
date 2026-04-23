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

type BillingCycle = "monthly" | "yearly";
type ProPlan = "pro_monthly" | "pro_yearly";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const supportLink = buildWhatsappLink(
    "Hello Weinly, I want to upgrade to Weinly Pro."
  );

  async function handleProPayment(plan: ProPlan) {
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

  function handleBankTransfer(plan: ProPlan) {
    const amount = plan === "pro_yearly" ? "₦200,000" : "₦25,000";
    const cycleLabel = plan === "pro_yearly" ? "Yearly" : "Monthly";

    const message = `Hello Weinly, I want to subscribe to Weinly Pro ${cycleLabel} (${amount}). Please send me your bank details.`;
    window.open(buildWhatsappLink(message), "_blank");
  }

  const currentPlan: ProPlan =
    billingCycle === "monthly" ? "pro_monthly" : "pro_yearly";
  const currentPrice = billingCycle === "monthly" ? "₦25,000" : "₦200,000";
  const currentPeriod = billingCycle === "monthly" ? "month" : "year";

  const freeFeatures = [
    "Submit sourcing requests",
    "AI sourcing spec",
    "Quote preview",
    "Track request progress",
  ];

  const paidExtras = [
    "Supplier contact unlocks billed separately",
    "No priority matching",
    "No price intelligence",
    "No dedicated support",
  ];

  const proFeatures = [
    "Everything in Free",
    "3 supplier contact unlocks every month",
    "Priority supplier matching",
    "Dedicated WhatsApp support",
    "Reorder from past requests",
    "Price intelligence on quotes",
    "Faster turnaround",
    "Early access to new features",
  ];

  const enterpriseFeatures = [
    "Everything in Pro",
    "Unlimited contact unlocks",
    "Dedicated account manager",
    "Factory inspection support",
    "Bulk order handling",
    "Custom sourcing workflow",
    "Custom pricing",
  ];

  const faqs = [
    {
      q: "Who is Weinly Pro for?",
      a: "Weinly Pro is for serious buyers, fabric sellers, fashion brands and sourcing professionals who want faster access, better supplier matching and less risk when buying from China.",
    },
    {
      q: "What does the 3 unlocks/month mean?",
      a: "Each month, Pro includes 3 supplier contact unlocks at no extra charge. That means you can access supplier contact details for up to 3 suitable quote matches every month.",
    },
    {
      q: "What happens if I need more than 3 unlocks?",
      a: "You can still unlock more supplier contacts separately, or upgrade to a custom Enterprise arrangement if you buy in larger volumes.",
    },
    {
      q: "Can I pay by bank transfer?",
      a: "Yes. If you prefer bank transfer, click the bank transfer option and we will send payment details on WhatsApp.",
    },
    {
      q: "Is yearly cheaper?",
      a: "Yes. Yearly costs ₦200,000, which saves you ₦100,000 compared to paying ₦25,000 monthly for 12 months.",
    },
    {
      q: "Can I cancel later?",
      a: "Yes. If you want to stop renewal or make changes, contact Weinly support on WhatsApp.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 md:px-4 md:py-4 font-sans">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] p-6 md:p-10 shadow-2xl shadow-indigo-500/10">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 -translate-x-1/3 translate-y-1/3 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-indigo-300">
                  Pricing built for serious buyers
                </span>
              </div>

              <h1 className="mb-4 text-3xl font-black tracking-tight text-white md:text-5xl">
                Source premium fabrics from China with more speed, clarity and control.
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
                Weinly helps buyers avoid costly mistakes, compare supplier quotes faster,
                and unlock verified supplier contacts when they are ready to move.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                  Faster sourcing
                </div>
                <div className="rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-300">
                  Better supplier matching
                </div>
                <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300">
                  Safer buying flow
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
                Why buyers upgrade
              </div>

              <div className="space-y-3">
                {[
                  "Get 3 contact unlocks included every month",
                  "Reach suppliers faster when you are ready to buy",
                  "See quotes with more intelligence and better support",
                  "Reorder more easily from previous sourcing requests",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/7 bg-white/4 p-3"
                  >
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    <span className="text-sm leading-relaxed text-slate-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Billing toggle */}
        <section className="flex justify-center">
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
              Yearly
              <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                Save ₦100k
              </span>
            </button>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Free */}
          <div className="flex h-full flex-col rounded-3xl border border-white/7 bg-[#111827] p-6">
            <div className="mb-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Free
              </div>
              <div className="mb-2 text-4xl font-black tracking-tight text-white">₦0</div>
              <p className="text-sm leading-relaxed text-slate-500">
                Good for testing Weinly and submitting sourcing requests.
              </p>
            </div>

            <div className="mb-5 h-px bg-white/7" />

            <div className="flex flex-1 flex-col gap-3">
              {freeFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}

              <div className="my-2 h-px bg-white/7" />

              {paidExtras.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 text-slate-700">✕</span>
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>

            <a
              href="/#main-tabs"
              className="mt-6 block rounded-xl border border-white/10 bg-white/6 py-3 text-center text-sm font-bold text-slate-300 no-underline"
            >
              Start free
            </a>
          </div>

          {/* Pro */}
          <div className="relative flex h-full flex-col rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950 to-violet-950 p-6 shadow-2xl shadow-indigo-500/15">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap">
                Most popular
              </span>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
                Weinly Pro
              </div>

              <div className="mb-2 flex items-end gap-2">
                <div className="text-4xl font-black tracking-tight text-white">
                  {currentPrice}
                </div>
                <div className="mb-1 text-sm text-slate-400">/{currentPeriod}</div>
              </div>

              <p className="text-sm leading-relaxed text-indigo-200/80">
                Best for active buyers who want faster supplier access and more support.
              </p>

              {billingCycle === "yearly" && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                  Save ₦100,000 yearly
                </div>
              )}
            </div>

            <div className="mb-5 rounded-2xl border border-indigo-400/20 bg-white/5 p-4">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-300">
                What you get
              </div>
              <div className="text-sm font-semibold text-white">
                3 supplier contact unlocks included every month
              </div>
              <div className="mt-1 text-xs leading-relaxed text-slate-400">
                Plus priority matching, better support and a smoother reorder flow.
              </div>
            </div>

            <div className="mb-5 h-px bg-white/10" />

            <div className="flex flex-1 flex-col gap-3">
              {proFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 text-cyan-400">✓</span>
                  <span className="text-sm text-indigo-100">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => handleProPayment(currentPlan)}
                disabled={loading !== null}
                className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 disabled:opacity-60"
              >
                {loading === currentPlan ? "Processing..." : "Pay with Paystack"}
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

          {/* Enterprise */}
          <div className="flex h-full flex-col rounded-3xl border border-white/7 bg-[#111827] p-6">
            <div className="mb-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Enterprise
              </div>
              <div className="mb-2 text-4xl font-black tracking-tight text-white">
                Custom
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                For large buyers, sourcing teams and businesses with ongoing volume.
              </p>
            </div>

            <div className="mb-5 h-px bg-white/7" />

            <div className="flex flex-1 flex-col gap-3">
              {enterpriseFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 text-amber-400">✓</span>
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <a
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 block rounded-xl border border-amber-500/20 bg-amber-500/10 py-3 text-center text-sm font-bold text-amber-400 no-underline"
            >
              Talk to us on WhatsApp
            </a>
          </div>
        </section>

        {/* Comparison / trust */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/7 bg-[#111827] p-5">
            <div className="mb-2 text-sm font-bold text-white">Built for fabric buyers</div>
            <p className="text-sm leading-relaxed text-slate-500">
              This is not generic software. Weinly is designed around real sourcing
              pain points buyers face when dealing with suppliers in China.
            </p>
          </div>

          <div className="rounded-3xl border border-white/7 bg-[#111827] p-5">
            <div className="mb-2 text-sm font-bold text-white">Reduce costly mistakes</div>
            <p className="text-sm leading-relaxed text-slate-500">
              Better request formatting, quote visibility and guided unlock flow help
              buyers avoid rushing into the wrong supplier.
            </p>
          </div>

          <div className="rounded-3xl border border-white/7 bg-[#111827] p-5">
            <div className="mb-2 text-sm font-bold text-white">Scale with confidence</div>
            <p className="text-sm leading-relaxed text-slate-500">
              Whether you are buying for retail, wholesale or custom production, Weinly
              gives you a more structured sourcing workflow.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10">
          <div className="mb-3 inline-block rounded-full bg-indigo-500/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
            FAQ
          </div>

          <h2 className="mb-8 text-2xl font-black tracking-tight text-white md:text-3xl">
            Frequently asked questions
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-white/7 bg-white/4 p-5">
                <h3 className="mb-2 text-sm font-bold text-white">{faq.q}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Desktop-only closing CTA */}
        <section className="hidden md:block rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-900/60 to-violet-900/60 p-8 text-center">
          <h2 className="mb-3 text-3xl font-black tracking-tight text-white">
            Ready to move faster with Weinly Pro?
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-slate-400">
            Upgrade when you are ready to unlock suppliers faster, get better support,
            and source more confidently from China.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleProPayment(currentPlan)}
              disabled={loading !== null}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60"
            >
              {loading === currentPlan ? "Processing..." : "Choose Pro"}
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